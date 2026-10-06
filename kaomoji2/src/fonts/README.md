# 标题字体

`display.woff2` 是从[站酷快乐体](https://github.com/google/fonts/tree/main/ofl/zcoolkuaile)（ZCOOL KuaiLe，© The ZCOOL KuaiLe Project Authors）裁出来的子集，只包含组名、分类名和 `display-extra.txt` 里的字，构建时以 base64 内嵌进页面，所以页面离线也能显示这个字体。

字体以 [SIL Open Font License 1.1](OFL.txt) 发布，可以自由使用、内嵌和再分发。

改了分类名或界面文字之后，重新裁一次：

```sh
pip install fonttools brotli
python3 src/fonts/subset.py 路径/ZCOOLKuaiLe-Regular.ttf
node build.js
```

不重裁也没关系：缺的字会退回系统字体，`node build.js` 会提示缺了哪些字。
