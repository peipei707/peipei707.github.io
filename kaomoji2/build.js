#!/usr/bin/env node
/*
 * 颜文字图鉴 · 构建脚本（Node 18+，没有任何依赖）
 *
 *   node build.js                     读 data/、words.txt、src/，生成 index.html
 *   node build.js --fragment 文件名    另外生成一份不带 <html>/<head>/<body> 外壳的页面
 *   node build.js --stats             只打印数据统计，不写文件
 *
 * 生成的 index.html 是一个独立文件：样式、脚本、数据、字体全在里面，离线也能打开。
 * 所有颜文字都直接写成静态 HTML，没有 JavaScript 的环境也能看到、长按复制。
 */
const fs = require("fs");
const path = require("path");
const U = require("./src/unicode.js");

const DIR = __dirname;
const read = f => fs.readFileSync(path.join(DIR, f), "utf8");
const args = process.argv.slice(2);
const warn = msg => console.warn("  ! " + msg);

/* ---------- 读颜文字 ---------- */
const groups = [];
const cats = [];
const items = [];
const byText = new Map();

const dataFiles = fs.readdirSync(path.join(DIR, "data")).filter(f => f.endsWith(".txt")).sort();
for (const file of dataFiles) {
  let group = null;
  let cat = null;
  read("data/" + file).split(/\r?\n/).forEach((line, n) => {
    const where = `data/${file} 第 ${n + 1} 行`;
    if (!line.trim()) return;

    if (line.startsWith("## ")) {
      const [id, name, face, desc, tags = ""] = line.slice(3).split(" | ").map(s => s.trim());
      if (!group) throw new Error(`${where}：分类写在了任何 # 组之前`);
      if (!id || !name || !face || !desc) throw new Error(`${where}：应为 "## id | 名字 | 代表脸 | 一句话 | 标签"`);
      if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error(`${where}：分类 id 只能用小写字母、数字和横线`);
      if (cats.some(c => c.id === id)) throw new Error(`${where}：分类 id "${id}" 重复了`);
      cat = { id, name, face, desc, tags: tags.split(/\s+/).filter(Boolean), group: groups.length - 1, items: [] };
      group.cats.push(cats.length);
      cats.push(cat);
      return;
    }
    if (line.startsWith("# ")) {
      const [id, name, desc] = line.slice(2).split(" | ").map(s => s.trim());
      if (!id || !name || !desc) throw new Error(`${where}：应为 "# id | 名字 | 一句话"`);
      group = { id, name, desc, cats: [] };
      groups.push(group);
      cat = null;
      return;
    }
    if (!cat) throw new Error(`${where}：颜文字写在了任何 ## 分类之前`);

    const tab = line.lastIndexOf("\t");
    let text = (tab >= 0 ? line.slice(0, tab) : line).replace(/\s+$/, "");
    const tags = tab >= 0 ? line.slice(tab + 1).trim().split(/\s+/).filter(Boolean) : [];
    if (tags.includes("多行")) text = text.replace(/\\n/g, "\n");
    if (!text.trim()) throw new Error(`${where}：颜文字是空的`);

    let it = byText.get(text);
    if (!it) {
      it = { i: items.length, t: text, tags: [], cats: [] };
      byText.set(text, it);
      items.push(it);
    }
    for (const tg of tags) if (!it.tags.includes(tg)) it.tags.push(tg);
    const ci = cats.length - 1;
    if (it.cats.includes(ci)) { warn(`${where}：「${text}」在「${cat.name}」里重复了`); return; }
    it.cats.push(ci);
    cat.items.push(it.i);
  });
}

for (const it of items) {
  it.lv = U.level(it.t);
  it.ml = it.t.includes("\n");
  it.w = Math.max(...it.t.split("\n").map(l => U.width(l, 1.5)));
}

