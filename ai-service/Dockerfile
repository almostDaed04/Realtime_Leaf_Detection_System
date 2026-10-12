FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV / image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install lightweight CPU-only PyTorch first (avoids Render Free 512MB RAM OOM)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hugging Face Spaces requires port 7860; Render/cloud platforms inject their own PORT
ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
