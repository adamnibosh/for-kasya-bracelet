"""Generate a plain silver spacer charm image matching letter-link framing."""
from pathlib import Path
from PIL import Image, ImageFilter

out = Path(__file__).resolve().parent.parent / "assets" / "charms"
ref = Image.open(out / "letter-a.jpg").convert("RGB")
w, h = ref.size
blank = Image.new("RGB", (w, h), (255, 255, 255))
px = ref.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        lum = (r + g + b) / 3
        edge = (
            x < w * 0.18
            or y < h * 0.12
            or y > h * 0.88
            or (lum < 210 and (x < w * 0.22 or y < h * 0.15 or y > h * 0.85))
        )
        if edge:
            blank.putpixel((x, y), (r, g, b))
        else:
            shade = 200 + int((x + y) % 7) - 3
            blank.putpixel((x, y), (shade, shade + 2, shade + 5))
blank.filter(ImageFilter.GaussianBlur(radius=0.4)).save(
    out / "blank-silver.jpg", "JPEG", quality=94
)
print("Wrote blank-silver.jpg")