/* ---------- 读搜索词典 ---------- */
const words = {};
read("words.txt").split(/\r?\n/).forEach((line, n) => {
  line = line.trim();
  if (!line || line.startsWith("//")) return;
  const eq = line.indexOf("=");
  if (eq < 0) throw new Error(`words.txt 第 ${n + 1} 行：缺少等号`);
  const targets = line.slice(eq + 1).trim().split(/\s+/).filter(Boolean);
  for (const alias of line.slice(0, eq).trim().toLowerCase().split(/\s+/).filter(Boolean)) {
    const cur = words[alias] ? words[alias].split(" ") : [];
    for (const t of targets) if (!cur.includes(t)) cur.push(t);
    words[alias] = cur.join(" ");
  }
});
{
  const known = new Set();
  items.forEach(it => it.tags.forEach(t => known.add(t)));
  cats.forEach(c => { known.add(c.name); c.tags.forEach(t => known.add(t)); });
  const missing = new Set();
  Object.values(words).forEach(v => v.split(" ").forEach(t => { if (!known.has(t)) missing.add(t); }));
  if (missing.size) warn(`words.txt 里这些词在颜文字里一个都搜不到：${[...missing].join(" ")}`);
}

/* ---------- 统计 ---------- */
if (args.includes("--stats")) {
  console.log(`${items.length} 个不同的颜文字，${cats.length} 个分类，${groups.length} 组`);
  for (const g of groups) {
    console.log(`  ${g.name}：` + g.cats.map(ci => `${cats[ci].name} ${cats[ci].items.length}`).join("，"));
  }
  const lv = [0, 0, 0];
  items.forEach(it => lv[it.lv]++);
  console.log(`少见程度：常见 ${lv[0]}，大部分设备有 ${lv[1]}，可能显示成方框 ${lv[2]}`);
  const freq = new Map();
  items.forEach(it => { for (const ch of new Set(it.t)) if (ch.trim()) freq.set(ch, (freq.get(ch) || 0) + 1); });
  const top = [...freq].sort((a, b) => b[1] - a[1]);
  const unnamed = top.filter(([ch]) => !U.NAMES[ch]).slice(0, 400);
  console.log(`没有名字的常用字符（前 400）：`);
  console.log(unnamed.map(([ch, n]) => `${ch}:${n}`).join(" "));
  process.exit(0);
}

/* ---------- 拼 HTML ---------- */
const esc = s => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pad = (n, w) => String(n).padStart(w, "0");
const TINTS = 6;
const tint = ci => cats[ci].group % TINTS;

const tileClass = it => "k" + (it.ml ? " ml" : "") + (it.lv === 2 ? " rare" : "");

const tile = it =>
  `<div class="${tileClass(it)}" role="button" tabindex="0" data-i="${it.i}">${esc(it.t)}</div>`;

const toc = groups.map((g, gi) =>
  `<div class="toc-g" data-g="${gi}">` +
  `<p class="toc-gh"><span>${esc(g.name)}</span><small>${g.cats.reduce((n, ci) => n + cats[ci].items.length, 0)}</small></p>` +
  g.cats.map(ci => {
    const c = cats[ci];
    return `<a class="toc-c t${tint(ci)}" href="#c-${c.id}" data-c="${ci}">` +
      `<span class="toc-face">${esc(c.face)}</span>` +
      `<span class="toc-name">${esc(c.name)}</span>` +
      `<span class="toc-n">${c.items.length}</span></a>`;
  }).join("") +
  `</div>`
).join("\n");

const chips = groups.map((g, gi) =>
  `<span class="chip-g" data-g="${gi}">${esc(g.name)}</span>` +
  g.cats.map(ci => `<a class="chip t${tint(ci)}" href="#c-${cats[ci].id}" data-c="${ci}">${esc(cats[ci].name)}</a>`).join("")
).join("");

let no = 0;
const sections = groups.map((g, gi) =>
  `<div class="grp" id="g-${g.id}" data-g="${gi}">\n` +
  `<header class="grp-h"><h2>${esc(g.name)}</h2><p>${esc(g.desc)}</p></header>\n` +
  g.cats.map(ci => {
    const c = cats[ci];
    no++;
    return `<section class="cat t${tint(ci)}" id="c-${c.id}" data-c="${ci}">\n` +
      `<header class="cat-h">` +
      `<span class="cat-no">No.${pad(no, 2)}</span>` +
      `<h3 class="cat-name"><span class="tape">${esc(c.name)}</span></h3>` +
      `<span class="cat-n">${c.items.length} 张</span>` +
      `<p class="cat-d">${esc(c.desc)}</p>` +
      `<span class="cat-face" aria-hidden="true">${esc(c.face)}</span>` +
      `</header>\n` +
      `<div class="grid">\n${c.items.map(i => tile(items[i])).join("\n")}\n</div>\n</section>`;
  }).join("\n") +
  `\n</div>`
).join("\n");

