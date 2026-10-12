"""
Detection router: POST /detect endpoint.
Accepts an image, runs YOLOv8 inference, returns leaf count and bounding boxes.
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
def detect_leaves(request: Request, file: UploadFile = File(...)):
    """
    Detect leaves in an uploaded image.

    Returns the number of detected leaves and their bounding boxes
    as [x1, y1, x2, y2] coordinates.
    """
    # Validate file type
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG and PNG images are accepted.",
        )

    try:
        image_bytes = file.file.read()

        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file received.")

        # Validate image dimensions: strictly 640x640 px
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        if width != 640 or height != 640:
            raise HTTPException(
                status_code=400,
                detail=f"Image must be exactly 640x640 pixels. Uploaded image is {width}x{height} pixels.",
            )

        detector = request.app.state.detector
        result = detector.detect(image_bytes)

        # Reject if multiple leaves detected
        if result.get("leaf_count", 0) > 1:
            raise HTTPException(
                status_code=422,
                detail=f"Only one leaf image should be uploaded. Multiple leaves detected ({result['leaf_count']}).",
            )

        logger.info(f"Detection result: {result['leaf_count']} leaf(es) found.")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal detection error.")
