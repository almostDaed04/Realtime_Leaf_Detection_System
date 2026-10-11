
import argparse
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

# Must match the folders in your dataset
TARGET_SPECIES = ["Guava", "Lemon", "Lychee", "Mango", "Olive"]


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)

            total_loss += loss.item() * labels.size(0)
            predictions = outputs.argmax(dim=1)

            total += labels.size(0)
            correct += (predictions == labels).sum().item()

    if total == 0:
        return 0.0, 0.0

    return total_loss / total, 100.0 * correct / total


def train_model(dataset_path, epochs=10, batch_size=32):
    dataset_path = Path(dataset_path)

    # Random augmentation only for training
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])

    # Consistent preprocessing for validation and testing
    eval_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])

    print("Loading leaf images...")

    train_dataset = datasets.ImageFolder(
        dataset_path / "train",
        transform=train_transform,
    )
    valid_dataset = datasets.ImageFolder(
        dataset_path / "valid",
        transform=eval_transform,
    )
    test_dataset = datasets.ImageFolder(
        dataset_path / "test",
        transform=eval_transform,
    )

    # Verify labels match the expected species
    expected_classes = sorted(TARGET_SPECIES)

    if train_dataset.classes != expected_classes:
        raise ValueError(
            f"Unexpected training classes: {train_dataset.classes}\n"
            f"Expected: {expected_classes}"
        )

    if (
        valid_dataset.class_to_idx != train_dataset.class_to_idx
        or test_dataset.class_to_idx != train_dataset.class_to_idx
    ):
        raise ValueError(
            "Train, valid, and test folders must have identical class folders."
        )

    if len(train_dataset) == 0 or len(valid_dataset) == 0 or len(test_dataset) == 0:
        raise ValueError("Train, valid, and test datasets must all contain images.")

    print("Class mapping:", train_dataset.class_to_idx)
    print(f"Training images:   {len(train_dataset)}")
    print(f"Validation images: {len(valid_dataset)}")
    print(f"Test images:       {len(test_dataset)}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("Using device:", device)

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
    )
    valid_loader = DataLoader(
        valid_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
    )
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
    )

    print("Loading MobileNetV2...")
    model = models.mobilenet_v2(
        weights=models.MobileNet_V2_Weights.DEFAULT
    )

    # Freeze the pretrained feature extractor
    for param in model.features.parameters():
        param.requires_grad = False

    model.classifier[1] = nn.Linear(
        model.last_channel, len(train_dataset.classes)
    )
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)

    best_valid_acc = -1.0

    models_dir = Path(__file__).parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    save_path = models_dir / "leaf_classifier.pth"

    print("\nStarting training...")

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()

            outputs = model(images)
            loss = criterion(outputs, labels)

            loss.backward()
            optimizer.step()

            running_loss += loss.item() * labels.size(0)
            predictions = outputs.argmax(dim=1)
            total += labels.size(0)
            correct += (predictions == labels).sum().item()

        train_loss = running_loss / total
        train_acc = 100.0 * correct / total

        valid_loss, valid_acc = evaluate(
            model, valid_loader, criterion, device
        )

        print(
            f"Epoch {epoch + 1}/{epochs} | "
            f"Train Loss: {train_loss:.4f} | "
            f"Train Acc: {train_acc:.2f}% | "
            f"Valid Loss: {valid_loss:.4f} | "
            f"Valid Acc: {valid_acc:.2f}%"
        )

        # Save the best model based on validation accuracy
        if valid_acc > best_valid_acc:
            best_valid_acc = valid_acc

            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "classes": train_dataset.classes,
                    "class_to_idx": train_dataset.class_to_idx,
                    "input_size": 224,
                    "architecture": "mobilenet_v2",
                },
                save_path,
            )

            print(f"Best model saved to: {save_path}")

    # Reload the best checkpoint before final testing
    checkpoint = torch.load(save_path, map_location=device, weights_only=True)
    model.load_state_dict(checkpoint["model_state_dict"])

    test_loss, test_acc = evaluate(
        model, test_loader, criterion, device
    )

    print("\nTraining complete!")
    print(f"Best validation accuracy: {best_valid_acc:.2f}%")
    print(f"Final test accuracy:      {test_acc:.2f}%")
    print(f"Test loss:                {test_loss:.4f}")
    print(f"Model saved at:            {save_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dataset",
        type=str,
        required=True,
        help="Path to merged_dataset",
    )
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=32)

    args = parser.parse_args()

    train_model(
        args.dataset,
        epochs=args.epochs,
        batch_size=args.batch_size,
    )
