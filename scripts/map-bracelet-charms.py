#!/usr/bin/env python3
"""Greedy-match HD zip charms to catalog IDs; detect letters via OCR."""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "example" / "bracelet-zip-raw"
if not SRC.exists():
    SRC = ROOT / "example" / "bracelet-zip"
OLD = ROOT / "assets" / "charms"
OUT = ROOT / "assets" / "charms-hd"
TARGET = 512
WHITE_THRESH = 248

# Import helpers from sibling script
import importlib.util

spec = importlib.util.spec_from_file_location(
    "proc", ROOT / "scripts" / "process-bracelet-zip.py"
)
proc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(proc)


def try_ocr_letter(im: Image.Image) -> str | None:
    try:
        import pytesseract
        from pytesseract import TesseractNotFoundError
    except ImportError:
        return None
    w, h = im.size
    crop = im.crop((int(w * 0.15), int(h * 0.2), int(w * 0.85), int(h * 0.8)))
    gray = ImageOps.grayscale(crop)
    gray = ImageEnhance.Contrast(gray).enhance(2.5)
    gray = gray.point(lambda p: 255 if p > 160 else 0)
    try:
        text = pytesseract.image_to_string(
            gray, config="--psm 10 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        ).strip().upper()
    except TesseractNotFoundError:
        return None
    if len(text) == 1 and text.isalpha():
        return text
    return None


def is_letter_like(im: Image.Image) -> bool:
    w, h = im.size
    px = im.load()
    dark = 0
    total = 0
    for y in range(int(h * 0.25), int(h * 0.75), 2):
        for x in range(int(w * 0.2), int(w * 0.8), 2):
            r, g, b, a = px[x, y]
            if a < 32:
                continue
            total += 1
            if r < 90 and g < 90 and b < 90:
                dark += 1
    return total > 0 and dark / total > 0.08


def load_hd_sources() -> list[tuple[str, Image.Image, Path]]:
    """Load best version of each unique source image."""
    items: list[tuple[str, Image.Image, Path, int]] = []
    for path in sorted(SRC.glob("*")):
        if path.suffix.lower() not in {".webp", ".png", ".jpg", ".jpeg"}:
            continue
        try:
            im = Image.open(path)
            res = max(im.size)
            im = proc.remove_white_bg(im)
            im = proc.enhance(im)
            im = proc.to_square_canvas(im, TARGET)
            stem = path.name.split("~")[0][:12]
            items.append((stem, im, path, res))
        except Exception:
            pass

    # dedupe stems keeping highest resolution
    best: dict[str, tuple[Image.Image, Path, int]] = {}
    for stem, im, path, res in items:
        if stem not in best or res > best[stem][2]:
            best[stem] = (im, path, res)
    return [(s, im, p) for s, (im, p, _) in best.items()]


def fingerprint(im: Image.Image) -> list[int]:
    return proc.fingerprint(im)


def greedy_map(sources: list[tuple[str, Image.Image, Path]]) -> dict[str, tuple[str, Image.Image]]:
    old_fps: dict[str, list[int]] = {}
    for p in OLD.glob("*.jpg"):
        try:
            im = Image.open(p).convert("RGBA")
            white = Image.new("RGBA", im.size, (255, 255, 255, 255))
            white.paste(im, (0, 0))
            im = proc.remove_white_bg(white)
            im = proc.to_square_canvas(im, TARGET)
            old_fps[p.stem] = fingerprint(im)
        except Exception:
            pass

    src_fps = [(stem, fingerprint(im), im) for stem, im, _ in sources]
    assignments: dict[str, tuple[str, Image.Image]] = {}
    used: set[str] = set()

    # OCR pass for letters
    for stem, im, _ in sources:
        letter = try_ocr_letter(im)
        if letter:
            cid = f"letter-{letter.lower()}"
            if cid not in assignments:
                assignments[cid] = (stem, im)
                used.add(stem)

    # Greedy by ascending best MSE per charm
    pairs: list[tuple[float, str, str, Image.Image]] = []
    for charm_id, old_fp in old_fps.items():
        if charm_id in assignments:
            continue
        for stem, fp, im in src_fps:
            if stem in used:
                continue
            score = proc.mse(old_fp, fp)
            pairs.append((score, charm_id, stem, im))
    pairs.sort(key=lambda x: x[0])

    for score, charm_id, stem, im in pairs:
        if charm_id in assignments or stem in used:
            continue
        if score > 7500:
            continue
        assignments[charm_id] = (stem, im)
        used.add(stem)

    # Letter fallback: match letter-like sources to letter-* only
    letter_fps = {k: v for k, v in old_fps.items() if k.startswith("letter-")}
    for stem, fp, im in src_fps:
        if stem in used or not is_letter_like(im):
            continue
        best_id, best_score = None, float("inf")
        for cid, lfp in letter_fps.items():
            if cid in assignments:
                continue
            s = proc.mse(lfp, fp)
            if s < best_score:
                best_score = s
                best_id = cid
        if best_id and best_score < 9000:
            assignments[best_id] = (stem, im)
            used.add(stem)

    return assignments


def save_mapped(assignments: dict[str, tuple[str, Image.Image]]) -> dict[str, str]:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    charm_paths: dict[str, str] = {}
    for charm_id, (stem, im) in sorted(assignments.items()):
        rel = f"assets/charms-hd/{charm_id}.png"
        im.save(ROOT / rel, "PNG", optimize=True)
        charm_paths[charm_id] = rel
        print(f"  {charm_id} <- {stem}")

    # Save unmapped extras
    sources = load_hd_sources()
    used_stems = {s for s, _ in assignments.values()}
    extra = 0
    for stem, im, _ in sources:
        if stem in used_stems:
            continue
        eid = f"extra-{stem}"
        rel = f"assets/charms-hd/{eid}.png"
        im.save(ROOT / rel, "PNG", optimize=True)
        extra += 1
    print(f"mapped {len(charm_paths)}, extras {extra}")
    return charm_paths


def write_js(charm_paths: dict[str, str]) -> None:
    js = ROOT / "assets" / "js" / "charm-images.js"
    lines = [
        "/** HD transparent charms from bracelet.zip example */",
        "const IMAGE_VERSION = 'v5-hd';",
        "",
        "const CHARM_IMAGE_MAP = {",
    ]
    for k, v in sorted(charm_paths.items()):
        lines.append(f'  "{k}": "{v}",')
    lines.append("};")
    lines += [
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
    js.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {js}")


def main() -> None:
    sources = load_hd_sources()
    print(f"unique sources: {len(sources)}")
    assignments = greedy_map(sources)
    charm_paths = save_mapped(assignments)
    (ROOT / "scripts" / "charm-hd-map.json").write_text(
        json.dumps(charm_paths, indent=2), encoding="utf-8"
    )
    write_js(charm_paths)


if __name__ == "__main__":
    main()