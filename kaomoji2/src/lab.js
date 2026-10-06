/* 颜文字图鉴 · 实验室：捏脸机、连发剧本、举牌喊话、花式文字、颜文字签、扭蛋机 */
(function (K) {
  "use strict";
  if (!K) return;
  var $ = K.$, $$ = K.$$, esc = K.esc, U = K.U;
  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function every(fn, ms) { var t = setInterval(fn, ms); timers.push(t); return t; }
  function stopAll() { timers.forEach(function (t) { clearTimeout(t); clearInterval(t); }); timers = []; }
  var rnd = function (n) { return Math.floor(Math.random() * n); };
  var pickOne = function (a) { return a[rnd(a.length)]; };
  function seeded(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var copyBtn = function (text, label) {
    return '<button class="btn sm" type="button" data-copy="' + esc(text) + '">' + (label || "复制") + "</button>";
  };

  var TOOLS = [
    { id: "face", name: "捏脸机", tint: 5, desc: "眼睛、嘴巴、手、脸型，一格一格换，拼一张世界上还没有的脸。" },
    { id: "combo", name: "连发剧本", tint: 4, desc: "一句一句发出去，对面的聊天框里就会演一段小动画。" },
    { id: "sign", name: "举牌喊话", tint: 0, desc: "把想说的话写上牌子，或者用「突然的死」大声喊出来。" },
    { id: "fx", name: "花式文字", tint: 1, desc: "删除线、鬼畜字、字间加料、英文花体，发出去自带特效。" },
    { id: "luck", name: "颜文字签", tint: 2, desc: "每天抽一支，看看今天宜什么、忌什么，还能帮朋友抽。" },
    { id: "gacha", name: "扭蛋机", tint: 3, desc: "随机掉一张脸，稀有度从 N 到 SSR，十连保底一张 SR。" }
  ];

  /* ================= 捏脸机 ================= */
  var FB = {
    eyes: [["◕", "◕"], ["・", "・"], ["･", "･"], ["•", "•"], ["^", "^"], ["＾", "＾"], ["≧", "≦"], [">", "<"], ["˃", "˂"], ["ᗒ", "ᗕ"], ["´", "`"], ["ˊ", "ˋ"], ["•̀", "•́"], ["ò", "ó"], ["⇀", "↼"], ["°", "°"], ["ﾟ", "ﾟ"], ["⊙", "⊙"], ["◉", "◉"], ["◎", "◎"], ["●", "●"], ["⚆", "⚆"], ["ʘ", "ʘ"], ["ಠ", "ಠ"], ["ಥ", "ಥ"], ["╥", "╥"], ["T", "T"], ["ㅠ", "ㅠ"], ["〒", "〒"], ["╯", "╰"], ["⌒", "⌒"], ["˘", "˘"], ["ᵔ", "ᵔ"], ["ˆ", "ˆ"], ["￣", "￣"], ["－", "－"], ["≖", "≖"], ["ꈍ", "ꈍ"], ["ᴗ", "ᴗ"], ["✧", "✧"], ["☆", "☆"], ["★", "★"], ["✪", "✪"], ["♡", "♡"], ["♥", "♥"], ["@", "@"], ["×", "×"], ["+", "+"], ["¬", "¬"], ["눈", "눈"], ["ㅇ", "ㅇ"], ["◔", "◔"], ["◑", "◐"], ["⁰", "⁰"], ["ᓀ", "ᓂ"], ["$", "$"]],
    mouth: ["ω", "▽", "∀", "‿", "ᴗ", "ᵕ", "꒳", "ㅂ", "ㅅ", "ε", "з", "Д", "д", "□", "ロ", "_", "﹏", "︿", "⌓", "△", "◇", "∇", "ᗜ", "ᆺ", "ᴥ", "ﻌ", "ڡ", "ч", "ヮ", "益", "皿", "‸", "⤙", "o", "0", "Θ", "ʖ", "◡", "⌑", "ー", "～", "౪", "ਊ", "3", "x"],
    frame: [["(", ")"], ["（", "）"], ["ʕ", "ʔ"], ["꒰", "꒱"], ["₍", "₎"], ["૮ ", " ა"], ["[", "]"], ["〔", "〕"], ["༼ ", " ༽"], ["(=", "=)"], ["|", "|"], ["", ""]],
    cheek: [["", ""], ["*", "*"], ["๑", "๑"], ["˶", "˵"], ["〃", "〃"], ["⸝⸝", "⸝⸝"], ["｡", "｡"], ["✿", ""], ["", "✿"], ["#", "#"], [";", ""], ["灬", "灬"], ["⑅", "⑅"], [" ", " "]],
    /* 左外 左内 右内 右外 */
    arms: [["", "", "", ""], ["ヽ", "", "", "ﾉ"], ["\\", "", "", "/"], ["٩", "", "", "۶"], ["٩", "", "", "و"], ["ᕕ", "", "", "ᕗ"], ["ᕦ", "", "", "ᕤ"], ["⸜", "", "", "⸝"], ["", "つ", "", "つ"], ["", "っ", "", "っ"], ["", "ง", "", "ง"], ["", "ﾉ", "", "ﾉ"], ["", "人", "", ""], ["", "", "", "σ"], ["", "", "", "b"], ["d", "", "", "b"], ["", "", "", "ゞ"], ["┐", "", "", "┌"], ["╮", "", "", "╭"], ["¯\\_", "", "", "_/¯"], ["o", "", "", "o"], ["ヾ", "", "", ""], ["", "", "", "ﾉﾞ"], ["ʚ", "", "", "ɞ"], ["┏", "", "", "┛"], ["~", "", "", "~"], ["ฅ", "", "", "ฅ"], ["", "ฅ", "ฅ", ""], ["", "っ", "c", ""], ["", "╯", "", "╯"], ["", "∩", "", "⊃━☆ﾟ.*･｡ﾟ"], ["ლ", "", "ლ", ""], ["", "", "", "っ♡"]],
    deco: [["", ""], ["", "✧"], ["", "♡"], ["", "♪"], ["", "☆"], ["", "*:･ﾟ✧"], ["✧", "✧"], ["☆*:.｡.", ".｡.:*☆"], ["⋆｡˚", "˚｡⋆"], ["", " zZ"], ["", "!!"], ["", "?"], ["", "…"], ["Σ", ""], ["ε=ε=", ""], ["", " ︵ ┻━┻"], ["", "=3"], ["", "ﾉｼ"], ["", " ♨"], ["", "旦"]]
  };
  var SLOTS = [["eyes", "眼睛"], ["mouth", "嘴巴"], ["frame", "脸型"], ["cheek", "脸颊"], ["arms", "手势"], ["deco", "装饰"]];
  var fb = { sel: { eyes: 1, mouth: 0, frame: 0, cheek: 0, arms: 1, deco: 0 }, lock: {} };
  function compose(s) {
    var e = FB.eyes[s.eyes], m = FB.mouth[s.mouth], f = FB.frame[s.frame], c = FB.cheek[s.cheek], a = FB.arms[s.arms], d = FB.deco[s.deco];
    return d[0] + a[0] + f[0] + a[1] + c[0] + e[0] + m + e[1] + c[1] + a[2] + f[1] + a[3] + d[1];
  }
  function optLabel(slot, o) {
    if (slot === "eyes") return o[0] === o[1] ? o[0] : o[0] + " " + o[1];
    if (slot === "mouth") return o;
    if (slot === "arms") return o.join("") ? (o[0] + "(" + o[1] + "·" + o[2] + ")" + o[3]).slice(0, 12) : "";
    var s = o[0] + (slot === "frame" ? " " : "·") + o[1];
    return o.join("").trim() ? s : "";
  }
  function randomSel(base) {
    var s = Object.assign({}, base);
    SLOTS.forEach(function (sl) {
      var k = sl[0];
      if (fb.lock[k]) return;
      var n = FB[k].length;
      if ((k === "cheek" || k === "deco") && Math.random() < 0.45) s[k] = 0;
      else if (k === "arms" && Math.random() < 0.25) s[k] = 0;
      else if (k === "frame" && Math.random() < 0.55) s[k] = rnd(2);
      else s[k] = rnd(n);
    });
    return s;
  }
  var LOCK_SVG = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function renderFace(v) {
    v.innerHTML = toolHead("face") +
      '<div class="fb-stage"><div class="fb-face" id="fbFace"></div></div>' +
      '<div class="fb-acts">' +
        '<button class="btn yellow" type="button" id="fbRoll">✦ 随机捏一张</button>' +
        '<button class="btn pink" type="button" id="fbCopy">复制</button>' +
        '<button class="btn" type="button" id="fbSave">保存</button>' +
        '<button class="btn ghost" type="button" id="fbShow">举起来</button>' +
        '<button class="btn ghost" type="button" id="fbInfo">拆解</button>' +
      "</div>" +
      '<div class="panel"><div class="fb-rows">' + SLOTS.map(function (sl) {
        var k = sl[0];
        return '<div class="fb-row" data-slot="' + k + '"><span class="fb-lbl">' + sl[1] + '</span><div class="fb-strip">' +
          FB[k].map(function (o, i) {
            var lab = optLabel(k, o);
            return '<button class="fb-opt' + (lab ? "" : " none") + '" type="button" data-i="' + i + '">' + (lab ? esc(lab) : "无") + "</button>";
          }).join("") +
          '</div><button class="fb-lock" type="button" aria-pressed="' + !!fb.lock[k] + '" title="锁住这一格，随机时不变" aria-label="锁住' + sl[1] + '">' + LOCK_SVG + "</button></div>";
      }).join("") + "</div></div>" +
      '<p class="tool-d" style="margin-top:14px">小锁锁住的那一格，点「随机」时不会变。拼好了点「保存」，会出现在「我的 · 我捏的」里。</p>';
    paintFace(true);
    syncStrips(false);
    $("#fbRoll").onclick = roll;
    $("#fbCopy").onclick = function () { K.copy(compose(fb.sel), $("#fbFace")); };
    $("#fbSave").onclick = function () {
      var t = compose(fb.sel);
      K.toast(K.addMade(t) ? "存进「我的 · 我捏的」" : "这张已经存过了", t, "✓");
      K.setMood("ok", 1200);
    };
    $("#fbShow").onclick = function () { K.openStage(compose(fb.sel)); };
    $("#fbInfo").onclick = function () { K.openDetail(compose(fb.sel)); };
    v.querySelector(".fb-rows").onclick = function (e) {
      var row = e.target.closest(".fb-row");
      if (!row) return;
      var k = row.getAttribute("data-slot");
      var lock = e.target.closest(".fb-lock");
      if (lock) {
        fb.lock[k] = !fb.lock[k];
        lock.setAttribute("aria-pressed", fb.lock[k]);
        K.haptic(6);
        return;
      }
      var o = e.target.closest(".fb-opt");
      if (!o) return;
      fb.sel[k] = +o.getAttribute("data-i");
      paintFace(true);
      syncStrips(false, k);
      K.haptic(5);
    };
  }
  function paintFace(pop, text) {
    var el = $("#fbFace");
    if (!el) return;
    el.textContent = text || compose(fb.sel);
    if (pop && !K.reduceMotion) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
  }
  function syncStrips(smooth, only) {
    SLOTS.forEach(function (sl) {
      var k = sl[0];
      if (only && only !== k) return;
      var row = $('.fb-row[data-slot="' + k + '"]');
      if (!row) return;
      $$(".fb-opt", row).forEach(function (b) { b.classList.toggle("on", +b.getAttribute("data-i") === fb.sel[k]); });
      var on = $(".fb-opt.on", row), strip = $(".fb-strip", row);
      if (on && strip && !only) strip.scrollTo({ left: on.offsetLeft - strip.clientWidth / 2 + on.offsetWidth / 2, behavior: smooth ? "smooth" : "auto" });
    });
  }
  function roll() {
    var target = randomSel(fb.sel);
    K.haptic(10);
    if (K.reduceMotion) { fb.sel = target; paintFace(true); syncStrips(true); return; }
    var rows = $$(".fb-row");
    rows.forEach(function (r) { if (!fb.lock[r.getAttribute("data-slot")]) r.classList.add("rolling"); });
    var n = 0;
    var spin = every(function () {
      n++;
      paintFace(false, compose(randomSel(fb.sel)));
      if (n >= 10) {
        clearInterval(spin);
        fb.sel = target;
        rows.forEach(function (r) { r.classList.remove("rolling"); });
        paintFace(true);
        syncStrips(true);
        K.setMood("happy", 1000);
      }
    }, 60);
  }

  /* ================= 连发剧本 ================= */
  var COMBOS = [
    { name: "偷看", steps: ["|ω・)", "|ω・)ﾉ 嗨", "|彡ｻｯ"] },
    { name: "飞奔过来", steps: ["　　　　　　　　　　ε=ε=┌(˶˃ᵕ˂˶)┘", "　　　　　ε=ε=┌(˶˃ᵕ˂˶)┘", "(つ≧▽≦)つ 抱住！"] },
    { name: "掀桌又扶起", steps: ["(╯°□°）╯︵ ┻━┻", "┬─┬ノ( º _ ºノ)", "(╯°□°）╯︵ ┻━┻ 算了还是掀"] },
    { name: "敲门", steps: ["咚咚咚", "|ω・`) 有人在吗", "|・ω・`) 那我进来了哦", "(・ω・) 打扰了"] },
    { name: "慢慢冒头", steps: ["|", "|ω・)", "|ω・`) 我可以说话吗", "(・ω・)ﾉ 嗨"] },
    { name: "认错三连", steps: ["(・_・;) …", "m(_ _)m 对不起", "_|￣|○ 再也不敢了"] },
    { name: "戳一戳", steps: ["(・ω・)σ 戳", "(・ω・)σσ 戳戳", "(｀・ω・´)σσσ 戳戳戳！"] },
    { name: "生气到算了", steps: ["(╬ Ò﹏Ó)", "(｀Д´)", "(｀・ω・´)", "(・ω・) 算了"] },
    { name: "被夸了", steps: ["(〃∀〃)", "(〃▽〃)ゞ 哪有啦", "(*/ω＼*) 再夸一次"] },
    { name: "发射爱心", steps: ["(´ε｀ )♡", "(´ε｀ )ノ ♡ ~", "(´ε｀ )ノ  ♡ ♡ ♡ 收下！"] },
    { name: "召唤", steps: ["(∩｀-´)⊃━☆ﾟ.*･｡ﾟ 召唤！", "　　ﾟ+｡*ﾟ+｡｡+ﾟ*｡+ﾟ", "ヽ(•̀ω•́ )ゝ 我来了"] },
    { name: "递杯茶", steps: ["(´・ω・)つ旦", "(´・ω・)つ旦 喝口茶", "旦~(˘ω˘ ) 冷静一下"] },
    { name: "钓鱼", steps: ["( ´∀`)/~~~~~~~~~ 钓鱼中", "( ´∀`)/~~~~~~~~~><((((º>", "(ﾉ≧∀≦)ﾉ ><((((º> 钓到了！"] },
    { name: "下班", steps: ["(￣o￣) 还有五分钟", "(・∀・)つ 打卡", "ε=ε=ε=ヾ(*。>∀<)ﾉ 下班啦！"] },
    { name: "起床失败", steps: ["(˘ω˘) 起床", "(˘ω˘) 起……", "_(:3 」∠)_ 失败"] },
    { name: "电量不足", steps: ["(・ω・) ▓▓▓▓▓ 100%", "(－ω－) ▓▓░░░ 40%", "_(:3 」∠)_ ░░░░░ 没电了"] },
    { name: "系统故障", steps: ["(・ω・)", "(・ω・)(・ω・)", "(・ω・)(・ω・)(・ω・) 系统故障"] },
    { name: "晚安", steps: ["(｡-ω-)zzz", "(｡-ω-)zzZ", "(｡-ω-) zZZ 晚安"] },
    { name: "倒数溜走", steps: ["3", "2", "1", "ε=ε=┌( >_<)┘ 溜了"] },
    { name: "拒绝三连", steps: ["(╯‵□′)╯ 不要", "(ﾟДﾟ≡ﾟдﾟ) 不行", "(×_×) 不可能"] }
  ];
  var combo = { at: 0, next: 0 };
  function renderCombo(v) {
    v.innerHTML = toolHead("combo") +
      '<div class="combo-list" id="comboList">' + COMBOS.map(function (c, i) {
        return '<button class="combo-pick' + (i === combo.at ? " on" : "") + '" type="button" data-i="' + i + '"><b>' + esc(c.name) + "</b><span>" + esc(c.steps[0].trim() || c.steps[1]) + "</span></button>";
      }).join("") + "</div>" +
      '<div id="comboBody"></div>';
    $("#comboList").onclick = function (e) {
      var b = e.target.closest(".combo-pick");
      if (!b) return;
      combo.at = +b.getAttribute("data-i");
      combo.next = 0;
      $$(".combo-pick").forEach(function (x) { x.classList.toggle("on", x === b); });
      drawCombo();
    };
    drawCombo();
  }
  function drawCombo() {
    stopAll();
    var c = COMBOS[combo.at];
    var body = $("#comboBody");
    body.innerHTML =
      '<div class="phone"><div class="phone-top"><i></i>' + esc(c.name) + '<span style="margin-left:auto;font:12px var(--body);color:var(--ink-3)">对方会看到</span></div><div class="chat" id="chat"></div></div>' +
      '<div class="row" style="justify-content:center;margin-bottom:16px">' +
        '<button class="btn pink" type="button" id="comboNext"></button>' +
        '<button class="btn ghost" type="button" id="comboReplay">重播</button>' +
        '<button class="btn ghost" type="button" id="comboAll">全部复制成一条</button>' +
      "</div>" +
      '<div class="steps" id="steps">' + c.steps.map(function (s, i) {
        return '<div class="step" data-i="' + i + '"><span class="step-n">' + (i + 1) + '</span><span class="step-t">' + esc(s) + "</span>" + copyBtn(s) + "</div>";
      }).join("") + "</div>" +
      '<p class="tool-d" style="margin-top:14px">用法：点「复制第 1 句」，去聊天框发出去；回来再点一下复制下一句。一句一句发，对面看到的就是一段动画。有的 App 会吞掉开头的空格。</p>';
    paintSteps();
    play();
    $("#comboReplay").onclick = play;
    $("#comboAll").onclick = function () { K.copy(c.steps.join("\n"), this); };
    $("#comboNext").onclick = function () {
      if (combo.next >= c.steps.length) { combo.next = 0; paintSteps(); return; }
      K.copy(c.steps[combo.next], this, true);
      K.toast("已复制第 " + (combo.next + 1) + " 句，去发吧", c.steps[combo.next].trim());
      combo.next++;
      paintSteps();
    };
    $("#steps").onclick = function (e) {
      var b = e.target.closest("[data-copy]");
      var row = e.target.closest(".step");
      if (b && row) { combo.next = Math.max(combo.next, +row.getAttribute("data-i") + 1); later(paintSteps, 0); }
    };
  }
  function paintSteps() {
    var c = COMBOS[combo.at];
    $$(".step").forEach(function (s, i) {
      s.classList.toggle("done", i < combo.next);
      s.classList.toggle("next", i === combo.next);
    });
    var b = $("#comboNext");
    if (b) b.textContent = combo.next >= c.steps.length ? "发完了，从头再来" : "复制第 " + (combo.next + 1) + " 句（共 " + c.steps.length + " 句）";
  }
  function play() {
    stopAll();
    var c = COMBOS[combo.at], chat = $("#chat");
    if (!chat) return;
    chat.innerHTML = '<div class="msg them">在干嘛</div>';
    var t = 500;
    c.steps.forEach(function (s) {
      later(function () { chat.insertAdjacentHTML("beforeend", '<div class="typing" aria-hidden="true"><i></i><i></i><i></i></div>'); }, t);
      t += K.reduceMotion ? 50 : 650;
      later(function () {
        var ty = $(".typing", chat);
        if (ty) ty.remove();
        chat.insertAdjacentHTML("beforeend", '<div class="msg">' + esc(s) + "</div>");
      }, t);
      t += K.reduceMotion ? 50 : 520;
    });
    later(function () { chat.insertAdjacentHTML("beforeend", '<div class="msg them">' + esc(pickOne(["哈哈哈哈哈", "？？？", "笑死", "你好怪 (笑)", "绝了"])) + "</div>"); }, t + 500);
  }

  /* ================= 举牌喊话 ================= */
  var FW = "　";
  function cells(s) { return U.width(s, 2) / 2; }
  function padTo(s, n) {
    var w = U.width(s, 2), want = n * 2, out = s;
    while (w + 2 <= want) { out += FW; w += 2; }
    if (w < want) out += " ";
    return out;
  }
  function signs(text) {
    var lines = text.replace(/\r/g, "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
    if (!lines.length) lines = ["……"];
    var n = Math.max.apply(null, lines.map(function (l) { return Math.ceil(cells(l)); }));
    var one = lines.join(" ");
    var rep = function (s, k) { return new Array(Math.max(0, k) + 1).join(s); };
    var shout = [
      "＿" + rep("人", n + 2) + "＿",
      lines.map(function (l) { return "＞" + FW + padTo(l, n) + FW + "＜"; }).join("\n"),
      "￣Y" + rep("^Y", n + 1) + "￣"
    ].join("\n");
    var bunny = [
      "｜" + rep("￣", n + 2) + "｜",
      lines.map(function (l) { return "｜" + FW + padTo(l, n) + FW + "｜"; }).join("\n"),
      "｜" + rep("＿", n + 2) + "｜",
      "(\\__/) ||",
      "(•ㅅ•) ||",
      "/ 　 づ"
    ].join("\n");
    var bear = [
      "┏" + rep("━", n + 2) + "┓",
      lines.map(function (l) { return "┃" + FW + padTo(l, n) + FW + "┃"; }).join("\n"),
      "┗" + rep("━", n + 2) + "┛",
      "　ʕ•ᴥ•ʔ ||",
      "　/　 づ"
    ].join("\n");
    var mona = [
      "　∧＿∧　　／" + rep("￣", n + 2),
      "（　´∀｀）＜　" + lines[0],
      lines.slice(1).map(function (l) { return "（　　　　）｜　" + l; }).join("\n"),
      "（　　　　） ＼" + rep("＿", n + 2)
    ].filter(Boolean).join("\n");
    return {
      multi: [
        ["突然的死（大声喊）", shout],
        ["兔兔举牌", bunny],
        ["熊熊举牌", bear],
        ["老派日式：对着你说", mona]
      ],
      single: [
        "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧【" + one + "】",
        "【" + one + "】ヽ(✿ﾟ▽ﾟ)ノ",
        "( •̀ ω •́ )✧「" + one + "」",
        "(・ω・)つ【" + one + "】",
        "ʕ•ᴥ•ʔﾉ【" + one + "】",
        "＼(◎o◎)／ " + one + "！！！",
        "( ﾟдﾟ)ﾉ＜ " + one,
        "_(:3 」∠)_ ＜ " + one + "……",
        "(｀・ω・´)ゞ 收到：" + one,
        "꧁༺ " + one + " ༻꧂",
        "★·.·´¯`·.·★ " + one + " ★·.·´¯`·.·★",
        "✧･ﾟ: *✧･ﾟ:* " + one + " *:･ﾟ✧*:･ﾟ✧",
        "⋆｡˚ ☁︎ " + one + " ☁︎ ˚｡⋆",
        "▂▃▅▆█ " + one + " █▆▅▃▂",
        "『 " + one + " 』"
      ]
    };
  }
  function renderSign(v) {
    v.innerHTML = toolHead("sign") +
      '<div class="stack">' +
        '<label class="stack" style="gap:6px"><span style="font:15px var(--display)">想说什么</span>' +
        '<textarea class="field" id="signIn" rows="2" maxlength="60">今天也要加油</textarea></label>' +
        '<div class="row" id="signQuick">' + ["好耶", "我不要上班", "生日快乐", "收到", "谁懂啊", "给我回消息"].map(function (s) {
          return '<button class="tagchip" type="button" data-fill="' + esc(s) + '">' + esc(s) + "</button>";
        }).join("") + "</div>" +
        '<div class="outs" id="signOut"></div>' +
        '<p class="tool-d">多行的牌子靠全角空格对齐，在不同 App 里字体不一样，边框可能会歪一点点，属于正常现象 (ゝ∀･)</p>' +
      "</div>";
    var inp = $("#signIn");
    var draw = function () {
      var s = signs(inp.value);
      $("#signOut").innerHTML =
        s.multi.map(function (m) { return '<div class="out big"><div class="out-k"><span class="out-l">' + esc(m[0]) + "</span>" + esc(m[1]) + "</div>" + copyBtn(m[1]) + "</div>"; }).join("") +
        s.single.map(function (t) { return '<div class="out"><div class="out-k wrap">' + esc(t) + "</div>" + copyBtn(t) + "</div>"; }).join("");
    };
    inp.addEventListener("input", draw);
    $("#signQuick").onclick = function (e) {
      var b = e.target.closest("[data-fill]");
      if (b) { inp.value = b.getAttribute("data-fill"); draw(); }
    };
    draw();
  }

  /* ================= 花式文字 ================= */
  var ZALGO_UP = "̍̎̄̅̿̑̆̐͒͗͑̇̈̊͂̓̈́͊͋͌̃̂̌͐̀́̋̏̒̓̔̽̉ͣͤͥͦͧͨͩͪͫͬͭͮͯ̾͛";
  var ZALGO_DOWN = "̖̗̘̙̜̝̞̟̠̤̥̦̩̪̫̬̭̮̯̰̱̲̳̹̺̻̼͇͈͉͍͎͓͔͕͖͙͚̣ͅ";
  function zalgo(s, k) {
    return U.graphemes(s).map(function (g) {
      if (!g.trim()) return g;
      var out = g, n = 1 + rnd(k);
      for (var i = 0; i < n; i++) out += ZALGO_UP[rnd(ZALGO_UP.length)];
      for (var j = 0; j < n; j++) out += ZALGO_DOWN[rnd(ZALGO_DOWN.length)];
      return out;
    }).join("");
  }
  function mark(s, m) { return U.graphemes(s).map(function (g) { return g.trim() ? g + m : g; }).join(""); }
  function mapLatin(s, upper, lower, digit, holes) {
    return Array.from(s).map(function (ch) {
      if (holes && holes[ch]) return holes[ch];
      var c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90 && upper != null) return String.fromCodePoint(upper + c - 65);
      if (c >= 97 && c <= 122 && lower != null) return String.fromCodePoint(lower + c - 97);
      if (c >= 48 && c <= 57 && digit != null) return String.fromCodePoint(digit + c - 48);
      return ch;
    }).join("");
  }
  var SMALLCAPS = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ";
  var FLIP = { a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z", "?": "¿", "!": "¡", ".": "˙", ",": "'", "'": ",", "(": ")", ")": "(" };
  var DOUBLE_HOLES = { C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ" };
  function fx(text, z) {
    var g = U.graphemes(text), rev = g.slice().reverse().join("");
    var first = g[0] || "", last = g[g.length - 1] || "";
    var hit = K.search(text), face = "";
    if (hit && hit.list.length) face = K.items[hit.list[0].i].t;
    var out = [
      ["删除线", mark(text, "̶")],
      ["划掉", mark(text, "̸")],
      ["下划线", mark(text, "̲")],
      ["波浪线", mark(text, "̰")],
      ["着重号", mark(text, "̣")],
      ["鬼畜（再点一次会变）", z],
      ["字间爱心", g.join("♡")],
      ["字间星星", g.join("✧")],
      ["字间小点", g.join("·")],
      ["结巴", first + first + first + "……" + text],
      ["拉长音", text + last + last + "～～"],
      ["倒着说", rev],
      ["竖着写", g.filter(function (x) { return x.trim(); }).join("\n")]
    ];
    if (face && face.indexOf("\n") < 0) out.splice(6, 0, ["自动配颜文字", text + " " + face]);
    var latin = /[A-Za-z0-9]/.test(text);
    var sample = latin ? text : "Hello";
    var fancy = [
      ["花体", mapLatin(sample, 0x1D4D0, 0x1D4EA, null)],
      ["哥特体", mapLatin(sample, 0x1D56C, 0x1D586, null)],
      ["空心体", mapLatin(sample, 0x1D538, 0x1D552, 0x1D7D8, DOUBLE_HOLES)],
      ["粗体", mapLatin(sample, 0x1D400, 0x1D41A, 0x1D7CE)],
      ["打字机", mapLatin(sample, 0x1D670, 0x1D68A, 0x1D7F6)],
      ["全角", mapLatin(sample, 0xFF21, 0xFF41, 0xFF10)],
      ["小型大写", Array.from(sample).map(function (ch) { var c = ch.toLowerCase().charCodeAt(0); return c >= 97 && c <= 122 ? SMALLCAPS[c - 97] : ch; }).join("")],
      ["圈圈字", mapLatin(sample, 0x24B6, 0x24D0, null).replace(/[1-9]/g, function (d) { return String.fromCharCode(0x2460 + +d - 1); }).replace(/0/g, "⓪")],
      ["倒过来", Array.from(sample.toLowerCase()).reverse().map(function (ch) { return FLIP[ch] || ch; }).join("")]
    ];
    return { out: out, fancy: fancy, latin: latin };
  }
  function renderFx(v) {
    v.innerHTML = toolHead("fx") +
      '<div class="stack">' +
        '<label class="stack" style="gap:6px"><span style="font:15px var(--display)">输入一句话</span>' +
        '<input class="field" id="fxIn" value="我不想上班" maxlength="40" autocomplete="off"></label>' +
        '<div class="row" id="fxQuick">' + ["我不想上班", "笑死我了", "好饿", "Monday", "爱你"].map(function (s) {
          return '<button class="tagchip" type="button" data-fill="' + esc(s) + '">' + esc(s) + "</button>";
        }).join("") + "</div>" +
        '<div class="outs" id="fxOut"></div>' +
        '<p class="tool-d" style="margin:0">删除线、下划线这几种是在每个字后面加一个「组合符号」，苹果和安卓手机上都能正常显示；个别电脑浏览器会画成方框。</p>' +
        '<h3 class="sec-t" style="margin-top:6px">英文花体 <small id="fxNote"></small></h3>' +
        '<div class="outs" id="fxFancy"></div>' +
      "</div>";
    var inp = $("#fxIn"), z = "";
    var draw = function (reroll) {
      var text = inp.value || "……";
      if (reroll || !z) z = zalgo(text, 3);
      var r = fx(text, z);
      $("#fxOut").innerHTML = r.out.map(function (o) {
        return '<div class="out" data-fx="' + esc(o[0]) + '"><div class="out-k wrap cjk"><span class="out-l">' + esc(o[0]) + "</span>" + esc(o[1]) + "</div>" + copyBtn(o[1]) + "</div>";
      }).join("");
      $("#fxNote").textContent = r.latin ? "" : "只对英文字母和数字有效，下面拿 Hello 演示";
      $("#fxFancy").innerHTML = r.fancy.map(function (o) {
        return '<div class="out"><div class="out-k wrap"><span class="out-l">' + esc(o[0]) + "</span>" + esc(o[1]) + "</div>" + copyBtn(o[1]) + "</div>";
      }).join("");
    };
    inp.addEventListener("input", function () { draw(true); });
    $("#fxQuick").onclick = function (e) {
      var b = e.target.closest("[data-fill]");
      if (b) { inp.value = b.getAttribute("data-fill"); draw(true); }
    };
    $("#fxOut").addEventListener("click", function (e) {
      var row = e.target.closest('[data-fx^="鬼畜"]');
      if (row && e.target.closest("[data-copy]")) later(function () { draw(true); }, 300);
    });
    draw(true);
  }

  /* ================= 颜文字签 ================= */
  var LUCK = [
    ["大吉", 16, ["(ﾉ≧∀≦)ﾉ", "✧*｡٩(ˊᗜˋ*)و✧*｡", "ヽ(✿ﾟ▽ﾟ)ノ"], ["今天宇宙站在你这边，想做的事就去做。", "运气好到可以犒劳自己一杯奶茶。", "你发出去的每个颜文字都会被秒回。"]],
    ["中吉", 20, ["(๑•̀ㅂ•́)و✧", "o(*￣▽￣*)ブ", "٩(◕‿◕｡)۶"], ["稳稳的一天，小惊喜藏在下午。", "适合推进拖了很久的那件事。", "会收到一句让你嘴角上扬的话。"]],
    ["小吉", 22, ["(｡･ω･｡)", "( ˶ˆ꒳ˆ˵ )", "(◍•ᴗ•◍)"], ["平平淡淡，但有一点甜。", "慢慢来，不着急，事情会自己理顺。", "一杯热饮能解决今天大部分问题。"]],
    ["吉", 22, ["(´∀｀)", "(◕‿◕)", "( ´ ▽ ` )"], ["普普通通的好日子，挺好。", "按部就班，傍晚会轻松起来。", "今天的你比昨天更会聊天一点。"]],
    ["末吉", 12, ["( ˘•ω•˘ )", "(・_・;)", "(´-ω-`)"], ["开局有点慢，越往后越顺。", "先把小事做完，大事明天再说。", "适合早点收工（如果可以的话）。"]],
    ["凶", 8, ["(╥﹏╥)", "_(:3 」∠)_", "(っ´Ι`)っ"], ["今天适合低调，抱紧自己。凶也只管今天。", "别跟较真的人较真，喝口水。", "运气在充电，明天会满格的。"]]
  ];
  var DO = ["摸鱼", "早睡", "喝奶茶", "吃火锅", "发颜文字", "夸别人", "晒太阳", "整理房间", "听歌", "散步", "给朋友发消息", "撸猫", "点外卖", "学点新东西", "多喝水", "早点下班", "拍照", "买花", "看电影", "打游戏", "运动一下", "好好吃饭", "做白日梦", "说谢谢", "换头像", "吃甜的", "断舍离", "早起", "表白", "出门走走", "听播客", "泡澡", "捏一张新脸", "给自己放假"];
  var DONT = ["熬夜", "加班", "emo", "看前任朋友圈", "吵架", "剁手", "立 flag", "空腹喝咖啡", "内耗", "和别人比", "冲动消费", "半夜回工作消息", "吃太撑", "想太多", "赖床", "已读不回", "说「随便」", "抬杠", "刷手机到半夜", "忘记喝水", "翻旧账", "熬夜追剧", "久坐不动", "跟风", "在评论区吵架", "把话憋着"];
  function draw(name) {
    var who = (name || "").trim();
    var rng = seeded(K.hash("omikuji|" + K.dayKey + "|" + who));
    var total = LUCK.reduce(function (s, l) { return s + l[1]; }, 0), r = rng() * total, lv = LUCK[0];
    for (var i = 0; i < LUCK.length; i++) { r -= LUCK[i][1]; if (r < 0) { lv = LUCK[i]; break; } }
    var pick = function (a) { return a[Math.floor(rng() * a.length)]; };
    var two = function (a) { var x = pick(a), y; do { y = pick(a); } while (y === x); return [x, y]; };
    var pool = K.items.filter(function (it) { return it.lv < 2 && it.t.indexOf("\n") < 0 && it.cats.every(function (c) { return K.partCats.indexOf(c) < 0; }); });
    var deco = "✧★☆♡♪✿❀☾✩⋆♨☁".split("");
    return {
      who: who, no: 1 + Math.floor(rng() * 99), lv: lv[0], bad: lv[0] === "凶" || lv[0] === "末吉",
      face: pick(lv[2]), line: pick(lv[3]), yes: two(DO), no2: two(DONT),
      lucky: pool[Math.floor(rng() * pool.length)].t, sym: pick(deco)
    };
  }
  function luckText(d) {
    return "【颜文字签 · 第 " + d.no + " 签】" + (d.who ? d.who + "的" : "") + "今日运势：" + d.lv + "\n" +
      d.face + " " + d.line + "\n宜：" + d.yes.join(" / ") + "\n忌：" + d.no2.join(" / ") + "\n幸运颜文字：" + d.lucky;
  }
  function renderLuck(v) {
    v.innerHTML = toolHead("luck") +
      '<div class="omi">' +
        '<label class="row" style="justify-content:center"><span>帮谁抽？</span><input class="field" id="omiName" style="width:180px;min-height:40px" maxlength="12" placeholder="不填就是你自己"></label>' +
        '<div class="omi-box" id="omiBox"><b>颜文字签</b><span class="omi-stick"></span></div>' +
        '<button class="btn yellow" type="button" id="omiGo">摇一摇，抽一支</button>' +
        '<div id="omiOut" style="width:100%;display:grid;justify-items:center"></div>' +
        '<p class="tool-d" style="text-align:center">同一个名字一天只有一个结果，换个名字可以帮朋友抽。</p>' +
      "</div>";
    var drawn = K.store.get("omi", {});
    $("#omiGo").onclick = function () {
      var name = $("#omiName").value;
      var box = $("#omiBox"), btn = this;
      btn.disabled = true;
      $("#omiOut").innerHTML = "";
      box.classList.remove("shake", "drawn");
      void box.offsetWidth;
      box.classList.add("shake");
      K.haptic(30);
      later(function () { box.classList.add("drawn"); }, K.reduceMotion ? 0 : 900);
      later(function () {
        btn.disabled = false;
        var d = draw(name), key = K.dayKey + "|" + d.who;
        Object.keys(drawn).forEach(function (k) { if (k.indexOf(K.dayKey + "|") !== 0) delete drawn[k]; });
        var again = !!drawn[key];
        drawn[key] = 1;
        K.store.set("omi", drawn);
        $("#omiOut").innerHTML =
          '<div class="omi-card">' +
            '<span class="omi-no">第 ' + d.no + " 签" + (d.who ? " · " + esc(d.who) : "") + "</span>" +
            '<div class="omi-lv' + (d.bad ? " bad" : "") + '">' + d.lv + "</div>" +
            '<div class="omi-face">' + esc(d.face) + "</div>" +
            '<p class="omi-line">' + esc(d.line) + "</p>" +
            '<div class="omi-do"><div class="yes"><b>宜</b>' + esc(d.yes.join("、")) + '</div><div class="no"><b>忌</b>' + esc(d.no2.join("、")) + "</div></div>" +
            '<p class="omi-lucky">幸运颜文字 <span class="kf">' + esc(d.lucky) + "</span>　幸运符号 " + esc(d.sym) + "</p>" +
            '<div class="row" style="justify-content:center">' + copyBtn(luckText(d), "复制签文去分享") + '<button class="btn sm ghost" type="button" data-copy="' + esc(d.lucky) + '">复制幸运颜文字</button></div>' +
            (again ? '<p class="omi-line" style="font-size:12.5px">今天抽过啦，签是定好的，明天再来。</p>' : "") +
          "</div>";
        K.setMood(d.bad ? "sad" : "happy", 1600);
      }, K.reduceMotion ? 10 : 1500);
    };
  }

  /* ================= 扭蛋机 ================= */
  var RARE_CATS = ["long", "art", "duo", "magic", "meme", "flip"];
  var SR_CATS = ["soft", "egypt", "jp", "kr", "cool", "smirk"];
  function poolOf(rar) {
    var byId = function (ids) { return ids.map(function (id) { return K.catById[id] ? K.catById[id].i : -1; }); };
    var rareC = byId(RARE_CATS), srC = byId(SR_CATS);
    return K.items.filter(function (it) {
      if (it.cats.every(function (c) { return K.partCats.indexOf(c) >= 0; })) return false;
      if (K.state.set.safe && it.lv === 2) return false;
      var w = U.width(it.t.split("\n")[0], 1.5);
      var inRare = it.cats.some(function (c) { return rareC.indexOf(c) >= 0; }) || w > 26;
      var inSR = it.cats.some(function (c) { return srC.indexOf(c) >= 0; });
      if (rar === "SSR") return inRare;
      if (rar === "SR") return !inRare && inSR;
      if (rar === "R") return !inRare && !inSR && w > 9;
      return !inRare && !inSR && w <= 9;
    });
  }
  var POOLS = null;
  function roll1(min) {
    if (!POOLS) POOLS = { SSR: poolOf("SSR"), SR: poolOf("SR"), R: poolOf("R"), N: poolOf("N") };
    var r = Math.random(), rar = r < 0.03 ? "SSR" : r < 0.15 ? "SR" : r < 0.45 ? "R" : "N";
    if (min === "SR" && (rar === "R" || rar === "N")) rar = "SR";
    return { rar: rar, it: pickOne(POOLS[rar]) };
  }
  var CAPS = ["var(--pink)", "var(--yellow)", "var(--mint)", "var(--blue)", "var(--orange)", "var(--violet)"];
  function prizeTile(p, delay) {
    return '<div class="k" role="button" tabindex="0" data-i="' + p.it.i + '" style="animation-delay:' + delay + 'ms"><span class="rar ' + p.rar + '">' + p.rar + "</span><span>" + esc(p.it.t.split("\n")[0]) + "</span></div>";
  }
  function renderGacha(v) {
    var st = K.store.get("gacha", { n: 0, ssr: 0 });
    var caps = "";
    for (var i = 0; i < 11; i++) {
      caps += '<i style="--c1:' + CAPS[i % CAPS.length] + ";left:" + (8 + (i * 37) % 150) + "px;top:" + (60 + (i * 53) % 90) + "px;transform:rotate(" + (i * 47) + 'deg)"></i>';
    }
    v.innerHTML = toolHead("gacha") +
      '<div class="gacha">' +
        '<div class="gm"><div class="gm-dome" id="gmDome">' + caps + '</div><div class="gm-body"><div class="gm-knob" id="gmKnob"></div><div class="gm-slot"></div></div></div>' +
        '<div class="row" style="justify-content:center"><button class="btn yellow" type="button" id="gOne">扭一下</button><button class="btn pink" type="button" id="gTen">十连</button></div>' +
        '<p class="tool-d" id="gStat" style="text-align:center;margin:0"></p>' +
        '<div id="gOut" style="width:100%;display:grid;justify-items:center;gap:12px"></div>' +
      "</div>";
    var stat = function () { $("#gStat").textContent = st.n ? "已经扭了 " + st.n + " 次，出过 " + st.ssr + " 张 SSR。概率：SSR 3%，SR 12%，R 30%。" : "概率：SSR 3%，SR 12%，R 30%，N 55%。十连保底一张 SR。"; };
    stat();
    var busy = false;
    function crank(then) {
      if (busy) return;
      busy = true;
      var knob = $("#gmKnob"), dome = $("#gmDome");
      knob.classList.remove("turn"); void knob.offsetWidth; knob.classList.add("turn");
      dome.classList.add("shaking");
      K.haptic(20);
      later(function () { dome.classList.remove("shaking"); busy = false; then(); }, K.reduceMotion ? 10 : 700);
    }
    $("#gOne").onclick = function () {
      $("#gOut").innerHTML = "";
      crank(function () {
        var p = roll1();
        st.n++; if (p.rar === "SSR") st.ssr++;
        K.store.set("gacha", st); stat();
        var col = CAPS[rnd(CAPS.length)];
        $("#gOut").innerHTML = '<div class="capsule" id="gCap" style="--c1:' + col + '"></div>';
        later(function () {
          var cap = $("#gCap");
          if (cap) cap.classList.add("open");
          later(function () {
            $("#gOut").innerHTML = '<div class="prize"><span class="rar ' + p.rar + '">' + p.rar + "</span>" +
              '<div class="kf">' + esc(p.it.t) + "</div>" +
              '<div class="row" style="justify-content:center">' + copyBtn(p.it.t) + '<button class="btn sm ghost" type="button" data-detail="' + p.it.i + '">拆开看看</button></div></div>';
            K.setMood(p.rar === "SSR" ? "wow" : "happy", 1400);
            if (p.rar === "SSR") K.toast("出货了！SSR", p.it.t, "✦");
          }, K.reduceMotion ? 10 : 420);
        }, K.reduceMotion ? 10 : 650);
      });
    };
    $("#gTen").onclick = function () {
      $("#gOut").innerHTML = "";
      crank(function () {
        var list = [];
        for (var i = 0; i < 10; i++) list.push(roll1());
        if (!list.some(function (p) { return p.rar === "SR" || p.rar === "SSR"; })) list[9] = roll1("SR");
        st.n += 10; st.ssr += list.filter(function (p) { return p.rar === "SSR"; }).length;
        K.store.set("gacha", st); stat();
        $("#gOut").innerHTML = '<div class="ten">' + list.map(function (p, i) { return prizeTile(p, i * 90); }).join("") + "</div>" +
          '<p class="tool-d" style="margin:0">点一张复制，长按看详情。</p>';
        var best = list.some(function (p) { return p.rar === "SSR"; });
        K.setMood(best ? "wow" : "happy", 1500);
        if (best) K.toast("十连出了 SSR！", "", "✦");
      });
    };
    $("#gOut").addEventListener("click", function (e) {
      var d = e.target.closest("[data-detail]");
      if (d) K.openDetail(K.items[+d.getAttribute("data-detail")].t);
    });
  }

  /* ================= 首页和公共部分 ================= */
  function toolHead(id) {
    var t = TOOLS.filter(function (x) { return x.id === id; })[0];
    return '<div class="tool-h"><a class="back" href="#lab" aria-label="回到实验室">←</a><h2>' + esc(t.name) + "</h2></div>" +
      '<p class="tool-d">' + esc(t.desc) + "</p>";
  }
  function preview(id) {
    if (id === "face") return '<span id="pvFace">' + esc(compose(fb.sel)) + "</span>";
    if (id === "combo") return '<span class="mini"><span class="msg">|ω・)</span><span class="msg">|ω・)ﾉ 嗨</span><span class="msg">|彡ｻｯ</span></span>';
    if (id === "sign") return '<small style="font-size:15px;line-height:1.25">＿人人人人＿\n＞　好耶　＜\n￣Y^Y^Y^Y￣</small>';
    if (id === "fx") return '<small style="font-size:18px">我̶不̶想̶上̶班̶\n我♡爱♡上♡班 ✧</small>';
    if (id === "luck") return '<span style="font:44px/1 var(--display);color:var(--pink-ink)">大吉</span><small>(ﾉ≧∀≦)ﾉ</small>';
    if (id === "gacha") return '<span><span class="rar SSR" style="font-size:18px">SSR</span>\n<small>ヽ༼ ຈل͜ຈ༽ﾉ</small></span>';
    return "";
  }
  function renderHome(v) {
    v.innerHTML = '<div class="page-h"><h2>实验室</h2><p>几个发出去会好玩的小工具，都是现做现复制。</p></div>' +
      '<div class="lab-grid">' + TOOLS.map(function (t) {
        return '<a class="lab-card t' + t.tint + '" href="#lab-' + t.id + '"><div class="lab-prev">' + preview(t.id) + "</div>" +
          '<div class="lab-txt"><h3>' + esc(t.name) + "</h3><p>" + esc(t.desc) + "</p></div></a>";
      }).join("") + "</div>";
    every(function () {
      var el = $("#pvFace");
      if (!el || document.hidden) return;
      el.textContent = compose(randomSel({ eyes: 0, mouth: 0, frame: 0, cheek: 0, arms: 0, deco: 0 }));
    }, 1600);
  }
  function render(v, sub) {
    stopAll();
    var map = { face: renderFace, combo: renderCombo, sign: renderSign, fx: renderFx, luck: renderLuck, gacha: renderGacha };
    if (map[sub]) map[sub](v); else renderHome(v);
  }
  window.KMJ_LAB = { render: render, stop: stopAll };
  if (/^#lab/.test(location.hash) && K.route) K.route();
})(window.KMJ);
