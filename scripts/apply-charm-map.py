#!/usr/bin/env python3
"""Apply verified charm ID -> source stem mapping from bracelet.zip."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "example" / "bracelet-zip-raw"
if not SRC.exists():
    SRC = ROOT / "example" / "bracelet-zip"
OUT = ROOT / "assets" / "charms-hd"
OLD = ROOT / "assets" / "charms"

spec = importlib.util.spec_from_file_location("proc", ROOT / "scripts" / "process-bracelet-zip.py")
proc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(proc)

# Silver raised letters — from Nomination product photos (not black-enamel zip style)
LETTER_STEMS = {}

CHARM_STEMS = {
    "blank-silver": "2c2776f394b2",
    "bmw": "3eb34929c0e8",
    "bow-blue": "7d16b6e1da80",
    "bow-pink": "852fd313ae35",
    "butterfly": "139271dd8198",
    "cat-black": "f057f31fc0fc",
    "checkered-red": "7bc9c162dbab",
    "cherry": "4632fd88fbc1",
    "enamel-blue": "2514e8bcf986",
    "enamel-pink": "f39f22268d7f",
    "flower": "0f93bbed31d3",
    "heart-magnetic": "08d30dbb23ae",
    "heart-pink": "09dffd3b692e",
    "heart-silver": "8d211a7914b3",
    "i-love-u": "da36df2186ad",
    "infinity": "38cb9ce8c572",
    "jellyfish": "40818727d1ce",
    "kitten": "44458849a9be",
    "moon": "824606636ff5",
    "star": "639b7db428bb",
}

# All A–Z silver raised letters + nameplate from product JPGs
FROM_OLD_JPG = [f"letter-{c}" for c in "abcdefghijklmnopqrstuvwxyz"] + ["nameplate"]


def find_source(stem: str) -> Path | None:
    matches = sorted(SRC.glob(f"{stem}*"))
    if not matches:
        return None
    return max(matches, key=lambda p: max(Image.open(p).size))


def process_source(path: Path) -> Image.Image:
    im = Image.open(path)
    im = proc.remove_white_bg(im)
    im = proc.enhance(im)
    return proc.to_square_canvas(im, 512)


def process_old_jpg(charm_id: str) -> Image.Image:
    path = OLD / f"{charm_id}.jpg"
    im = Image.open(path).convert("RGBA")
    white = Image.new("RGBA", im.size, (255, 255, 255, 255))
    white.paste(im, (0, 0))
    im = proc.remove_white_bg(white)
    im = proc.enhance(im)
    return proc.to_square_canvas(im, 512)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    mapping: dict[str, str] = {}

    all_maps = {**CHARM_STEMS}
    for charm_id, stem in sorted(all_maps.items()):
        src = find_source(stem)
        if not src:
            print(f"MISSING source for {charm_id} ({stem})")
            continue
        im = process_source(src)
        out = OUT / f"{charm_id}.png"
        im.save(out, "PNG", optimize=True)
        mapping[charm_id] = f"assets/charms-hd/{charm_id}.png"
        print(f"{charm_id} <- {src.name[:20]}")

    for charm_id in FROM_OLD_JPG:
        im = process_old_jpg(charm_id)
        out = OUT / f"{charm_id}.png"
        im.save(out, "PNG", optimize=True)
        mapping[charm_id] = f"assets/charms-hd/{charm_id}.png"
        print(f"{charm_id} <- old jpg")

    (ROOT / "scripts" / "charm-hd-map.json").write_text(json.dumps(mapping, indent=2), encoding="utf-8")

    lines = [
        "/** HD transparent charms from bracelet.zip example */",
        "const IMAGE_VERSION = 'v5-hd';",
        "",
        "const CHARM_IMAGE_MAP = {",
    ]
    for k, v in sorted(mapping.items()):
        lines.append(f'  "{k}": "{v}",')
    lines += [
        "};",
        "",
        "function getCharmImageUrl(charmId) {",
        "  return CHARM_IMAGE_MAP[charmId] || CHARM_IMAGE_MAP['blank-silver'];",
        "}",
        "",
        "/** Resolve path for GitHub Pages subfolder or local dev */",
        "function assetUrl(path) {",
        "  if (typeof document === 'undefined') return path;",
        '  const base = document.querySelector(\'meta[name="base-path"]\')?.content || \'\';',
        "  if (!path || path.startsWith('http') || path.startsWith('data:')) return path;",
        "  const clean = path.replace(/^\\//, '');",
        "  const withBase = (!base || location.hostname === 'localhost' || location.hostname === '127.0.0.1')",
        "    ? clean",
        "    : `${base.replace(/\\/$/, '')}/${clean}`;",
        "  const sep = withBase.includes('?') ? '&' : '?';",
        "  return `${withBase}${sep}v=${IMAGE_VERSION}`;",
        "}",
        "",
    ]
    (ROOT / "assets" / "js" / "charm-images.js").write_text("\n".join(lines), encoding="utf-8")
    print(f"\nDone: {len(mapping)} charms mapped")


if __name__ == "__main__":
    main()