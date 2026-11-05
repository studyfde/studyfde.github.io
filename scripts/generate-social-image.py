"""Regenerate the checked-in social card; not required for npm build.

Requires Pillow and a Chinese font supplied with --font. No external API calls.
"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font", type=Path, required=True, help="Chinese TTF/OTF/TTC font")
    parser.add_argument(
        "--output", type=Path,
        default=Path(__file__).resolve().parents[1] / "assets/fde-learning-roadmap-1200x630.png",
    )
    args = parser.parse_args()
    scale = 2
    image = Image.new("RGB", (1200 * scale, 630 * scale), "#f6f5f1")
    draw = ImageDraw.Draw(image)

    def box(bounds, color, radius=0, outline=None):
        draw.rounded_rectangle(
            tuple(int(value * scale) for value in bounds),
            radius=radius * scale, fill=color, outline=outline, width=2 * scale,
        )

    def text(x, y, value, size, color):
        font = ImageFont.truetype(str(args.font), size * scale)
        draw.text((x * scale, y * scale), value, font=font, fill=color, anchor="lt")

    # Editorial cover, using the site's cream canvas and cobalt accent.
    box((0, 0, 1200, 12), "#1d4ed8")
    box((64, 62, 72, 93), "#1d4ed8", radius=4)
    text(88, 63, "StudyFDE / 中文实战指南", 26, "#3f3f46")
    text(64, 160, "FDE 学习路线", 76, "#18181b")
    text(68, 268, "15 阶段，走向企业 AI 交付", 42, "#1d4ed8")
    text(68, 349, "面向开发者与产品经理", 28, "#3f3f46")
    text(68, 399, "Python · RAG · Agent · 系统集成 · 验收交付", 24, "#3f3f46")

    # A small stack of workbook covers; decorative, not a data diagram.
    box((952, 171, 1136, 423), "#dbeafe", radius=18)
    box((932, 151, 1116, 403), "#eff6ff", radius=18, outline="#bfdbfe")
    box((912, 131, 1096, 383), "#1d4ed8", radius=18)
    text(937, 165, "FDE", 43, "#ffffff")
    box((938, 238, 1068, 242), "#93c5fd", radius=2)
    text(938, 270, "学习 / 实战", 20, "#ffffff")
    text(938, 311, "StudyFDE", 20, "#dbeafe")

    box((64, 505, 1136, 507), "#d4d4d8")
    text(68, 545, "从学习路线，到能交付的项目", 23, "#3f3f46")
    text(858, 546, "studyfde.github.io", 23, "#1d4ed8")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    image.resize((1200, 630), Image.Resampling.LANCZOS).save(args.output, optimize=True)
    print(f"Saved {args.output} ({args.output.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
