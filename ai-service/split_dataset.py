
import random
import shutil
from pathlib import Path


def split_dataset(source_dir, dest_dir):
    source = Path(source_dir)
    dest = Path(dest_dir)

    classes = ["Lemon", "Lychee", "Guava", "Mango", "Olive"]
    extensions = {".jpg", ".jpeg", ".png"}

    random.seed(42)

    # Split ratios
    train_ratio = 0.70
    valid_ratio = 0.15

    for cls in classes:
        cls_path = source / cls

        if not cls_path.exists():
            print(f"Skipping {cls}: folder not found")
            continue

        images = [
            file for file in cls_path.iterdir()
            if file.is_file() and file.suffix.lower() in extensions
        ]

        if not images:
            print(f"Skipping {cls}: no images found")
            continue

        random.shuffle(images)

        total = len(images)
        train_end = int(total * train_ratio)
        valid_end = train_end + int(total * valid_ratio)

        train_images = images[:train_end]
        valid_images = images[train_end:valid_end]
        test_images = images[valid_end:]

        splits = {
            "train": train_images,
            "valid": valid_images,
            "test": test_images
        }

        for split_name, split_images in splits.items():
            output_dir = dest / split_name / cls
            output_dir.mkdir(parents=True, exist_ok=True)

            for image in split_images:
                shutil.copy2(image, output_dir / image.name)

        print(
            f"{cls}: {len(train_images)} train, "
            f"{len(valid_images)} valid, "
            f"{len(test_images)} test"
        )

    print("\nDataset splitting completed!")
    print(f"Dataset location: {dest.resolve()}")


if __name__ == "__main__":
    print("=== Leaf Dataset Splitter ===")

    source = input("Enter source dataset folder path: ").strip().strip('"')
    dest = input("Enter destination folder path: ").strip().strip('"')

    split_dataset(source, dest)
