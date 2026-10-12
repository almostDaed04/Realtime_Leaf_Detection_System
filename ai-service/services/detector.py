"""
YOLOv8-based leaf detection service.
Wraps the Ultralytics YOLO API for leaf detection inference.

NOTE: The default yolov8n.pt is a COCO general-purpose detector (80 classes).
It does NOT have a "leaf" class. When no custom leaf-detector weights are
available, this service uses a fallback strategy:
  1. Run COCO detection to find plant-related objects (class 58 = potted plant).
  2. If nothing plant-related is found, assume the entire image IS the leaf
     (users are instructed to upload single-leaf images against plain backgrounds).
  3. If a custom leaf-detector is loaded, use its detections directly.

To get real leaf detection, train a YOLOv8 model on a leaf dataset and place
the weights at ai-service/models/yolov8n.pt (or set DETECTOR_WEIGHTS env var).
"""

import logging
import os
from pathlib import Path

import torch
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# Path to model weights — check multiple locations
MODELS_DIR = Path(__file__).parent.parent / "models"
PROJECT_ROOT = Path(__file__).parent.parent

# Search order: models/ dir first, then project root, then env override
def _find_weights() -> str:
    env_path = os.getenv("DETECTOR_WEIGHTS")
    if env_path and os.path.exists(env_path):
        return env_path

    candidates = [
        MODELS_DIR / "yolov8n.pt",
        PROJECT_ROOT / "yolov8n.pt",
    ]
    for path in candidates:
        if path.exists():
            return str(path)
    return str(MODELS_DIR / "yolov8n.pt")  # default (may not exist)


DETECTOR_WEIGHTS = _find_weights()

# Detection confidence threshold
DETECTION_CONF = float(os.getenv("DETECTION_CONF", "0.25"))

# COCO class IDs related to plants/nature that could contain leaves
# 58 = potted plant, 56 = broccoli (leafy), 55 = orange (fruit on tree)
PLANT_CLASSES = {58, 56}


