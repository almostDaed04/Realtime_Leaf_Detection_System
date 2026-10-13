
"""
YOLO-based leaf species classification service.
Loads trained YOLO classification weights and predicts from image bytes.
"""

import io
import logging
import os
from pathlib import Path

from PIL import Image
from ultralytics import YOLO

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
CLASSIFIER_WEIGHTS = os.getenv(
    "CLASSIFIER_WEIGHTS",
    str(MODELS_DIR / "best.pt"),
)


class LeafClassifier:
    """YOLO leaf species classifier wrapper."""

    def __init__(self, weights_path: str = CLASSIFIER_WEIGHTS):
        self.model_path = Path(weights_path)
        if not self.model_path.is_file():
            raise FileNotFoundError(
                f"Trained classification model not found: {self.model_path}"
            )

        logger.info("Loading YOLO classifier from %s", self.model_path)
        self.model = YOLO(str(self.model_path))

        # Use the class names embedded in the trained model.
        names = self.model.names
        if isinstance(names, dict):
            self.species_labels = [
                names[i] for i in sorted(names)
            ]
        else:
            self.species_labels = list(names)

        self._demo_mode = False
        logger.info("Classifier loaded with classes: %s", self.species_labels)

    @property
    def is_demo_mode(self) -> bool:
        return self._demo_mode

    @property
    def classes(self) -> list:
        return self.species_labels

    def classify(self, image_bytes: bytes) -> dict:
        """Classify a single cropped leaf image from raw image bytes."""
        try:
            with Image.open(io.BytesIO(image_bytes)) as image:
                image = image.convert("RGB")

                results = self.model.predict(
                    source=image,
                    imgsz=224,
                    verbose=False,
                )

            result = results[0]

            if result.probs is None:
                raise RuntimeError(
                    "The loaded model is not a YOLO classification model."
                )

            class_id = int(result.probs.top1)
            confidence = float(result.probs.top1conf) * 100

            species = result.names[class_id]

            logger.info(
                "Prediction: %s (%.2f%%)",
                species,
                confidence,
            )

            return {
                "species": species,
                "confidence": round(confidence, 2),
            }

        except Exception:
            logger.exception("Leaf classification failed")
            raise
