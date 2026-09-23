"""Rasterize public-domain Natural Earth land polygons for the WebGL globe."""

import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/data/ne_110m_land.geojson"
TARGET = ROOT / "src/assets/design/natural-earth-land-mask.png"
WIDTH, HEIGHT = 720, 360


def unwrap(ring):
    result = []
    previous = None
    for longitude, latitude in ring:
        if previous is not None:
            while longitude - previous > 180:
                longitude -= 360
            while longitude - previous < -180:
                longitude += 360
        result.append((longitude, latitude))
        previous = longitude
    return result


def coordinates(ring, shift):
    return [((longitude + 180) / 360 * WIDTH + shift, (90 - latitude) / 180 * HEIGHT)
            for longitude, latitude in unwrap(ring)]


def main():
    image = Image.new("L", (WIDTH, HEIGHT), 0)
    draw = ImageDraw.Draw(image)
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    for feature in data["features"]:
        rings = feature["geometry"]["coordinates"]
        for shift in (-WIDTH, 0, WIDTH):
            draw.polygon(coordinates(rings[0], shift), fill=255)
            for hole in rings[1:]:
                draw.polygon(coordinates(hole, shift), fill=0)
    image.save(TARGET, optimize=True)
    print(f"{TARGET}: {TARGET.stat().st_size} bytes")


if __name__ == "__main__":
    main()
