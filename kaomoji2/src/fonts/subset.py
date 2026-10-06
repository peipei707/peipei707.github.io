#!/usr/bin/env python3
"""
从站酷快乐体（ZCOOL KuaiLe，SIL Open Font License 1.1）裁出标题要用的字，生成 display.woff2。

    pip install fonttools brotli
    python3 src/fonts/subset.py 路径/ZCOOLKuaiLe-Regular.ttf

字体原文件：https://github.com/google/fonts/tree/main/ofl/zcoolkuaile
要用到的字 = 所有组名和分类名 + display-extra.txt 里的界面文字 + ASCII。
改了分类名或界面文字后重跑一遍；不跑也行，缺的字会用系统字体顶上。
"""
import pathlib
import sys

from fontTools import subset

here = pathlib.Path(__file__).resolve().parent
root = here.parent.parent

chars = set()
for f in sorted((root / "data").glob("*.txt")):
    for line in f.read_text("utf8").splitlines():
        if line.startswith("# ") or line.startswith("## "):
            chars.update(line.split(" | ")[1])
chars.update((here / "display-extra.txt").read_text("utf8"))
chars.update(chr(c) for c in range(0x21, 0x7F))
chars.update("，。！？、：；「」『』（）·…—～《》×")
text = "".join(sorted(c for c in chars if not c.isspace())) + " "

if len(sys.argv) < 2:
    sys.exit(__doc__)
(here / "display-chars.txt").write_text(text, "utf8")
subset.main([
    sys.argv[1],
    "--text-file=" + str(here / "display-chars.txt"),
    "--flavor=woff2",
    "--layout-features=*",
    "--output-file=" + str(here / "display.woff2"),
])
print(len(text), "chars ->", (here / "display.woff2").stat().st_size, "bytes")
