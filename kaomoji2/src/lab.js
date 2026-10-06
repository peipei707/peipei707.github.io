/* 颜文字图鉴 · 实验室：九个小工具，分三组。
   换个说法：花式文字、换个语气、暗号机
   搞点动静：举牌喊话、像素大字、连发剧本
   捏一张，抽一张：捏脸机、扭蛋机、颜文字签 */
(function (K) {
  "use strict";
  if (!K) return;
  var $ = K.$, $$ = K.$$, esc = K.esc, U = K.U;
  var timers = [], cleanups = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function every(fn, ms) { var t = setInterval(fn, ms); timers.push(t); return t; }
  function stopAll() {
    timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    timers = [];
    cleanups.splice(0).forEach(function (fn) { try { fn(); } catch (e) {} });
  }
  var rnd = function (n) { return Math.floor(Math.random() * n); };
  var pickOne = function (a) { return a[rnd(a.length)]; };
  var pickBy = function (a, r) { return a[Math.floor(r() * a.length)]; };
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
  /* 文字工具做出来的是句子不是颜文字，复制时不记进「最近用过」；face 是提示条里显示的那几个字 */
  var copyAttr = function (text, face) {
    return ' data-copy="' + esc(text) + '" data-norec' + (face != null ? ' data-face="' + esc(face) + '"' : "");
  };
  var fillChips = function (list) {
    return list.map(function (s) {
      var label = typeof s === "string" ? s : s[0], val = typeof s === "string" ? s : s[1];
      return '<button class="tagchip' + (typeof s === "string" ? "" : " solid") + '" type="button" data-fill="' + esc(val) + '">' + esc(label) + "</button>";
    }).join("");
  };
  var cps = function (hex) { return hex.split(" ").map(function (h) { return String.fromCharCode(parseInt(h, 16)); }).join(""); };
  var RE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5V9H15"/></svg>';

  var TOOLS = {
    fx: { name: "花式文字", tint: 1, ico: "花", desc: "删除线、圈起来、打码、鬼畜、英文花体，一句话变出四十种样子。" },
    tone: { name: "换个语气", tint: 3, ico: "语", desc: "夹子音、猫猫语、发疯文学、火星文，同一句话换五种说法。" },
    code: { name: "暗号机", tint: 5, ico: "密", desc: "摩斯电码、盲文、隐形墨水，只有懂的人才解得开。" },
    sign: { name: "举牌喊话", tint: 0, ico: "牌", desc: "把想说的话写上牌子，或者用「突然的死」大声喊出来。" },
    pixel: { name: "像素大字", tint: 2, ico: "大", desc: "把一两个字放大成一整屏，用字本身、方块或者小点点拼出来。" },
    combo: { name: "连发剧本", tint: 4, ico: "连", desc: "一句一句发出去，对面的聊天框里就会演一段小动画。" },
    face: { name: "捏脸机", tint: 5, ico: "脸", desc: "眼睛、嘴巴、手、脸型，一格一格换，拼一张世界上还没有的脸。" },
    gacha: { name: "扭蛋机", tint: 1, ico: "蛋", desc: "随机掉一张脸，稀有度从 N 到 SSR，十连保底一张 SR。" },
    luck: { name: "颜文字签", tint: 4, ico: "签", desc: "每天抽一支，看看今天宜什么、忌什么，还能帮朋友抽。" }
  };
  var GROUPS = [
    { name: "换个说法", desc: "同一句话，换个样子发出去", ids: ["fx", "tone", "code"] },
    { name: "搞点动静", desc: "在聊天框里弄出点场面", ids: ["sign", "pixel", "combo"] },
    { name: "捏一张，抽一张", desc: "自己拼一张脸，或者交给运气", ids: ["face", "gacha", "luck"] }
  ];
  /* 没打开过的新工具在首页贴个「新」 */
  var NEW = { fx: "上新", tone: "新", code: "新", pixel: "新" };

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
  /* 原理：每个字后面跟一个 Unicode「组合符号」，它会叠在前一个字身上（删除线、圈、框都是这样）；
     英文花体则是把字母换成数学字母区里长得不一样的同一个字母。 */
  var ZALGO_UP = cps("30D 30E 304 305 33F 311 306 310 352 357 351 307 308 30A 342 343 344 34A 34B 34C 303 302 30C 350 300 301 30B 30F 312 313 314 33D 309 363 364 365 366 367 368 369 36A 36B 36C 36D 36E 36F 33E 35B");
  var ZALGO_DOWN = cps("316 317 318 319 31C 31D 31E 31F 320 324 325 326 329 32A 32B 32C 32D 32E 32F 330 331 332 333 339 33A 33B 33C 345 347 348 349 34D 34E 353 354 355 356 359 35A 323");
  var ZALGO_MID = cps("334 335 336 337 338");
  function zalgo(s, up, mid, down) {
    var add = function (pool, k) {
      var out = "", n = k ? 1 + rnd(k) : 0;
      for (var i = 0; i < n; i++) out += pool[rnd(pool.length)];
      return out;
    };
    return U.graphemes(s).map(function (g) {
      return g.trim() ? g + add(ZALGO_UP, up) + add(ZALGO_MID, mid) + add(ZALGO_DOWN, down) : g;
    }).join("");
  }
  var ZK = [1, 3, 6];
  function shake(t, lv) {
    var k = ZK[lv];
    return { both: zalgo(t, k, 0, k), up: zalgo(t, k * 2, 0, 0), down: zalgo(t, 0, 0, k * 2), mid: zalgo(t, lv > 1 ? 1 : 0, lv + 1, lv > 1 ? 1 : 0) };
  }
  function mark(s, m) { return U.graphemes(s).map(function (g) { return g.trim() ? g + m : g; }).join(""); }
  /* 有的浏览器（比如安卓和 Linux 上的 Chrome）画不出叠在汉字上的组合符号，会显示成方框。
     量一下「我」加上这个符号会不会变宽：变宽了说明没叠上去，预览就改用 CSS 模拟，复制出去的仍是真正的字符。 */
  var FX_FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Noto Sans CJK SC",system-ui,sans-serif';
  var markOK = (function () {
    var cache = {}, ctx = null;
    return function (m) {
      if (m in cache) return cache[m];
      var ok = true;
      try {
        if (!ctx) { ctx = document.createElement("canvas").getContext("2d"); ctx.font = "40px " + FX_FONT; }
        ok = Math.abs(ctx.measureText("我" + m).width - ctx.measureText("我").width) < 2;
      } catch (e) {}
      return (cache[m] = ok);
    };
  })();
  function fakeHTML(f) {
    if (!f.each && !f.sel) return '<span class="fk-' + f.fk + '">' + esc(f.gs.join("")) + "</span>";
    return f.gs.map(function (g, i) {
      return !g.trim() || (f.sel && !f.sel[i]) ? esc(g) : '<span class="fk-' + f.fk + '">' + esc(g) + "</span>";
    }).join("");
  }
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
  var ITALIC_HOLES = { h: "ℎ" };
  var NEG_DIGITS = { 0: "⓿", 1: "❶", 2: "❷", 3: "❸", 4: "❹", 5: "❺", 6: "❻", 7: "❼", 8: "❽", 9: "❾" };
  var SUP = { a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ", i: "ⁱ", j: "ʲ", k: "ᵏ", l: "ˡ", m: "ᵐ", n: "ⁿ", o: "ᵒ", p: "ᵖ", q: "ᑫ", r: "ʳ", s: "ˢ", t: "ᵗ", u: "ᵘ", v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾" };
  /* Unicode 里本来就有的圈字：一到十、月火水木金土日、上中下左右……（简体也认），外加字母和数字 */
  var CIRCLED = (function () {
    var m = {}, src = "一㊀二㊁三㊂四㊃五㊄六㊅七㊆八㊇九㊈十㊉月㊊火㊋水㊌木㊍金㊎土㊏日㊐株㊑有㊒社㊓名㊔特㊕財㊖祝㊗労㊘秘㊙男㊚女㊛適㊜優㊝印㊞注㊟項㊠休㊡写㊢正㊣上㊤中㊥下㊦左㊧右㊨医㊩宗㊪学㊫監㊬企㊭資㊮協㊯夜㊰财㊖劳㊘适㊜优㊝项㊠监㊬资㊮协㊯";
    for (var i = 0; i < src.length; i += 2) m[src[i]] = src[i + 1];
    for (var d = 1; d <= 9; d++) m[d] = String.fromCharCode(0x2460 + d - 1);
    m[0] = "⓪";
    for (var c = 0; c < 26; c++) {
      m[String.fromCharCode(65 + c)] = String.fromCharCode(0x24B6 + c);
      m[String.fromCharCode(97 + c)] = String.fromCharCode(0x24D0 + c);
    }
    return m;
  })();
  function circled(s) {
    var n = 0, total = 0;
    var t = Array.from(s).map(function (ch) {
      if (!ch.trim()) return ch;
      total++;
      if (CIRCLED[ch]) { n++; return CIRCLED[ch]; }
      return ch;
    }).join("");
    return { t: t, n: n, total: total };
  }
  function wide(s) {
    return U.graphemes(s).map(function (g) {
      if (g === " ") return "　";
      var c = g.charCodeAt(0);
      return g.length === 1 && c > 0x20 && c < 0x7F ? String.fromCharCode(c + 0xFEE0) : g;
    }).join("　");
  }
  var smallcaps = function (s) { return Array.from(s).map(function (ch) { var c = ch.toLowerCase().charCodeAt(0); return c >= 97 && c <= 122 ? SMALLCAPS[c - 97] : ch; }).join(""); };
  var supText = function (s) { return Array.from(s.toLowerCase()).map(function (ch) { return SUP[ch] || ch; }).join(""); };
  var flip = function (s) { return Array.from(s.toLowerCase()).reverse().map(function (ch) { return FLIP[ch] || ch; }).join(""); };
  var TAIL = /[\s，。！？!?,.~～…]+$/;

  function maskList(c) {
    var gs = c.gs, sel = c.mask;
    if (!sel.some(Boolean)) return [];
    var m = function (f) { return gs.map(function (g, i) { return sel[i] && g.trim() ? f(g, i) : g; }).join(""); };
    var beep = "", run = 0;
    gs.forEach(function (g, i) {
      if (sel[i] && g.trim()) { run++; return; }
      if (run) beep += "哔" + new Array(run + 1).join("—");
      run = 0;
      beep += g;
    });
    if (run) beep += "哔" + new Array(run + 1).join("—");
    return [
      ["黑条", m(function () { return "█"; })],
      ["马赛克", m(function (g, i) { return "▓▒░▒▓░"[(i * 5 + 3) % 6]; })],
      ["口口（屏蔽词）", m(function () { return "口"; })],
      ["叉叉", m(function () { return "×"; })],
      ["星号", m(function () { return "*"; })],
      ["消音", beep],
      ["只划掉这几个字", m(function (g) { return g + "\u0336"; }), { m: "\u0336", fk: "strike", sel: sel, gs: gs }]
    ];
  }
  var FX_SECS = [
    { id: "line", name: "划线", note: "原理：每个字后面跟一个「组合符号」，它会叠在前一个字身上。",
      list: function (c) {
        var one = function (label, m, fk, each) { return [label, mark(c.t, m), { m: m, fk: fk, each: each, gs: c.gs }]; };
        return [one("删除线", "\u0336", "strike"), one("斜着划掉", "\u0338", "slash", true), one("下划线", "\u0332", "under"), one("双下划线", "\u0333", "double"),
          one("波浪线", "\u0330", "wave"), one("上划线", "\u0305", "over"), one("着重号", "\u0323", "dot")];
      } },
    { id: "ring", name: "圈和框", note: "圈、框、禁止也是组合符号，套在每个字外面。「现成圈字」是 Unicode 里本来就有的字，哪儿都能显示，可惜只有几十个。",
      list: function (c) {
        var r = circled(c.t);
        var one = function (label, m, fk) { return [label, mark(c.t, m), { m: m, fk: fk, each: true, gs: c.gs }]; };
        return [one("圈起来", "\u20DD", "ring"), one("框起来", "\u20DE", "box"), one("禁止", "\u20E0", "ban"),
          r.n ? ["现成圈字" + (r.n < r.total ? "（有 " + r.n + " 个字能圈）" : ""), r.t]
            : ["现成圈字", "这句话里没有能圈的字。现成的只有一到十、月火水木金土日、上中下左右、男女、学、秘、注、休、正、夜这些，外加英文字母和数字。", "off"]];
      } },
    { id: "lay", name: "排版",
      list: function (c) {
        var g = c.gs, core = c.t.replace(TAIL, "") || c.t, cg = U.graphemes(core);
        var first = cg[0] || "", last = cg[cg.length - 1] || "";
        return [["蒸汽波宽字", wide(c.t)], ["字间爱心", g.join("♡")], ["字间星星", g.join("✧")], ["字间小点", g.join("·")],
          ["结巴", first + first + first + "……" + c.t], ["拉长音", core + last + last + "～～"], ["倒着说", g.slice().reverse().join("")],
          ["竖着写", g.filter(function (x) { return x.trim(); }).join("\n")]];
      } },
    { id: "mask", name: "打码", note: "点下面的字，选哪几个要打码。", list: maskList },
    { id: "glitch", name: "鬼畜",
      list: function (c) {
        /* 鬼畜用的符号很杂，挑几个冷门的一起量 */
        var one = function (label, t, fk) { return [label, t, { m: "\u0353\u0363\u0334\u035B", fk: fk, gs: c.gs }]; };
        return [one("上下乱窜", c.z.both, "zboth"), one("往上长", c.z.up, "zup"), one("往下滴", c.z.down, "zdown"), one("糊掉", c.z.mid, "zmid")];
      } },
    { id: "en", name: "英文",
      list: function (c) {
        var e = c.en;
        return [["花体", mapLatin(e, 0x1D4D0, 0x1D4EA)], ["哥特体", mapLatin(e, 0x1D56C, 0x1D586)], ["空心体", mapLatin(e, 0x1D538, 0x1D552, 0x1D7D8, DOUBLE_HOLES)],
          ["粗体", mapLatin(e, 0x1D400, 0x1D41A, 0x1D7CE)], ["无衬线粗体", mapLatin(e, 0x1D5D4, 0x1D5EE, 0x1D7EC)], ["斜体", mapLatin(e, 0x1D434, 0x1D44E, null, ITALIC_HOLES)],
          ["打字机", mapLatin(e, 0x1D670, 0x1D68A, 0x1D7F6)], ["全角", mapLatin(e, 0xFF21, 0xFF41, 0xFF10)], ["小型大写", smallcaps(e)],
          ["上标小字（小声说）", supText(e)], ["圈圈字", mapLatin(e, 0x24B6, 0x24D0, null, CIRCLED)], ["黑圈字", mapLatin(e, 0x1F150, 0x1F150, null, NEG_DIGITS)],
          ["方块字", mapLatin(e, 0x1F130, 0x1F130)], ["倒过来", flip(e)]];
      } }
  ];
  var FX_BY = {};
  FX_SECS.forEach(function (s) { FX_BY[s.id] = s; });
  var fxs = { text: "我不想上班", tab: "all", zk: 1, en: "good night", mask: [], maskFor: null, z: null, zFor: "" };
  function autoMask(gs) {
    var idx = [];
    gs.forEach(function (g, i) { if (g.trim()) idx.push(i); });
    var sel = gs.map(function () { return false; }), n = idx.length;
    if (!n) return sel;
    var a = n <= 2 ? n - 1 : Math.floor(n / 3), b = n <= 2 ? n - 1 : Math.ceil(n * 2 / 3) - 1;
    for (var j = a; j <= b; j++) sel[idx[j]] = true;
    return sel;
  }
  function fxCtx(reshake) {
    var t = fxs.text.trim() ? fxs.text : "我不想上班";
    var gs = U.graphemes(t), fresh = fxs.maskFor !== t;
    if (fresh) { fxs.mask = autoMask(gs); fxs.maskFor = t; }
    var zKey = t + "|" + fxs.zk;
    if (reshake || fxs.zFor !== zKey) { fxs.z = shake(t, fxs.zk); fxs.zFor = zKey; }
    var latin = /[A-Za-z0-9]/.test(t);
    return { t: t, gs: gs, mask: fxs.mask, z: fxs.z, fresh: fresh, latin: latin, en: latin ? t : (fxs.en.trim() || "good night") };
  }
  function fxCard(o) {
    if (o[2] === "off") return '<div class="fx-card off"><span class="fx-l">' + esc(o[0]) + '</span><span class="fx-t">' + esc(o[1]) + "</span></div>";
    var fake = o[2] && !markOK(o[2].m);
    return '<button class="fx-card' + (fake ? " fake" : "") + '" type="button"' + copyAttr(o[1]) + '><span class="fx-l">' + esc(o[0]) + "</span>" +
      '<span class="fx-t">' + (fake ? fakeHTML(o[2]) : esc(o[1])) + "</span></button>";
  }
  /* 先搭好每一节的架子，打字时只换卡片，这样英文那一栏的输入框不会丢焦点 */
  function fxBuild() {
    var secs = FX_SECS.filter(function (s) { return fxs.tab === "all" || fxs.tab === s.id; });
    $("#fxOut").innerHTML = secs.map(function (s) {
      var ctl = "";
      if (s.id === "glitch") {
        ctl = '<div class="seg" role="group" aria-label="抖动强度">' + ["轻轻抖", "抖起来", "炸了"].map(function (l, i) {
          return '<button type="button" data-zk="' + i + '" aria-pressed="' + (fxs.zk === i) + '">' + l + "</button>";
        }).join("") + '</div><button class="btn sm ghost" type="button" id="fxShake">再抖一次</button>';
      }
      return '<section class="fx-sec" data-sec="' + s.id + '">' +
        '<div class="fx-sec-h"><h3>' + s.name + "</h3>" + ctl + "</div>" +
        (s.note ? '<p class="fx-note">' + esc(s.note) + "</p>" : "") +
        (s.id === "mask" ? '<div class="mask-keys" id="maskKeys"></div>' : "") +
        (s.id === "en" ? '<label class="en-in" id="enWrap"><span>这一组只认英文字母和数字，在这里单独写一句：</span>' +
          '<input class="field" id="fxEn" maxlength="40" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(fxs.en) + '"></label>' : "") +
        '<div class="fx-grid"></div>' +
        '<p class="fx-sim" hidden>这个浏览器画不出组合符号，虚线框里是模拟的样子；复制出去的是真的，手机聊天软件里能正常显示。</p></section>';
    }).join("");
    fxFill(false, true);
  }
  function fxFill(reshake, keys) {
    var out = $("#fxOut");
    if (!out) return;
    var c = fxCtx(reshake);
    $$(".fx-sec", out).forEach(function (el) {
      var list = FX_BY[el.getAttribute("data-sec")].list(c);
      $(".fx-grid", el).innerHTML = list.length ? list.map(fxCard).join("") : '<p class="fx-empty">先点上面的字，选几个要打码的。</p>';
      $(".fx-sim", el).hidden = !$(".fx-card.fake", el);
    });
    var mk = $("#maskKeys");
    if (mk && (keys || c.fresh)) {
      mk.innerHTML = c.gs.map(function (g, i) {
        return g.trim() ? '<button class="mask-key' + (c.mask[i] ? " on" : "") + '" type="button" data-i="' + i + '" aria-pressed="' + !!c.mask[i] + '">' + esc(g) + "</button>" : '<span class="mask-gap"></span>';
      }).join("");
    }
    var ew = $("#enWrap");
    if (ew) ew.hidden = c.latin;
  }
  function renderFx(v) {
    v.innerHTML = toolHead("fx") +
      '<div class="fx-head">' +
        '<input class="field" id="fxIn" maxlength="40" autocomplete="off" enterkeyhint="done" placeholder="写一句话" aria-label="要变花样的话" value="' + esc(fxs.text) + '">' +
        '<div class="fx-tabs" id="fxTabs" role="group" aria-label="效果分组">' +
          [["all", "全部"]].concat(FX_SECS.map(function (s) { return [s.id, s.name]; })).map(function (tb) {
            return '<button class="fx-tab" type="button" data-fxtab="' + tb[0] + '" aria-pressed="' + (fxs.tab === tb[0]) + '">' + tb[1] + "</button>";
          }).join("") +
        "</div>" +
      "</div>" +
      '<div class="row fx-quick" id="fxQuick">' + fillChips(["我不想上班", "笑死我了", "好饿", "上中下", "Monday", "爱你"]) +
        '<span class="fx-hint">点卡片就复制</span></div>' +
      '<div id="fxOut"></div>';
    var inp = $("#fxIn");
    var redraw = function () { fxs.text = inp.value; fxFill(); };
    inp.addEventListener("input", redraw);
    $("#fxQuick").onclick = function (e) {
      var b = e.target.closest("[data-fill]");
      if (b) { inp.value = b.getAttribute("data-fill"); redraw(); }
    };
    $("#fxTabs").onclick = function (e) {
      var b = e.target.closest("[data-fxtab]");
      if (!b) return;
      fxs.tab = b.getAttribute("data-fxtab");
      $$(".fx-tab").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      fxBuild();
      var tabs = this, head = $(".fx-head");
      tabs.scrollTo({ left: b.offsetLeft - tabs.clientWidth / 2 + b.offsetWidth / 2, behavior: K.reduceMotion ? "auto" : "smooth" });
      var y = $("#fxOut").getBoundingClientRect().top + window.scrollY - head.offsetHeight - 4;
      if (window.scrollY > y) window.scrollTo(0, y);
    };
    var out = $("#fxOut");
    out.addEventListener("click", function (e) {
      var k = e.target.closest(".mask-key");
      if (k) {
        var i = +k.getAttribute("data-i");
        fxs.mask[i] = !fxs.mask[i];
        k.classList.toggle("on", fxs.mask[i]);
        k.setAttribute("aria-pressed", fxs.mask[i]);
        fxFill();
        K.haptic(5);
        return;
      }
      var z = e.target.closest("[data-zk]");
      if (z) {
        fxs.zk = +z.getAttribute("data-zk");
        $$("[data-zk]", out).forEach(function (x) { x.setAttribute("aria-pressed", x === z); });
        fxFill();
        return;
      }
      if (e.target.closest("#fxShake")) {
        fxFill(true);
        var sec = $('[data-sec="glitch"]', out);
        if (sec && !K.reduceMotion) { sec.classList.remove("shaking"); void sec.offsetWidth; sec.classList.add("shaking"); }
        K.haptic(12);
      }
    });
    out.addEventListener("input", function (e) {
      if (e.target.id === "fxEn") { fxs.en = e.target.value; fxFill(); }
    });
    fxBuild();
  }

  /* ================= 换个语气 ================= */
  var CLAUSE_RE = /([，。！？!?,.、;；～~…\s]+)/;
  /* 拆成 [一小句, 后面的标点] */
  function clauses(t) {
    var parts = t.split(CLAUSE_RE), out = [];
    for (var i = 0; i < parts.length; i += 2) if (parts[i] || parts[i + 1]) out.push([parts[i] || "", parts[i + 1] || ""]);
    return out;
  }
  function swapWords(t, map) {
    var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    return t.replace(new RegExp(keys.join("|"), "g"), function (m) { return map[m]; });
  }
  var isEnd = function (p, i, last) { return i === last || /[。.！!]/.test(p); };

  var JIA = {
    "什么": "神马", "怎么": "肿么", "这样子": "酱紫", "这样": "酱紫", "非常": "灰常", "喜欢": "稀饭", "没有": "木有",
    "好的": "好哒", "是的": "是哒", "觉得": "jio得", "可爱": "阔爱", "这个": "介个", "吃饭": "次饭饭", "睡觉": "睡觉觉",
    "喝水": "喝水水", "晚安": "晚安安", "早安": "早安安", "谢谢": "谢谢嗷", "宝贝": "宝宝", "不要": "不要嘛", "好累": "好累累",
    "好饿": "饿饿", "上班": "上班班", "回家": "回家家", "生气": "生气气", "我们": "我们", "我": "人家"
  };
  var JIA_END = { "了": ["惹", "啦"], "吗": ["嘛"], "吧": ["叭"], "呀": ["鸭"], "啊": ["鸭", "呀"], "呢": ["捏"], "的": ["哒"], "哦": ["喔"] };
  var JIA_FACES = ["(｡•ㅅ•｡)♡", "(*/ω＼*)", "( ˶ˆ꒳ˆ˵ )", "(｡>﹏<｡)", "ฅ(＞ω＜*ฅ)", "(⁄ ⁄•⁄ω⁄•⁄ ⁄)", "(〃ﾉωﾉ)", "(｡・ω・｡)ﾉ♡"];
  function jiazi(t, r) {
    var cl = clauses(swapWords(t, JIA)), last = cl.length - 1;
    return cl.map(function (c, i) {
      var s = c[0], p = c[1];
      if (!s.trim()) return s + p;
      var end = s.slice(-1);
      if (JIA_END[end]) s = s.slice(0, -1) + pickBy(JIA_END[end], r);
      else if (isEnd(p, i, last)) s += pickBy(["嘛", "呀", "啦", "哒", ""], r);
      if (/[？?]/.test(p)) p = "？";
      else if (isEnd(p, i, last)) p = pickBy(["～", "～～", "～♡"], r);
      return s + p;
    }).join("") + " " + pickBy(JIA_FACES, r);
  }

  var MIAO = { "我们": "本喵们", "我": "本喵", "猫": "喵" };
  var MIAO_ACTS = ["（伸懒腰）", "（踩奶）", "（呼噜呼噜）", "（甩尾巴）", "（舔爪子）", "（把杯子推下桌）", "（钻进纸箱）"];
  var MIAO_FACES = ["ฅ^•ﻌ•^ฅ", "(=^･ω･^=)", "(=①ω①=)", "/ᐠ｡ꞈ｡ᐟ\\", "ฅ(ﾐ・ﻌ・ﾐ)ฅ", "(ↀДↀ)✧", "ᓚᘏᗢ"];
  function miao(t, r) {
    var cl = clauses(swapWords(t, MIAO)), last = cl.length - 1;
    var out = cl.map(function (c, i) {
      var s = c[0], p = c[1];
      if (!s.trim()) return s + p;
      var end = s.slice(-1), ask = /[？?]/.test(p);
      if (end === "吗") { s = s.slice(0, -1) + "喵"; ask = true; }
      else if (end === "呢" || end === "啊" || end === "呀") s = s.slice(0, -1) + "喵";
      else if (end !== "喵") s += "喵";
      if (ask) p = "？";
      else if (i === last) p = pickBy(["～", "！", "～～"], r);
      return s + p;
    }).join("");
    if (r() < 0.65) out += pickBy(MIAO_ACTS, r);
    return out + " " + pickBy(MIAO_FACES, r);
  }

  var FENG = [
    "{t}！！！{t}！！！我真的会谢 (╯°□°）╯︵ ┻━┻",
    "家人们谁懂啊，{t}，我直接一个原地爆炸 ヽ(｀Д´)ﾉ",
    "好好好，{t}是吧，行行行，我发疯，我发疯，我发疯 (ﾉ｀Д)ﾉ",
    "{t}？？？凭什么？？？我不理解！！！我不理解！！！(ﾟДﾟ≡ﾟдﾟ)!?",
    "啊啊啊啊啊啊{t}啊啊啊啊啊啊啊 ヽ(ﾟДﾟ)ﾉ",
    "我真的，我真的，我真的{t}，谁来管管我 _(:3 」∠)_",
    "{t}。不是，这合理吗？这不合理！(╬ Ò﹏Ó)",
    "我宣布：{t}。谁反对？反对无效！٩(╬ʘ益ʘ╬)۶",
    "已老实，求放过。但是{t}！！！(눈_눈)",
    "{t}{t}{t}（精神状态良好）(◉ω◉)",
    "破防了家人们，{t}，碎了，又自己粘好了 (｡•́︿•̀｡)",
    "{t}，那我走？？？(╯‵□′)╯",
    "你知道吗，{t}。我现在情绪非常稳定，稳定地发疯 (⊙ˍ⊙)",
    "{t}！说完了，我先去尖叫一会儿 ε=ε=ε=┏(゜ロ゜;)┛"
  ];
  function feng(t, r) {
    var core = t.replace(TAIL, "") || t;
    return pickBy(FENG, r).replace(/\{t\}/g, function () { return core; });
  }

  /* 火星文：形近字、注音符号、日文假名，外加一圈「ゞ」 */
  var HUOXING = {
    "的": "の旳ㄉ", "我": "莪硪偶", "你": "伱沵", "是": "昰湜", "不": "吥卟", "了": "ㄌ孒", "么": "庅嚒麼", "好": "恏",
    "爱": "噯嬡", "喜": "禧", "欢": "歡懽", "有": "侑洧", "人": "亾秂", "在": "茬洅", "这": "這", "们": "們扪", "很": "佷",
    "说": "説詤", "上": "仩丄", "天": "兲", "心": "杺芯", "啊": "ㄚ阿", "吗": "ㄇ嗎", "来": "唻", "去": "厾呿", "会": "浍會",
    "要": "婹", "就": "僦", "没": "莈沒", "也": "吔", "都": "嘟", "和": "啝", "吃": "喫", "生": "苼", "快": "赽",
    "乐": "泺樂", "美": "羙", "女": "囡", "小": "尒尛", "大": "汏夶", "时": "溡時", "开": "閞開", "风": "颩凨", "花": "婲埖",
    "月": "仴", "星": "暒煋", "空": "涳", "光": "洸", "家": "傢", "还": "還", "只": "呮", "可": "妸岢", "真": "嫃眞",
    "气": "氣炁", "别": "莂", "班": "斑", "今": "妗", "明": "朙", "年": "秊", "日": "ㄖ", "中": "狆", "国": "國囯",
    "个": "嗰個", "到": "菿", "得": "嘚淂", "对": "對", "过": "過", "多": "哆", "吧": "ㄅ", "哦": "ㄛ", "呢": "ㄋ",
    "为": "爲為", "笑": "咲", "朋": "萠", "友": "伖", "伤": "傷", "难": "難", "晚": "晩", "安": "侒咹", "睡": "腄",
    "觉": "覺斍", "饿": "餓", "饭": "飯", "帅": "帥"
  };
  var HX_WRAP = [["ゞ", "ゞ"], ["≈", "≈"], ["╰☆╮", "╰☆╮"], ["Oo。", "。oO"], ["ヽ", "ゞ"], ["灬", "灬"], ["", " ~ゞ"], ["→", "←"], ["*.。", "。.*"], ["╭⌒", "⌒╮"]];
  function huoxing(t, r) {
    var out = Array.from(t).map(function (ch) {
      var alt = HUOXING[ch];
      return alt && r() < 0.85 ? alt[Math.floor(r() * alt.length)] : ch;
    }).join("");
    var w = pickBy(HX_WRAP, r);
    return w[0] + out + w[1];
  }

  /* 配个表情：每一小句拿去图鉴里搜，挑一张合适的脸跟在后面 */
  function faceFor(s, r, used) {
    var hit = K.search(s);
    if (!hit || !hit.list.length) return "";
    var pool = hit.list.slice(0, 16).map(function (x) { return K.items[x.i]; }).filter(function (it) {
      /* 台词版里那种自带一串汉字的脸不要，免得和句子打架 */
      return it.t.indexOf("\n") < 0 && !used[it.t] && U.width(it.t, 2) <= 22 && !(K.state.set.safe && it.lv === 2) &&
        (it.t.match(/[\u4E00-\u9FFF]/g) || []).length < 2 &&
        it.cats.some(function (c) { return K.partCats.indexOf(c) < 0; });
    }).slice(0, 6);
    if (!pool.length) return "";
    var f = pickBy(pool, r).t;
    used[f] = 1;
    return f;
  }
  function peiFace(t, r) {
    var used = {}, any = false;
    var out = clauses(t).map(function (c) {
      var s = c[0], p = c[1];
      if (!s.trim()) return s + p;
      var f = faceFor(s, r, used);
      if (!f) return s + p;
      any = true;
      return s + " " + f + (p.trim() ? p.trim() : p);
    }).join("");
    if (!any) out = out.replace(/\s+$/, "") + " " + (faceFor(t, r, used) || pickBy(["(・ω・)", "( ˙-˙ )", "(｀・ω・´)"], r));
    return out;
  }

  var TONES = [
    { id: "jia", name: "夹子音", seal: "夹", tint: 0, hint: "嗲嗲的，尾音带波浪", fn: jiazi },
    { id: "miao", name: "猫猫语", seal: "喵", tint: 2, hint: "句句都要喵一下", fn: miao },
    { id: "feng", name: "发疯文学", seal: "疯", tint: 4, hint: "情绪稳定地发疯", fn: feng },
    { id: "huo", name: "火星文", seal: "火", tint: 5, hint: "一股 QQ 空间的味道", fn: huoxing },
    { id: "pei", name: "配个表情", seal: "颜", tint: 3, hint: "按意思从图鉴里挑脸", fn: peiFace }
  ];
  var tones = { text: "我不想上班", seed: {} };
  function toneOf(tn) {
    var t = tones.text.trim() || "我不想上班";
    return tn.fn(t, seeded(K.hash(tn.id + "|" + (tones.seed[tn.id] || 0))));
  }
  function renderTone(v) {
    v.innerHTML = toolHead("tone") +
      '<div class="stack">' +
        '<textarea class="field" id="toneIn" rows="2" maxlength="60" placeholder="写一句话" aria-label="要换语气的话">' + esc(tones.text) + "</textarea>" +
        '<div class="row" id="toneQuick">' + fillChips(["我不想上班", "今天好累想睡觉", "你在干嘛", "好想吃火锅", "我饿了", "晚安"]) +
          '<span class="fx-hint">点气泡就复制</span></div>' +
        '<div class="tone-chat" id="toneOut">' + TONES.map(function (tn) {
          return '<div class="tone-row t' + tn.tint + '" data-tone="' + tn.id + '">' +
            '<span class="tone-seal" aria-hidden="true">' + tn.seal + "</span>" +
            '<div class="tone-main"><div class="tone-name">' + tn.name + "<small>" + tn.hint + "</small></div>" +
            '<div class="tone-line"><button class="tone-bubble" type="button" data-norec></button>' +
            '<button class="tone-re" type="button" aria-label="' + tn.name + '：换一句" title="换一句">' + RE_SVG + "</button></div></div></div>";
        }).join("") + "</div>" +
      "</div>";
    var inp = $("#toneIn");
    var fill = function (only) {
      TONES.forEach(function (tn) {
        if (only && only !== tn.id) return;
        var row = $('[data-tone="' + tn.id + '"]');
        if (!row) return;
        var b = $(".tone-bubble", row), s = toneOf(tn);
        /* 颜文字别在中间折行：一串不含汉字和句读的符号整体不换行 */
        b.innerHTML = esc(s).replace(/[^\s\u4E00-\u9FFF，。！？、；：～]{3,}/g, '<span class="nw">$&</span>');
        b.setAttribute("data-copy", s);
        if (only && !K.reduceMotion) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
      });
    };
    var timer = 0;
    inp.addEventListener("input", function () {
      tones.text = inp.value;
      clearTimeout(timer);
      timer = later(fill, 120);
    });
    $("#toneQuick").onclick = function (e) {
      var b = e.target.closest("[data-fill]");
      if (b) { inp.value = tones.text = b.getAttribute("data-fill"); fill(); }
    };
    $("#toneOut").addEventListener("click", function (e) {
      var re = e.target.closest(".tone-re");
      if (!re) return;
      var id = re.closest("[data-tone]").getAttribute("data-tone");
      tones.seed[id] = (tones.seed[id] || 0) + 1;
      fill(id);
      if (!K.reduceMotion) { re.classList.remove("spin"); void re.offsetWidth; re.classList.add("spin"); }
      K.haptic(6);
    });
    fill();
  }

  /* ================= 暗号机 ================= */
  var MORSE = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--",
    N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
    0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
    ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...",
    ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-", "\"": ".-..-.", "$": "...-..-", "@": ".--.-."
  };
  var MORSE_REV = {};
  Object.keys(MORSE).forEach(function (k) { MORSE_REV[MORSE[k]] = k; });
  var ZH_PUNCT = { "。": ".", "、": ",", "“": "\"", "”": "\"", "‘": "'", "’": "'", "…": "...", "—": "-" };
  function asciiPunct(s) {
    return s.replace(/[！-～]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[。、“”‘’…—]/g, function (c) { return ZH_PUNCT[c]; });
  }
  /* 字母数字照国际摩斯电码；汉字没有通用电码，先写成 Unicode 编号（我 = U+6211）再敲 */
  function morseEncode(text) {
    return asciiPunct(text).trim().split(/\s+/).filter(Boolean).map(function (w) {
      var out = [];
      Array.from(w).forEach(function (ch) {
        var code = MORSE[ch.toUpperCase()];
        if (code) { out.push(code); return; }
        for (var i = 0; i < ch.length; i++) {
          var hex = ch.charCodeAt(i).toString(16).toUpperCase();
          ("U+" + "0000".slice(hex.length) + hex).split("").forEach(function (x) { out.push(MORSE[x]); });
        }
      });
      return out.join(" ");
    }).join(" / ");
  }
  var morseNorm = function (s) { return s.replace(/[嘀滴·•∙⋅]/g, ".").replace(/[嗒答−—–_]/g, "-").replace(/[|｜\n]/g, " / "); };
  function isMorse(s) {
    var n = morseNorm(s).trim();
    return /^[\s.\-\/]+$/.test(n) && (n.match(/[.\-]/g) || []).length >= 3 && /[\s\/]/.test(n);
  }
  function morseDecode(s) {
    var up = morseNorm(s).trim().split(/\s*\/\s*/).map(function (w) {
      return w.split(/\s+/).filter(Boolean).map(function (l) { return MORSE_REV[l] || "?"; }).join("");
    }).filter(Boolean).join(" ");
    var out = "", last = 0;
    up.replace(/U\+([0-9A-F]{4})/g, function (m, hex, at) {
      out += up.slice(last, at).toLowerCase() + String.fromCharCode(parseInt(hex, 16));
      last = at + m.length;
      return m;
    });
    return out + up.slice(last).toLowerCase();
  }

  /* 盲文：英文字母、数字和常用标点用一级英文盲文（6 点）；
     其他字拆成 UTF-8 字节，一个字节放进一个 8 点盲文格。多字节的字节都 ≥ 0x80，
     正好落在带第 8 点的格子里，和 6 点盲文不会撞，所以两种混着写也能原样解回来。 */
  var BR = "⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵";
  var BR_P = { ",": "⠂", ";": "⠆", ":": "⠒", ".": "⠲", "!": "⠖", "?": "⠦", "'": "⠄", "-": "⠤" };
  var BR_PR = {};
  Object.keys(BR_P).forEach(function (k) { BR_PR[BR_P[k]] = k; });
  var BR_CAP = "⠠", BR_NUM = "⠼", BR_LET = "⠰";
  var utf8 = function (s) { return Array.from(new TextEncoder().encode(s)); };
  var unutf8 = function (bytes) { return new TextDecoder().decode(new Uint8Array(bytes)); };
  function brailleEncode(text) {
    var out = "", num = false;
    Array.from(text).forEach(function (ch) {
      if (ch === "\n") { out += "\n"; num = false; return; }
      if (/\s/.test(ch)) { out += " "; num = false; return; }
      if (/[0-9]/.test(ch)) { if (!num) out += BR_NUM; num = true; out += BR[(+ch + 9) % 10]; return; }
      if (/[A-Za-z]/.test(ch)) {
        var i = ch.toLowerCase().charCodeAt(0) - 97;
        if (num && i < 10) out += BR_LET;
        num = false;
        if (ch < "a") out += BR_CAP;
        out += BR[i];
        return;
      }
      num = false;
      if (BR_P[ch]) { out += BR_P[ch]; return; }
      var c = ch.charCodeAt(0);
      if (c < 0x80) ch = String.fromCharCode(c + 0xFEE0); /* 没有对应盲文的英文符号换成全角，再按字节写 */
      utf8(ch).forEach(function (b) { out += String.fromCharCode(0x2800 + b); });
    });
    return out;
  }
  function isBraille(s) {
    var t = s.replace(/\s/g, ""), n = (t.match(/[⠀-⣿]/g) || []).length;
    return n >= 2 && n >= Array.from(t).length * 0.6;
  }
  function brailleDecode(s) {
    var out = "", bytes = [], cap = false, num = false;
    var flush = function () { if (bytes.length) { out += unutf8(bytes); bytes = []; } };
    Array.from(s).forEach(function (ch) {
      var c = ch.charCodeAt(0);
      if (c >= 0x2880 && c <= 0x28FF) { bytes.push(c - 0x2800); return; }
      flush();
      if (ch === "⠀" || ch === " " || ch === "\n") { out += ch === "\n" ? "\n" : " "; num = false; cap = false; return; }
      if (ch === BR_CAP) { cap = true; return; }
      if (ch === BR_NUM) { num = true; return; }
      if (ch === BR_LET) { num = false; return; }
      var i = BR.indexOf(ch);
      if (i >= 0) {
        if (num && i < 10) { out += "1234567890"[i]; return; }
        num = false;
        out += String.fromCharCode((cap ? 65 : 97) + i);
        cap = false;
        return;
      }
      num = false;
      if (BR_PR[ch]) { out += BR_PR[ch]; return; }
      out += c >= 0x2800 && c <= 0x28FF ? "?" : ch;
    });
    flush();
    return out;
  }

  /* 隐形墨水：悄悄话的每一位变成零宽空格（0）或零宽不连字（1），前后用「词连接符」包起来，塞在第一个字后面 */
  var ZW0 = "\u200B", ZW1 = "\u200C", ZWE = "\u2060";
  function inkHide(cover, secret) {
    var bits = utf8(secret).map(function (b) { return ("0000000" + b.toString(2)).slice(-8); }).join("");
    var pay = ZWE + bits.replace(/0/g, ZW0).replace(/1/g, ZW1) + ZWE;
    var g = U.graphemes(cover);
    return { text: g[0] + pay + g.slice(1).join(""), n: pay.length };
  }
  function inkFind(s) {
    var m = /\u2060([\u200B\u200C]{8,})\u2060/.exec(s);
    if (!m) return null;
    var bits = m[1].replace(/\u200B/g, "0").replace(/\u200C/g, "1"), bytes = [];
    for (var i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
    return { secret: unutf8(bytes), cover: s.replace(m[0], "") };
  }

  /* 敲电码：Web Audio 发声，信号灯跟着闪，安卓上还会跟着震 */
  var player = null;
  function stopMorse() {
    if (!player) return;
    var p = player;
    player = null;
    p.stop();
  }
  function playMorse(code, tick, done) {
    stopMorse();
    var unit = 0.075, tones = [], marks = [], t = 0;
    code.split(" ").forEach(function (tok, k) {
      if (tok === "/") { t += unit * 4; return; }
      marks.push([t, k]);
      for (var i = 0; i < tok.length; i++) {
        var d = tok[i] === "-" ? unit * 3 : unit;
        tones.push([t, t + d]);
        t += d + unit;
      }
      t += unit * 2;
    });
    var total = t, ac = null;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        ac = new AC();
        var osc = ac.createOscillator(), gain = ac.createGain(), t0 = ac.currentTime + 0.05;
        osc.type = "sine";
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0, 0);
        tones.forEach(function (x) {
          gain.gain.setValueAtTime(0, t0 + x[0]);
          gain.gain.linearRampToValueAtTime(0.2, t0 + x[0] + 0.006);
          gain.gain.setValueAtTime(0.2, t0 + x[1] - 0.006);
          gain.gain.linearRampToValueAtTime(0, t0 + x[1]);
        });
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + total + 0.1);
      }
    } catch (e) { ac = null; }
    if (K.state.set.haptic && navigator.vibrate && tones.length) {
      var pat = [];
      tones.forEach(function (x, i) {
        pat.push(Math.round((x[1] - x[0]) * 1000));
        if (i < tones.length - 1) pat.push(Math.round((tones[i + 1][0] - x[1]) * 1000));
      });
      try { navigator.vibrate(pat); } catch (e) {}
    }
    var start = performance.now() + 50, raf = 0, ti = 0;
    var stop = function () {
      cancelAnimationFrame(raf);
      if (ac) { try { ac.close(); } catch (e) {} }
      if (navigator.vibrate) { try { navigator.vibrate(0); } catch (e) {} }
      tick(false, -1);
      done();
    };
    var frame = function () {
      var el = (performance.now() - start) / 1000;
      while (ti < tones.length && el > tones[ti][1]) ti++;
      var k = -1;
      for (var j = marks.length - 1; j >= 0; j--) if (el >= marks[j][0]) { k = marks[j][1]; break; }
      tick(ti < tones.length && el >= tones[ti][0], k);
      if (el > total) { player = null; stop(); return; }
      raf = requestAnimationFrame(frame);
    };
    player = { stop: stop };
    cleanups.push(stopMorse);
    raf = requestAnimationFrame(frame);
  }

  var CODE_MODES = [
    { id: "morse", name: "摩斯电码", ico: "·−·", lbl: "想说的话", hint: "或者粘贴收到的电码，会自动翻译",
      eg: ["SOS", "老地方见", "I miss you"], demo: function () { return morseEncode("晚安"); },
      note: "字母和数字按国际摩斯电码敲；汉字没有通用电码，这里先换成 Unicode 编号（「我」是 U+6211）再敲，只有用这台暗号机才能变回汉字。手机静音时听不到声音，信号灯照样会闪。" },
    { id: "braille", name: "盲文", ico: "⠿", lbl: "想说的话", hint: "或者粘贴收到的盲文，会自动翻译",
      eg: ["hello", "Good night", "我想你了"], demo: function () { return brailleEncode("see you"); },
      note: "英文字母、数字和常用标点是真正的盲文（一级英文盲文），视障朋友能摸读。中文盲文要按拼音来写，这里把汉字拆成字节放进 8 点盲文格：看着像盲文，其实是暗号，只能在这里解开。" },
    { id: "ink", name: "隐形墨水", ico: "✦", lbl: "藏起来的悄悄话", hint: "或者粘贴一句可疑的话，看看里面藏了什么",
      eg: ["其实我想请你吃饭", "生日快乐！", "今晚八点老地方"], demo: function () { return inkHide("今天天气不错", "被你发现啦 (๑•̀ㅂ•́)و✧").text; },
      note: "悄悄话会变成一串看不见的字符，藏在第一个字后面。对方把整句话复制回这里就能显影。有的 App 会把看不见的字符删掉，先发给自己试试。" }
  ];
  var CODE_BY = {};
  CODE_MODES.forEach(function (m) { CODE_BY[m.id] = m; });
  var cs = { mode: "morse", di: false, text: "老地方见", cover: "今天天气不错", shown: "" };
  function renderCode(v) {
    v.innerHTML = toolHead("code") +
      '<div class="code-modes" id="codeModes" role="group" aria-label="暗号种类">' + CODE_MODES.map(function (m) {
        return '<button class="code-mode" type="button" data-mode="' + m.id + '" aria-pressed="' + (cs.mode === m.id) + '"><b aria-hidden="true">' + m.ico + "</b><span>" + m.name + "</span></button>";
      }).join("") + "</div>" +
      '<div class="panel stack code-panel">' +
        '<label class="stack code-field"><span class="code-lbl"><b id="codeLbl"></b><small id="codeHint"></small></span>' +
        '<textarea class="field" id="codeIn" rows="3" maxlength="20000" spellcheck="false">' + esc(cs.text) + "</textarea></label>" +
        '<label class="stack code-field" id="coverWrap"><span class="code-lbl"><b>表面上的话</b><small>别人只看得到这一句</small></span>' +
        '<input class="field" id="coverIn" maxlength="60" autocomplete="off" value="' + esc(cs.cover) + '"></label>' +
        '<div class="row" id="codeQuick"></div>' +
      "</div>" +
      '<div id="codeOut" aria-live="polite"></div>' +
      '<p class="tool-d code-note" id="codeNote"></p>';
    var inp = $("#codeIn"), cover = $("#coverIn"), out = $("#codeOut"), curK = -1;
    var setMode = function (id, auto) {
      cs.mode = id;
      var m = CODE_BY[id];
      $$(".code-mode").forEach(function (b) {
        var on = b.getAttribute("data-mode") === id;
        b.setAttribute("aria-pressed", on);
        if (on && auto && !K.reduceMotion) { b.classList.remove("ping"); void b.offsetWidth; b.classList.add("ping"); }
      });
      $("#codeLbl").textContent = m.lbl;
      $("#codeHint").textContent = m.hint;
      $("#codeQuick").innerHTML = fillChips(m.eg.concat([["收到一段暗号？试着解开", m.demo()]]));
      $("#codeNote").textContent = m.note;
    };
    var tick = function (lit, k) {
      var lamp = $("#lamp");
      if (lamp) lamp.classList.toggle("on", lit);
      if (k === curK) return;
      var old = $(".mk.on", out), box = $("#mkView");
      if (old) old.classList.remove("on");
      curK = k;
      var el = k >= 0 && $('.mk[data-k="' + k + '"]', out);
      if (el && box) {
        el.classList.add("on");
        if (el.offsetTop < box.scrollTop || el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = el.offsetTop - box.clientHeight / 2;
      }
    };
    var draw = function () {
      stopMorse();
      cs.text = inp.value;
      cs.cover = cover.value;
      var raw = inp.value, t = raw.trim();
      var found = inkFind(raw);
      var kind = found ? "ink" : isMorse(t) ? "morse" : isBraille(t) ? "braille" : "";
      if (kind && kind !== cs.mode) setMode(kind, true);
      $("#coverWrap").hidden = cs.mode !== "ink" || !!kind;
      if (!t && !found) {
        cs.shown = "";
        out.innerHTML = '<div class="code-res blank-res"><p>先写一句话，下面就会变成暗号。</p></div>';
        return;
      }
      if (kind) {
        var plain = kind === "ink" ? found.secret : kind === "morse" ? morseDecode(t) : brailleDecode(t);
        var fresh = cs.shown !== "open|" + plain;
        cs.shown = "open|" + plain;
        out.innerHTML = '<div class="code-res open">' +
          '<div class="code-res-h"><span>解开了</span><small>' + { ink: "这句话里藏着隐形墨水", morse: "认出来是摩斯电码", braille: "认出来是盲文" }[kind] + "</small></div>" +
          '<div class="code-plain' + (fresh && !K.reduceMotion ? " develop" : "") + '">' + esc(plain || "（空的）") + "</div>" +
          (kind === "ink" ? '<p class="code-sub">表面上的话：' + esc(found.cover.trim() || "（没有）") + "</p>" : "") +
          '<div class="row"><button class="btn sm pink" type="button"' + copyAttr(plain) + ">复制解出来的话</button>" +
          '<button class="btn sm ghost" type="button" id="codeClear">清空，写一句新的</button></div></div>';
        if (fresh) K.setMood("wow", 1200);
        return;
      }
      cs.shown = "";
      var m = cs.mode, html = "";
      if (m === "morse") {
        var code = morseEncode(t), shown = cs.di ? code.replace(/\./g, "嘀").replace(/-/g, "嗒") : code;
        var toks = (cs.di ? shown : code.replace(/\./g, "·").replace(/-/g, "−")).split(" ");
        html = '<div class="code-res-h"><span>变成电码</span><div class="seg" role="group" aria-label="写法">' +
            '<button type="button" data-di="0" aria-pressed="' + !cs.di + '">点划</button><button type="button" data-di="1" aria-pressed="' + cs.di + '">嘀嗒</button></div></div>' +
          '<div class="code-big' + (cs.di ? " di" : "") + '" id="mkView">' + toks.map(function (x, k) {
            return x === "/" ? '<span class="mk-w">/</span>' : '<span class="mk" data-k="' + k + '">' + esc(x) + "</span>";
          }).join(" ") + "</div>" +
          '<div class="row"><button class="btn sm pink" type="button"' + copyAttr(shown, t) + ">复制电码</button>" +
          '<button class="btn sm" type="button" id="mkPlay" data-code="' + esc(code) + '">敲给你听</button><span class="lamp" id="lamp" aria-hidden="true"></span></div>';
      } else if (m === "braille") {
        var br = brailleEncode(t);
        html = '<div class="code-res-h"><span>变成盲文</span><small>' + Array.from(br.replace(/\s/g, "")).length + " 格</small></div>" +
          '<div class="code-big braille">' + esc(br) + "</div>" +
          '<div class="row"><button class="btn sm pink" type="button"' + copyAttr(br, t) + ">复制盲文</button></div>";
      } else {
        var cv = cover.value.trim() || "今天天气不错", h = inkHide(cv, t), g = U.graphemes(cv);
        html = '<div class="code-res-h"><span>藏好了</span><small>这句话里多了 ' + h.n + " 个看不见的字符</small></div>" +
          '<div class="ink-view">' + esc(g[0]) + '<span class="ink-dot" title="藏在这里">✦</span>' + esc(g.slice(1).join("")) + "</div>" +
          '<div class="row"><button class="btn sm pink" type="button"' + copyAttr(h.text, cv) + ">复制这句话</button></div>";
      }
      out.innerHTML = '<div class="code-res">' + html + "</div>";
    };
    setMode(cs.mode);
    $("#codeModes").onclick = function (e) {
      var b = e.target.closest("[data-mode]");
      if (!b) return;
      var id = b.getAttribute("data-mode");
      /* 框里还是上一种暗号的话就清掉，免得一切换又被认回去 */
      var t = inp.value.trim();
      if (inkFind(inp.value) || isMorse(t) || isBraille(t)) inp.value = "";
      setMode(id);
      draw();
      if (!inp.value) inp.focus();
    };
    inp.addEventListener("input", draw);
    cover.addEventListener("input", draw);
    $("#codeQuick").onclick = function (e) {
      var b = e.target.closest("[data-fill]");
      if (b) { inp.value = b.getAttribute("data-fill"); draw(); }
    };
    out.addEventListener("click", function (e) {
      var d = e.target.closest("[data-di]");
      if (d) { cs.di = d.getAttribute("data-di") === "1"; draw(); return; }
      if (e.target.closest("#codeClear")) { inp.value = ""; draw(); inp.focus(); return; }
      var p = e.target.closest("#mkPlay");
      if (!p) return;
      if (player) { stopMorse(); return; }
      p.textContent = "停下";
      p.classList.add("on");
      playMorse(p.getAttribute("data-code"), tick, function () {
        if (!p.isConnected) return;
        p.textContent = "敲给你听";
        p.classList.remove("on");
      });
    });
    draw();
  }

  /* ================= 像素大字 ================= */
  /* 用画布把字画大，再按格子取样：每一格墨够多就算「亮」。 */
  var PX_FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Noto Sans CJK SC","Source Han Sans SC",system-ui,sans-serif';
  var PX_STYLES = [["self", "字拼字"], ["block", "方块"], ["heart", "爱心"], ["dot", "点点"]];
  var PX_ROWS = { self: [10, 12, 15], block: [10, 12, 15], heart: [8, 10, 12], dot: [16, 24, 32] };
  var PX_INK = { block: "■", heart: "❤️" }, PX_BG = { self: "　", block: "□", heart: "🤍" };
  var pxs = { text: "好耶", style: "self", size: 1, dir: "v" };
  var pxCanvas = null;
  function pxShot(ctx, g, W, H, base) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillText(g, 10, base);
    var d = ctx.getImageData(0, 0, W, H).data, x0 = W, x1 = -1, y0 = H, y1 = -1;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        if (d[(y * W + x) * 4 + 3] > 60) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    return { g: g, d: d, x0: x0, x1: x1, y0: y0, y1: y1 };
  }
  function pxGlyphs(gs, rows) {
    var F = 100, W = 240, H = 160, base = 120;
    if (!pxCanvas) pxCanvas = document.createElement("canvas");
    pxCanvas.width = W;
    pxCanvas.height = H;
    var ctx = pxCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];
    ctx.font = "700 " + F + "px " + PX_FONT;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#000";
    /* 所有字共用一条上下边界（至少和「国」一样高），这样大小写、标点都在同一条基线上 */
    var ref = pxShot(ctx, "国", W, H, base);
    var shots = gs.map(function (g) { return g === " " ? null : pxShot(ctx, g, W, H, base); });
    var top = ref.y0, bot = ref.y1;
    shots.forEach(function (s) { if (s && s.x1 >= 0) { top = Math.min(top, s.y0); bot = Math.max(bot, s.y1); } });
    if (bot < top) { top = 20; bot = 140; }
    var scale = rows / (bot - top + 1);
    return gs.map(function (g, gi) {
      var s = shots[gi];
      if (!s || s.x1 < 0) {
        var bw = Math.max(2, Math.round(rows / 3)), blank = [];
        for (var r0 = 0; r0 < rows; r0++) blank.push(new Array(bw).fill(false));
        return { g: g, cols: bw, bits: blank, blank: true };
      }
      var cols = Math.max(1, Math.round((s.x1 - s.x0 + 1) * scale)), bits = [];
      for (var r = 0; r < rows; r++) {
        var row = [], ya = Math.floor(top + r / scale), yb = Math.min(H, Math.ceil(top + (r + 1) / scale));
        for (var c = 0; c < cols; c++) {
          var xa = Math.floor(s.x0 + c / scale), xb = Math.min(W, Math.ceil(s.x0 + (c + 1) / scale)), sum = 0, n = 0;
          for (var y = ya; y < yb; y++) for (var x = xa; x < xb; x++) { sum += s.d[(y * W + x) * 4 + 3]; n++; }
          row.push(n > 0 && sum / n > 255 * 0.34);
        }
        bits.push(row);
      }
      return { g: g, cols: cols, bits: bits };
    });
  }
  function pxGrid(glyphs, rows, dir) {
    var grid = [], r, c;
    if (dir === "h") {
      for (r = 0; r < rows; r++) grid.push([]);
      glyphs.forEach(function (gl, gi) {
        for (var r1 = 0; r1 < rows; r1++) {
          if (gi) grid[r1].push(-1);
          for (c = 0; c < gl.cols; c++) grid[r1].push(gl.bits[r1][c] ? gi : -1);
        }
      });
    } else {
      var W = Math.max.apply(null, glyphs.map(function (gl) { return gl.blank ? 0 : gl.cols; })) || rows;
      var empty = function () { return new Array(W).fill(-1); };
      glyphs.forEach(function (gl, gi) {
        if (gi) grid.push(empty());
        if (gl.blank) { grid.push(empty()); return; }
        var pad = Math.floor((W - gl.cols) / 2);
        for (var r2 = 0; r2 < rows; r2++) {
          var row = empty();
          for (c = 0; c < gl.cols; c++) if (gl.bits[r2][c]) row[pad + c] = gi;
          grid.push(row);
        }
      });
    }
    var lit = function (row) { return row.some(function (x) { return x >= 0; }); };
    while (grid.length && !lit(grid[0])) grid.shift();
    while (grid.length && !lit(grid[grid.length - 1])) grid.pop();
    return grid;
  }
  function pxBraille(grid) {
    var lines = [], on = function (r, c) { return !!grid[r] && grid[r][c] >= 0; };
    for (var r = 0; r < grid.length; r += 4) {
      var s = "";
      for (var c = 0; c < grid[0].length; c += 2) {
        s += String.fromCharCode(0x2800 + (on(r, c) ? 1 : 0) + (on(r + 1, c) ? 2 : 0) + (on(r + 2, c) ? 4 : 0) + (on(r, c + 1) ? 8 : 0) +
          (on(r + 1, c + 1) ? 16 : 0) + (on(r + 2, c + 1) ? 32 : 0) + (on(r + 3, c) ? 64 : 0) + (on(r + 3, c + 1) ? 128 : 0));
      }
      lines.push(s);
    }
    return lines.join("\n");
  }
  /* 英文和数字换成全角，才能和全角空格一样宽 */
  var fullwidth = function (g) { var c = g.charCodeAt(0); return g.length === 1 && c > 0x20 && c < 0x7F ? String.fromCharCode(c + 0xFEE0) : g; };
  function pxArt(text, style, rows, dir) {
    var gs = U.graphemes(text.replace(/\s+/g, " ").trim()).slice(0, 8);
    if (!gs.length) return "";
    var glyphs = pxGlyphs(gs, rows);
    if (!glyphs.length) return "";
    var grid = pxGrid(glyphs, rows, dir);
    if (!grid.length) return "";
    if (style === "dot") return pxBraille(grid);
    return grid.map(function (row) {
      var s = row.map(function (gi) { return gi < 0 ? PX_BG[style] : style === "self" ? fullwidth(glyphs[gi].g) : PX_INK[style]; }).join("");
      return style === "self" ? s.replace(/　+$/, "") : s;
    }).join("\n");
  }
  function renderPixel(v) {
    var seg = function (key, opts) {
      return '<div class="seg" role="group" data-px="' + key + '">' + opts.map(function (o) {
        return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (String(pxs[key]) === String(o[0])) + '">' + o[1] + "</button>";
      }).join("") + "</div>";
    };
    v.innerHTML = toolHead("pixel") +
      '<div class="panel stack">' +
        '<input class="field" id="pxIn" maxlength="8" autocomplete="off" placeholder="写一两个字" aria-label="要放大的字" value="' + esc(pxs.text) + '">' +
        '<div class="row" id="pxQuick">' + fillChips(["好耶", "爱你", "OK", "666", "生日快乐", "？", "哈"]) + "</div>" +
        '<div class="px-ctl" id="pxCtl">' +
          '<div class="px-opt"><span>画风</span>' + seg("style", PX_STYLES) + "</div>" +
          '<div class="px-opt"><span>大小</span>' + seg("size", [[0, "小"], [1, "中"], [2, "大"]]) + "</div>" +
          '<div class="px-opt"><span>方向</span>' + seg("dir", [["v", "竖着排"], ["h", "横着排"]]) + "</div>" +
        "</div>" +
      "</div>" +
      '<div class="px-stage" id="pxStage"><div class="px-bubble"><pre class="px-art" id="pxArt"></pre></div></div>' +
      '<div class="px-bar"><button class="btn pink" type="button" id="pxCopy" data-norec>复制</button><span class="px-fit" id="pxFit"></span></div>' +
      '<p class="tool-d">竖着排最稳：手机聊天框窄，横着放两三个字就会折行。字拼字和方块用的都是全角字符，大部分 App 里能对齐；发到群里之前，可以先发给自己看看。</p>';
    var inp = $("#pxIn"), art = $("#pxArt"), stage = $("#pxStage");
    var fit = function () {
      if (!art.isConnected) return;
      art.style.fontSize = "20px";
      var em = art.scrollWidth / 20, bubble = art.parentNode;
      var bs = getComputedStyle(bubble), pad = parseFloat(bs.paddingLeft) + parseFloat(bs.paddingRight) + 4;
      var avail = stage.clientWidth - parseFloat(getComputedStyle(stage).paddingLeft) * 2 - pad;
      art.style.fontSize = (em ? Math.max(4, Math.min(18, Math.floor(avail / em * 10) / 10)) : 16) + "px";
      var ok = em <= 14.5, f = $("#pxFit");
      f.className = "px-fit" + (ok ? "" : " warn");
      f.textContent = !em ? "" : ok ? "手机上一行放得下" : pxs.dir === "h" ? "有点宽，手机上会折行，试试竖着排" : "有点宽，手机上可能会折行，试试调小";
    };
    var draw = function () {
      var t = pxs.text.trim() || "好耶", st = pxs.style;
      var res = pxArt(t, st, PX_ROWS[st][pxs.size], pxs.dir);
      art.textContent = res;
      art.className = "px-art s-" + st;
      var cp = $("#pxCopy");
      cp.setAttribute("data-copy", res);
      cp.setAttribute("data-face", t);
      fit();
    };
    var timer = 0;
    inp.addEventListener("input", function () {
      pxs.text = inp.value;
      clearTimeout(timer);
      timer = later(draw, 90);
    });
    $("#pxQuick").onclick = function (e) {
      var b = e.target.closest("[data-fill]");
      if (b) { inp.value = pxs.text = b.getAttribute("data-fill"); draw(); }
    };
    $("#pxCtl").onclick = function (e) {
      var b = e.target.closest("[data-v]");
      if (!b) return;
      var key = b.parentNode.getAttribute("data-px"), val = b.getAttribute("data-v");
      pxs[key] = key === "size" ? +val : val;
      $$("button", b.parentNode).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      draw();
      K.haptic(5);
    };
    window.addEventListener("resize", fit);
    cleanups.push(function () { window.removeEventListener("resize", fit); });
    draw();
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
    var t = TOOLS[id];
    return '<div class="tool-h"><a class="back" href="#lab" aria-label="回到实验室">←</a><h2>' + esc(t.name) + "</h2></div>" +
      '<p class="tool-d">' + esc(t.desc) + "</p>";
  }
  function labMore(id) {
    var g = GROUPS.filter(function (x) { return x.ids.indexOf(id) >= 0; })[0];
    if (!g) return "";
    return '<nav class="lab-more" aria-label="同一组的其他工具"><span class="lab-more-h">「' + esc(g.name) + "」里还有</span>" +
      g.ids.filter(function (x) { return x !== id; }).map(function (x) {
        var t = TOOLS[x];
        return '<a class="t' + t.tint + '" href="#lab-' + x + '"><i aria-hidden="true">' + esc(t.ico) + "</i>" + esc(t.name) + "</a>";
      }).join("") + '<a class="all" href="#lab">全部工具</a></nav>';
  }
  function shortFace() {
    var t = "";
    for (var i = 0; i < 12; i++) {
      t = compose(randomSel({ eyes: 0, mouth: 0, frame: 0, cheek: 0, arms: 0, deco: 0 }));
      if (U.width(t, 2) <= 13) break;
    }
    return t;
  }
  function preview(id) {
    if (id === "face") return '<span id="pvFace">' + esc(shortFace()) + "</span>";
    if (id === "combo") return '<span class="mini"><span class="msg">|ω・)</span><span class="msg">|ω・)ﾉ 嗨</span><span class="msg">|彡ｻｯ</span></span>';
    if (id === "sign") return '<small class="pv-sign">＿人人人人＿\n＞　好耶　＜\n￣Y^Y^Y^Y￣</small>';
    if (id === "fx") return '<small class="pv-fx">我♡想♡下♡班\n我███班\n㊤㊥㊦ ᵒᵏ ✧</small>';
    if (id === "tone") return '<span class="mini left"><span class="msg">人家饿饿～</span><span class="msg">好饿喵～</span><span class="msg">饿！！！</span></span>';
    if (id === "code") return '<span class="pv-code">··· −−− ···\n⠓⠑⠇⠇⠕</span>';
    if (id === "pixel") return '<span class="pv-px">' + esc(pxArt("耶", "self", 10, "v")) + "</span>";
    if (id === "luck") return '<span style="font:44px/1 var(--display);color:var(--pink-ink)">大吉</span><small>(ﾉ≧∀≦)ﾉ</small>';
    if (id === "gacha") return '<span><span class="rar SSR" style="font-size:18px">SSR</span>\n<small>ヽ༼ ຈل͜ຈ༽ﾉ</small></span>';
    return "";
  }
  function renderHome(v) {
    var seen = K.store.get("lab", {});
    v.innerHTML = '<div class="page-h"><h2>实验室</h2><p>九个发出去会好玩的小工具，都是现做现复制。</p></div>' +
      GROUPS.map(function (g) {
        return '<section class="lab-sec"><div class="lab-sec-h"><h3>' + esc(g.name) + "</h3><p>" + esc(g.desc) + "</p></div>" +
          '<div class="lab-grid">' + g.ids.map(function (id) {
            var t = TOOLS[id], badge = NEW[id] && !seen[id] ? '<em class="lab-new">' + NEW[id] + "</em>" : "";
            return '<a class="lab-card t' + t.tint + '" href="#lab-' + id + '"><div class="lab-prev" aria-hidden="true">' + preview(id) + "</div>" +
              '<div class="lab-txt"><h3>' + esc(t.name) + badge + "</h3><p>" + esc(t.desc) + "</p></div></a>";
          }).join("") + "</div></section>";
      }).join("");
    every(function () {
      var el = $("#pvFace");
      if (!el || document.hidden) return;
      el.textContent = shortFace();
    }, 1600);
  }
  function render(v, sub) {
    stopAll();
    var map = { face: renderFace, combo: renderCombo, sign: renderSign, fx: renderFx, tone: renderTone, code: renderCode, pixel: renderPixel, luck: renderLuck, gacha: renderGacha };
    if (!map[sub]) { renderHome(v); return; }
    map[sub](v);
    v.insertAdjacentHTML("beforeend", labMore(sub));
    if (NEW[sub]) {
      var seen = K.store.get("lab", {});
      if (!seen[sub]) { seen[sub] = 1; K.store.set("lab", seen); }
    }
  }
  window.KMJ_LAB = {
    render: render, stop: stopAll,
    /* 给测试用的纯函数 */
    _t: { morseEncode: morseEncode, morseDecode: morseDecode, isMorse: isMorse, brailleEncode: brailleEncode, brailleDecode: brailleDecode, isBraille: isBraille, inkHide: inkHide, inkFind: inkFind, pxArt: pxArt, tones: TONES, seeded: seeded }
  };
  if (/^#lab/.test(location.hash) && K.route) K.route();
})(window.KMJ);
