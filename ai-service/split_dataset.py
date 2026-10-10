import os
import shutil
import random
from pathlib import Path

def split_dataset(source_dir, dest_dir, split_ratio=0.8):
    source = Path(source_dir)
    dest = Path(dest_dir)
    
    # Create target directories
    train_dir = dest / 'train'
    valid_dir = dest / 'valid'
    
    # Allowed classes
    classes = ["Mango", "Guava", "Apple", "Cherry", "Peach"]
    
    for cls in classes:
        cls_path = source / cls
        if not cls_path.exists():
            print(f"Skipping {cls} - folder not found in {source_dir}")
            continue
            
        # Get all images in this class folder
        images = [f for f in os.listdir(cls_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        random.shuffle(images)
        
        # Calculate split index
        split_idx = int(len(images) * split_ratio)
        train_imgs = images[:split_idx]
        valid_imgs = images[split_idx:]
        
        # Create destination class folders
        (train_dir / cls).mkdir(parents=True, exist_ok=True)
        (valid_dir / cls).mkdir(parents=True, exist_ok=True)
        
        # Copy files
        print(f"Copying {cls}... ({len(train_imgs)} train, {len(valid_imgs)} valid)")
        for img in train_imgs:
            shutil.copy2(cls_path / img, train_dir / cls / img)
        for img in valid_imgs:
            shutil.copy2(cls_path / img, valid_dir / cls / img)
            
    print("\nDataset successfully split!")
    print(f"Your ready-to-train data is located at: {dest.absolute()}")

if __name__ == "__main__":
    print("=== Dataset Splitter ===")
    print("Make sure you have a folder containing your 5 leaf folders.")
    
    source = input("Enter the path to your folder containing the 5 leaf folders: ").strip()
    dest = input("Enter the path where you want the new merged dataset to be created: ").strip()
    
    split_dataset(source, dest)
