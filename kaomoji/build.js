/*
 * 从 data.txt 生成 index.html。
 *
 * 所有格子都写成静态 HTML，页面在没有 JavaScript 的环境里（比如手机上的
 * 文件预览器）也能看到全部内容、长按选中复制。脚本只负责点击复制、搜索、
 * 收藏这些增强功能。
 *
 * 用法：node build.js
 */
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const PART_CATS = ["脸的零件", "装饰符号", "边框分隔"];

/* ---------- 读数据 ---------- */
const lines = fs.readFileSync(path.join(DIR, "data.txt"), "utf8").split("\n");
const cats = new Map();
const seen = new Map();
let cat = null;

lines.forEach((line, i) => {
  if (!line.trim()) return;
  if (line.startsWith("##")) {
    cat = line.slice(2).trim();
    if (!cats.has(cat)) cats.set(cat, []);
    return;
  }
  const parts = line.split("~~~");
  if (parts.length !== 2) throw new Error(`data.txt 第 ${i + 1} 行格式不对：${line}`);
  if (!cat) throw new Error(`data.txt 第 ${i + 1} 行在任何 ## 分类之前`);
  const [text, keys] = parts;
  /* 同一个颜文字只出现一次，重复出现时把关键词并进去 */
  const dup = seen.get(text);
  if (dup) { dup.k += " " + keys + " " + cat; return; }
  const item = { t: text, k: keys + " " + cat };
  seen.set(text, item);
  cats.get(cat).push(item);
});

/* 零件类排到最后，表情先看 */
const order = [...cats.keys()].filter(c => !PART_CATS.includes(c)).concat(PART_CATS);

/* ---------- 生成 HTML ---------- */
const esc = s => s
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const slug = name => "cat-" + order.indexOf(name);

/* 分类链接：没有脚本时点了会跳到对应分区 */
const chips = order.map(name =>
  `      <a class="chip" href="#${slug(name)}">${esc(name)}</a>`
).join("\n");

/* 全屏目录：每个分类一格，带数量 */
const menu = order.map(name =>
  `    <a href="#${slug(name)}">${esc(name)}` +
  `<span class="n">${(cats.get(name) || []).length}</span></a>`
).join("\n");

const sections = order.map(name => {
  const list = cats.get(name) || [];
  const isParts = PART_CATS.includes(name);
  const tiles = list.map(it =>
    `        <div class="tile" role="button" tabindex="0"` +
    ` data-t="${esc(it.t)}" data-k="${esc(it.k)}">` +
    `<span>${esc(it.t)}</span>` +
    `<button class="fav" type="button" aria-label="收藏" aria-pressed="false">♡</button>` +
    `</div>`
  ).join("\n");

  return `    <section id="${slug(name)}" data-c="${esc(name)}">
      <div class="sechead">
        <h2>${esc(name)}</h2>
        <div class="rule"></div>
        <span class="count">${list.length} 个</span>
      </div>
      <div class="grid${isParts ? " parts" : ""}">
${tiles}
      </div>
    </section>`;
}).join("\n\n");

const total = seen.size;
const html = fs.readFileSync(path.join(DIR, "template.html"), "utf8")
  .replace("__SECTIONS__", sections)
  .replace("__CHIPS__", chips)
  .replace("__MENU__", menu)
  .replace("__TOTAL__", String(total));

["__SECTIONS__", "__CHIPS__", "__MENU__", "__TOTAL__"].forEach(mark => {
  if (html.includes(mark)) throw new Error(`template.html 里的 ${mark} 没有被替换`);
});

fs.writeFileSync(path.join(DIR, "index.html"), html);
console.log(`index.html: ${total} 个条目，${order.length} 个分类，${(html.length / 1024).toFixed(0)} KB`);
