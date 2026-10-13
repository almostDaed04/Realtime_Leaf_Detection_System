"""
Leaf detection service using a Roboflow Cloud workflow.
Exposes detect(image_bytes) -> {"leaf_count": int, "boxes": [[x1, y1, x2, y2], ...]}
"""

import os
import logging
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient

# Explicitly load .env from the ai-service directory
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

logger = logging.getLogger(__name__)

# Minimum detection confidence (0-1)
CONF = float(os.getenv("DETECTION_CONF", "0.25"))

# Set to "1" in .env to log the raw workflow output while debugging
DEBUG_RAW = os.getenv("DETECTOR_DEBUG_RAW", "1") == "1"


class LeafDetector:
    """Roboflow Cloud inference service."""

    def __init__(self):
        api_key = os.getenv("ROBOFLOW_API_KEY")

        self.workspace = os.getenv("ROBOFLOW_WORKSPACE", "manashvi-prajapati")
        # NOTE: this default is a siam weed detector. Set ROBOFLOW_WORKFLOW_ID
        # in .env to a workflow trained to detect leaves.
        self.workflow_id = os.getenv(
            "ROBOFLOW_WORKFLOW_ID", "siamweed-detection-1791832685967"
        )

        if not api_key:
            raise RuntimeError(
                f"ROBOFLOW_API_KEY is missing. Check your .env file at: {ENV_PATH}"
            )

        self.client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=api_key,
        )

        logger.info(
            "Roboflow workflow configured: %s / %s", self.workspace, self.workflow_id
        )

    def predict_bytes(self, image_bytes: bytes) -> dict:
        """Send uploaded image bytes to the Roboflow workflow."""
        if not image_bytes:
            raise ValueError("The uploaded image is empty.")

        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp:
                temp.write(image_bytes)
                temp_path = temp.name

            result = self.client.run_workflow(
                workspace_name=self.workspace,
                workflow_id=self.workflow_id,
                images={"image": temp_path},
            )
            return {"success": True, "result": result}

        except Exception:
            logger.exception("Roboflow inference failed")
            raise

        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    @staticmethod
    def _find_predictions(obj) -> list:
        """Recursively collect prediction dicts (those with x, y, width, height)."""
        if isinstance(obj, dict):
            if all(k in obj for k in ("x", "y", "width", "height")):
                return [obj]
            found = []
            for v in obj.values():
                found += LeafDetector._find_predictions(v)
            return found
        if isinstance(obj, list):
            found = []
            for v in obj:
                found += LeafDetector._find_predictions(v)
            return found
        return []

    def detect(self, image_bytes: bytes) -> dict:
        """Return {"leaf_count": int, "boxes": [[x1, y1, x2, y2], ...]}."""
        raw = self.predict_bytes(image_bytes)["result"]
        if DEBUG_RAW:
            logger.info("Raw workflow output: %s", str(raw)[:1500])

        boxes, seen = [], set()
        for p in self._find_predictions(raw):
            if p.get("confidence", 1.0) < CONF:
                continue

            # Roboflow returns center x, y plus width, height
            x1 = p["x"] - p["width"] / 2
            y1 = p["y"] - p["height"] / 2
            x2 = p["x"] + p["width"] / 2
            y2 = p["y"] + p["height"] / 2

            box = [round(float(v), 2) for v in (x1, y1, x2, y2)]
            if tuple(box) not in seen:  # workflows can emit the same box twice
                seen.add(tuple(box))
                boxes.append(box)

        logger.info("Detection result: %d leaf(es) found.", len(boxes))
        return {"leaf_count": len(boxes), "boxes": boxes}