
"""
Detection router: POST /detect endpoint.
Accepts an image, runs the existing detector,
and returns the leaf count and bounding boxes.
"""

import logging

from fastapi import APIRouter, File, UploadFile, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()


class DetectionResponse(BaseModel):
    leaf_count: int
    boxes: list[list[float]]


@router.post("/detect", response_model=DetectionResponse)
def detect_leaves(
    request: Request,
    file: UploadFile = File(...)
):
    """Detect leaves in an uploaded image."""

    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG and PNG images are accepted.",
        )

    try:
        image_bytes = file.file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Empty file received.",
            )

        # Use the detector initialized by the application.
        detector = request.app.state.detector
        result = detector.detect(image_bytes)

        if not isinstance(result, dict):
            raise ValueError("Detector must return a dictionary.")

        if "leaf_count" not in result or "boxes" not in result:
            raise ValueError(
                "Detector result must contain 'leaf_count' and 'boxes'."
            )

        logger.info(
            "Detection result: %s leaf(es) found.",
            result["leaf_count"],
        )

        return result

    except HTTPException:
        raise
    except Exception:
        logger.exception("Detection error")
        raise HTTPException(
            status_code=500,
            detail="Internal detection error.",
        )
    finally:
        file.file.close()