class LeafDetector:
    """YOLOv8 leaf detection wrapper."""

    def __init__(self, weights_path: str = DETECTOR_WEIGHTS):
        """
        Initialize the detector.
        If no custom weights are found, downloads the pretrained yolov8n model.
        """
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")

        self._is_custom_model = False

        if os.path.exists(weights_path):
            logger.info(f"Loading detector weights from: {weights_path}")
            self.model = YOLO(weights_path)
            # Check if it's a custom model (not standard COCO 80-class)
            try:
                num_classes = len(self.model.names)
                if num_classes != 80:
                    self._is_custom_model = True
                    logger.info(
                        f"Custom leaf-detector loaded with {num_classes} classes: "
                        f"{list(self.model.names.values())}"
                    )
                else:
                    logger.warning(
                        "Loaded a standard COCO model (80 classes). "
                        "This model does NOT detect 'leaf' objects. "
                        "Using fallback strategy (whole-image-as-leaf). "
                        "Train a custom YOLOv8 model on leaf data for real detection."
                    )
            except Exception:
                pass
        else:
            logger.warning(
                f"Weights not found at {weights_path}. "
                "Loading default yolov8n pretrained model (COCO). "
                "Leaf detection will use fallback strategy."
            )
            self.model = YOLO("yolov8n.pt")

        self.model.to(self.device)

    def detect(self, image_bytes: bytes) -> dict:
        """
        Run leaf detection on an image.

        If a custom leaf-detector is loaded, returns its detections directly.

        If using the default COCO model (no 'leaf' class):
          - Looks for plant-related COCO detections.
          - If none found, falls back to treating the full image as a single leaf
            (with a small margin), since users upload single-leaf images.

        Args:
            image_bytes: Raw image bytes.

        Returns:
            dict with:
                - leaf_count (int): Number of detected leaves
                - boxes (list): List of [x1, y1, x2, y2] bounding boxes
        """
        from PIL import Image
        import io
        import numpy as np

        # Load image from bytes
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_width, img_height = image.size

        # Enforce exact 640x640 resolution
        if img_width != 640 or img_height != 640:
            raise ValueError(f"Image must be exactly 640x640 pixels (received {img_width}x{img_height})")

        # Run YOLO inference
        results = self.model(image, conf=DETECTION_CONF, verbose=False)

        boxes = []
        if results and len(results) > 0:
            result = results[0]
            if result.boxes is not None and len(result.boxes) > 0:
                if self._is_custom_model:
                    # Custom model: trust all detections as leaves
                    for box in result.boxes:
                        xyxy = box.xyxy[0].cpu().numpy().tolist()
                        boxes.append([round(coord, 2) for coord in xyxy])
                else:
                    # COCO model: accept plant-related classes
                    for box in result.boxes:
                        cls_id = int(box.cls[0].item())
                        if cls_id in PLANT_CLASSES:
                            xyxy = box.xyxy[0].cpu().numpy().tolist()
                            boxes.append([round(coord, 2) for coord in xyxy])
                            logger.info(
                                f"COCO plant-class detection: class={self.model.names[cls_id]}, "
                                f"conf={box.conf[0].item():.2f}, box={xyxy}"
                            )

        # Computer vision analysis: detect distinct disconnected leaf regions
        np_img = np.array(image)
        if np_img.ndim == 3 and np_img.shape[2] >= 3:
            r = np_img[:, :, 0].astype(int)
            g = np_img[:, :, 1].astype(int)
            b = np_img[:, :, 2].astype(int)

            # Excess Green Index (ExG) vegetation mask
            exg = 2 * g - r - b
            leaf_mask = (exg > 15) & (g > 35)

            # Divide 640x640 into 16x16 grid of 40x40 pixel tiles
            # Count leaf pixels in each tile
            block_size = 40
            grid_h = img_height // block_size
            grid_w = img_width // block_size
            grid = np.zeros((grid_h, grid_w), dtype=int)

            for gy in range(grid_h):
                for gx in range(grid_w):
                    tile = leaf_mask[gy * block_size:(gy + 1) * block_size, gx * block_size:(gx + 1) * block_size]
                    if np.sum(tile) > 180:  # > 11% of tile is green
                        grid[gy, gx] = 1

            # BFS to find connected components of tiles
            visited = np.zeros_like(grid, dtype=bool)
            distinct_regions = []

            for gy in range(grid_h):
                for gx in range(grid_w):
                    if grid[gy, gx] and not visited[gy, gx]:
                        cluster = []
                        queue = [(gy, gx)]
                        visited[gy, gx] = True
                        while queue:
                            curr_y, curr_x = queue.pop(0)
                            cluster.append((curr_y, curr_x))
                            for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
                                ny, nx = curr_y + dy, curr_x + dx
                                if 0 <= ny < grid_h and 0 <= nx < grid_w and grid[ny, nx] and not visited[ny, nx]:
                                    visited[ny, nx] = True
                                    queue.append((ny, nx))

                        # If cluster is substantial (at least 3 tiles = ~4800px)
                        if len(cluster) >= 3:
                            y_coords = [p[0] for p in cluster]
                            x_coords = [p[1] for p in cluster]
                            box = [
                                float(min(x_coords) * block_size),
                                float(min(y_coords) * block_size),
                                float((max(x_coords) + 1) * block_size),
                                float((max(y_coords) + 1) * block_size),
                            ]
                            distinct_regions.append(box)

            # If computer vision found multiple distinct leaf clusters, reflect that
            if len(distinct_regions) > 1:
                logger.info(f"Multi-leaf cluster analysis detected {len(distinct_regions)} distinct leaves.")
                boxes = distinct_regions
            elif len(boxes) == 0 and len(distinct_regions) == 1:
                boxes = distinct_regions

        # Fallback: if model and color analysis found nothing, treat center image as single leaf
        if not self._is_custom_model and len(boxes) == 0:
            margin_x = img_width * 0.05
            margin_y = img_height * 0.05
            fallback_box = [
                round(margin_x, 2),
                round(margin_y, 2),
                round(img_width - margin_x, 2),
                round(img_height - margin_y, 2),
            ]
            boxes.append(fallback_box)
            logger.info(
                f"Using default single-leaf bounding box for {img_width}x{img_height} image."
            )

        return {
            "leaf_count": len(boxes),
            "boxes": boxes,
        }
