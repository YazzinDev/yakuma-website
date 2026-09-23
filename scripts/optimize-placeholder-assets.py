"""Build WebP variants for remaining opaque placeholder images.

The original PNG files remain as source assets. Only opaque RGB placeholders are
converted here; the transparent Hoshi cutouts stay lossless in their original PNGs.
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "src" / "assets" / "pencil-placeholders"


def main():
    for source in sorted(ASSETS.glob("*.png")):
        with Image.open(source) as image:
            if image.mode != "RGB":
                continue
            target = source.with_suffix(".webp")
            image.save(target, format="WEBP", quality=90, method=6)
            with Image.open(target) as optimized:
                rms = ImageStat.Stat(ImageChops.difference(image, optimized)).rms
            print(f"{source.name}: {source.stat().st_size} -> {target.stat().st_size} bytes; RGB RMS {max(rms):.2f}")


if __name__ == "__main__":
    main()
