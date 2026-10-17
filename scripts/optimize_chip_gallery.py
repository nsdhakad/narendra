#!/usr/bin/env python3
"""Create responsive WebP display variants for the largest chip-gallery images.

The original files remain untouched and are still linked from each gallery card,
so visitors can open the full-resolution source when they need detail.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "assets" / "gallery"
SOURCES = ("03-quadport.webp", "04-d-imc.webp")
TARGET_WIDTHS = (600, 1200)
QUALITY = 80


def save_variant(source_path: Path, target_path: Path, target_width: int) -> tuple[int, int, int]:
    with Image.open(source_path) as opened:
        image = ImageOps.exif_transpose(opened)
        original_width, original_height = image.size
        if image.width > target_width:
            target_height = max(1, round(image.height * target_width / image.width))
            image = image.resize((target_width, target_height), Image.Resampling.LANCZOS)
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        target_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(target_path, format="WEBP", quality=QUALITY, method=6)
        return original_width, original_height, target_path.stat().st_size


def main() -> None:
    total_source = 0
    total_output = 0
    for filename in SOURCES:
        source = ROOT / filename
        if not source.is_file():
            raise FileNotFoundError(f"Required gallery image not found: {source}")
        total_source += source.stat().st_size
        for width in TARGET_WIDTHS:
            target = OUTPUT_DIR / f"{source.stem}-{width}.webp"
            original_width, original_height, output_size = save_variant(source, target, width)
            total_output += output_size
            print(
                f"{filename} ({original_width}x{original_height}) -> "
                f"{target.relative_to(ROOT)} ({output_size:,} bytes)"
            )
    print(f"Total source size: {total_source:,} bytes")
    print(f"Total responsive variants: {total_output:,} bytes")
    if total_output >= total_source:
        print("Note: responsive variants are not smaller than the combined originals; review source formats.")


if __name__ == "__main__":
    main()