const data = {
  g: groups.map(g => [g.id, g.name, g.desc, g.cats]),
  c: cats.map(c => [c.id, c.name, c.face, c.desc, c.tags.join(" "), c.group, c.items]),
  i: items.map(it => [it.t, it.tags.join(" "), it.cats, it.lv]),
  w: words
};
const json = JSON.stringify(data).replace(/</g, "\\u003c");

/* 标题字体：src/fonts/display.woff2 是从站酷快乐体裁出来的子集，见 src/fonts/README.md */
let fontFace = "";
const fontFile = path.join(DIR, "src/fonts/display.woff2");
if (fs.existsSync(fontFile)) {
  const b64 = fs.readFileSync(fontFile).toString("base64");
  fontFace = `@font-face{font-family:"KMJ Display";src:url(data:font/woff2;base64,${b64}) format("woff2");font-display:swap}\n`;
  const charsFile = path.join(DIR, "src/fonts/display-chars.txt");
  if (fs.existsSync(charsFile)) {
    const have = new Set(Array.from(fs.readFileSync(charsFile, "utf8")));
    const need = new Set();
    [...groups.map(g => g.name), ...cats.map(c => c.name)].forEach(s => { for (const ch of s) need.add(ch); });
    const lack = [...need].filter(ch => !have.has(ch) && ch.trim());
    if (lack.length) warn(`标题字体里没有这些字，会用系统字体代替（重跑 src/fonts/subset.py 可以补上）：${lack.join("")}`);
  }
} else {
  warn("没找到 src/fonts/display.woff2，标题会用系统字体");
}

const total = items.length;
const fill = (s, map) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in map ? map[k] : m));
const vars = {
  TOTAL: String(total),
  TOTAL_FMT: total.toLocaleString("en-US"),
  CATS: String(cats.length),
  GROUPS: String(groups.length)
};

const [headTpl, bodyTpl] = read("src/page.html").split("<!-- ===== body ===== -->");
if (!bodyTpl) throw new Error("src/page.html 里缺少 <!-- ===== body ===== --> 分隔线");

const css = fontFace + read("src/style.css");
const js = [read("src/unicode.js"), read("src/app.js"), read("src/lab.js")].join("\n;\n");

const head = fill(headTpl.trim(), vars).replace("/*KMJ:STYLE*/", () => css);
const body = fill(bodyTpl.trim(), vars)
  .replace("<!--KMJ:TOC-->", () => toc)
  .replace("<!--KMJ:CHIPS-->", () => chips)
  .replace("<!--KMJ:SECTIONS-->", () => sections)
  .replace("/*KMJ:DATA*/", () => json)
  .replace("/*KMJ:SCRIPT*/", () => js.replace(/<\/script/gi, "<\\/script"));

for (const mark of ["KMJ:STYLE", "KMJ:TOC", "KMJ:CHIPS", "KMJ:SECTIONS", "KMJ:DATA", "KMJ:SCRIPT"]) {
  if ((head + body).includes(mark)) throw new Error(`模板里的 ${mark} 没有被替换`);
}

const full = `<!doctype html>\n<html lang="zh-CN">\n<head>\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
fs.writeFileSync(path.join(DIR, "index.html"), full);
console.log(`index.html：${total} 个颜文字，${cats.length} 个分类，${(Buffer.byteLength(full) / 1024).toFixed(0)} KB`);

const fi = args.indexOf("--fragment");
if (fi >= 0) {
  const out = args[fi + 1];
  if (!out) throw new Error("--fragment 后面要跟输出文件名");
  fs.writeFileSync(out, `${head}\n${body}\n`);
  console.log(`${out}：不带外壳的版本`);
}
