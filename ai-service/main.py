"""
FastAPI AI Service for Leaf Identification System.
Exposes /detect, /classify, and /health endpoints.
Models are loaded into memory at startup for low-latency inference.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from routers.detect import router as detect_router
from routers.classify import router as classify_router
from services.detector import LeafDetector
from services.classifier import LeafClassifier

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global model instances (loaded once at startup)
detector: LeafDetector = None
classifier: LeafClassifier = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models at startup, release at shutdown."""
    global detector, classifier

    logger.info("Loading YOLOv8 leaf detection model...")
    detector = LeafDetector()
    logger.info("YOLOv8 model loaded successfully.")

    logger.info("Loading CNN leaf classification model...")
    classifier = LeafClassifier()
    logger.info("CNN model loaded successfully.")

    # Store references in app state for access in routes
    app.state.detector = detector
    app.state.classifier = classifier

    yield

    # Cleanup
    logger.info("Shutting down AI service, releasing model resources.")
    del detector, classifier


app = FastAPI(
    title="Leaf Identification AI Service",
    description="Stateless inference microservice for leaf detection (YOLOv8) and species classification (CNN).",
    version="1.0.0",
    lifespan=lifespan,
)

# Include routers
app.include_router(detect_router, tags=["Detection"])
app.include_router(classify_router, tags=["Classification"])


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint for status check."""
    return {
        "service": "Leaf Identification AI Service",
        "status": "online",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for container orchestration."""
    return {
        "status": "healthy",
        "models": {
            "detector": detector is not None,
            "classifier": classifier is not None,
        },
    }
