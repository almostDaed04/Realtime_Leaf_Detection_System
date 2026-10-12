# AI Service Model Weights

Place your trained model weights in this directory:

## Required Files

### 1. YOLOv8 Leaf Detector
- **Filename**: `yolov8n.pt` (or custom fine-tuned weights)
- **Source**: Download pretrained from [Ultralytics](https://github.com/ultralytics/ultralytics) or fine-tune on a leaf dataset
- **If missing**: The service will auto-download the default YOLOv8 nano weights (generic object detection, not leaf-specific)

### 2. CNN Leaf Classifier
- **Filename**: `leaf_classifier.pth`
- **Architecture**: MobileNetV2 with 5-class output head
- **Training**: See the training pipeline documentation
- **If missing**: The service runs in DEMO MODE with random weights (predictions are meaningless)

## Training the Classifier

```bash
# From the ai-service directory:
python train.py --data_dir /path/to/leaf_dataset --epochs 50 --batch_size 32
```

## Species Labels (Alphabetical PyTorch ImageFolder order)
1. Guava
2. Lemon
3. Lychee
4. Mango
5. Olive
