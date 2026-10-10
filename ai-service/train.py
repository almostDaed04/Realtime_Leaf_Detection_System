import os
import csv
import argparse
from pathlib import Path
from PIL import Image

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models

# The 5 species we actually care about (must match API exactly)
TARGET_SPECIES = ["Mango", "Guava", "Apple", "Cherry", "Peach"]

class RoboflowCSVDataset(Dataset):
    """
    Reads a Roboflow multiclass dataset structure:
      dataset_folder/
        train/
          _classes.csv
          image1.jpg
          ...
        valid/
          _classes.csv
          ...
          
    It scans the CSV, finds the columns for our 5 TARGET_SPECIES, and ignores 
    any rows (images) that belong to other random leaves.
    """
    def __init__(self, root_dir, split="train", transform=None):
        self.split_dir = Path(root_dir) / split
        self.transform = transform
        self.samples = []
        
        csv_path = self.split_dir / "_classes.csv"
        if not csv_path.exists():
            print(f"Warning: No _classes.csv found in {self.split_dir}. Skipping...")
            return

        with open(csv_path, 'r') as f:
            reader = csv.reader(f)
            header = next(reader)
            
            # Find which column indices correspond to our 5 target species
            # Clean up header spaces/newlines just in case
            header = [h.strip() for h in header]
            
            target_indices = {}
            for i, target in enumerate(TARGET_SPECIES):
                try:
                    # Find column index in CSV for this target
                    col_idx = header.index(target)
                    target_indices[target] = (col_idx, i)  # (CSV column index, our label 0-4)
                except ValueError:
                    print(f"WARNING: Species '{target}' not found in CSV header!")

            # Read all rows
            for row in reader:
                filename = row[0].strip()
                
                # Check if this image belongs to one of our 5 targets
                matched_label = -1
                for target, (col_idx, label_idx) in target_indices.items():
                    if int(row[col_idx].strip()) == 1:
                        matched_label = label_idx
                        break
                        
                # If it's a target leaf, add it! Otherwise, skip it.
                if matched_label != -1:
                    img_path = self.split_dir / filename
                    if img_path.exists():
                        self.samples.append((str(img_path), matched_label))

        print(f"Loaded {len(self.samples)} valid target images from {split} folder.")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        
        if self.transform:
            image = self.transform(image)
            
        return image, label


def train_model(dataset_path: str, epochs: int = 5, batch_size: int = 32):
    # 1. Define image preprocessing (matches the API service)
    transform = transforms.Compose([
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

    # 2. Load the Dataset (Combine train and valid for maximum data)
    print("\nScanning Roboflow dataset for the 5 target species...")
    train_dataset = RoboflowCSVDataset(dataset_path, split="train", transform=transform)
    valid_dataset = RoboflowCSVDataset(dataset_path, split="valid", transform=transform)
    
    # Combine them
    full_dataset = torch.utils.data.ConcatDataset([train_dataset, valid_dataset])
    if len(full_dataset) == 0:
        print("ERROR: No images found for the target species! Check your dataset path.")
        return
        
    dataloader = DataLoader(full_dataset, batch_size=batch_size, shuffle=True, num_workers=4)
    print(f"\nTotal Target Images to train on: {len(full_dataset)}")

    # 3. Build the MobileNetV2 Model
    print("\nBuilding MobileNetV2 model...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    
    # Freeze early layers (Transfer Learning)
    for param in model.parameters():
        param.requires_grad = False
        
    # Replace final classification head
    model.classifier[1] = nn.Linear(model.last_channel, len(TARGET_SPECIES))
    model = model.to(device)

    # 4. Setup Optimizer & Loss function
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)

    # 5. Training Loop
    print("\nStarting Training Loop...")
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for batch_idx, (inputs, labels) in enumerate(dataloader):
            inputs, labels = inputs.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
            if batch_idx % 10 == 0:
                print(f"Epoch [{epoch+1}/{epochs}] Batch {batch_idx}/{len(dataloader)} "
                      f"Loss: {loss.item():.4f} Acc: {100 * correct / total:.2f}%")

        epoch_loss = running_loss / len(dataloader)
        epoch_acc = 100 * correct / total
        print(f"==== Epoch {epoch+1} Completed | Average Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.2f}% ====\n")

    # 6. Save the trained weights to the models directory
    models_dir = Path(__file__).parent / "models"
    models_dir.mkdir(exist_ok=True)
    save_path = models_dir / "leaf_classifier.pth"
    
    print(f"Saving trained weights to: {save_path}")
    torch.save(model.state_dict(), save_path)
    print("\n✅ Training Complete!")
    print("The API will now automatically load these weights and stop using Demo Mode.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the Leaf Classification Model from Roboflow CSV")
    parser.add_argument("--dataset", type=str, required=True, help="Path to your dataset folder")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    
    args = parser.parse_args()
    train_model(args.dataset, args.epochs)
