/* 颜文字图鉴 · 页面脚本。列表本身是静态 HTML，这里只负责“增强”：
   点一下复制、双击收藏、长按看详情、搜索、目录、我的、实验室。 */
(function () {
  "use strict";

  var U = KMJU;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduceMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var finePointer = !!(window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches);
  var esc = function (s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  var pad = function (n, w) { n = String(n); while (n.length < w) n = "0" + n; return n; };
  var fmt = function (n) { return n.toLocaleString("en-US"); };

  /* ---------- 数据 ---------- */
  try { history.scrollRestoration = "manual"; } catch (e) {}
  var RAW = JSON.parse(document.getElementById("kmj-data").textContent);
  var groups = RAW.g.map(function (g, i) { return { i: i, id: g[0], name: g[1], desc: g[2], cats: g[3] }; });
  var cats = RAW.c.map(function (c, i) {
    return { i: i, id: c[0], name: c[1], face: c[2], desc: c[3], tags: c[4] ? c[4].split(" ") : [], g: c[5], items: c[6] };
  });
  var items = RAW.i.map(function (x, i) {
    return { i: i, t: x[0], tags: x[1] ? x[1].split(" ") : [], cats: x[2], lv: x[3] };
  });
  var WORDS = RAW.w;
  var byText = new Map();
  items.forEach(function (it) { byText.set(it.t, it); });
  var catById = {};
  cats.forEach(function (c) { catById[c.id] = c; });
  var tintOf = function (ci) { return cats[ci].g % 6; };
  var CLASSIC = catById.classic ? catById.classic.i : -1;
  var groupCats = function (id) { var g = groups.filter(function (x) { return x.id === id; })[0]; return g ? g.cats : []; };
  var partCats = groupCats("parts");
  var styleCats = groupCats("styles");

  /* ---------- 本机存储 ---------- */
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem("kmj2." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem("kmj2." + k, JSON.stringify(v)); } catch (e) {} }
  };
  var state = {
    fav: store.get("fav", []),
    recent: store.get("recent", []),
    seen: store.get("seen", []),
    made: store.get("made", []),
    set: Object.assign({ theme: "auto", size: "m", safe: false, haptic: true }, store.get("set", {}))
  };
  var seenSet = new Set(state.seen);

  function haptic(ms) {
    if (state.set.haptic && navigator.vibrate) { try { navigator.vibrate(ms || 8); } catch (e) {} }
  }

  /* ---------- 复制 ---------- */
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;width:2px;height:2px;opacity:0;";
    document.body.appendChild(ta);
    ta.select();
    try { ta.setSelectionRange(0, text.length); } catch (e) {}
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    return ok;
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext !== false) {
      try {
        navigator.clipboard.writeText(text).catch(function () { if (!legacyCopy(text)) manualCopy(text); });
        return true;
      } catch (e) {}
    }
    if (legacyCopy(text)) return true;
    manualCopy(text);
    return false;
  }
  function manualCopy(text) {
    openSheet("手动复制一下",
      '<p class="ana-sum">这个浏览器不让网页直接写剪贴板。下面的文字已经选好了，长按或按 Ctrl+C 复制。</p>' +
      '<textarea class="field" id="manualTa" rows="4" readonly>' + esc(text) + "</textarea>");
    var ta = $("#manualTa");
    if (ta) { ta.focus(); ta.select(); }
  }

  /* ---------- 提示条 ---------- */
  var toastEl = $("#toast"), toastTimer = 0;
  function toast(msg, face, icon) {
    toastEl.innerHTML = '<span class="toast-ic">' + esc(icon || "✓") + '</span><span class="toast-t">' + esc(msg) + "</span>" +
      (face ? '<span class="toast-k">' + esc(String(face).split("\n")[0]) + "</span>" : "");
    toastEl.classList.remove("on");
    void toastEl.offsetWidth;
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("on"); }, 1800);
  }

  /* ---------- 吉祥物 ω 酱 ---------- */
  var FACES = {
    idle: "(・ω・)", l: "(・ω・ )", r: "( ・ω・)", blink: "(－ω－)", happy: "(≧ω≦)", love: "(♡ω♡)",
    sweat: "(・ω・;)", point: "(・ω・)σ", sad: "(；ω；)", angry: "(｀ω´)", cat: "(=・ω・=)",
    sleep: "(－ω－)zZ", wow: "Σ(・ω・ﾉ)ﾉ", ok: "(・ω・)b", flip: "(╯・ω・)╯︵┻━┻", poke1: "(・ω・`)",
    poke2: "(｀・ω・´)", poke3: "(╬・ω・)", dizzy: "(@ω@)", music: "♪(・ω・)♪", eat: "(・ω・)つ旦",
    wake: "(・ω・)!", wave: "(・ω・)ﾉ"
  };
  var mascotEl = $("#mascot"), mascotFace = $("#mascotFace");
  var mascot = { mood: "", look: "", timer: 0 };
  function drawMascot() {
    if (!mascotFace) return;
    var f = FACES[mascot.mood] || FACES[mascot.look] || FACES.idle;
    if (mascotFace.textContent !== f) mascotFace.textContent = f;
  }
  function setMood(name, ms) {
    mascot.mood = name || "";
    clearTimeout(mascot.timer);
    if (ms) mascot.timer = setTimeout(function () { mascot.mood = ""; drawMascot(); }, ms);
    drawMascot();
    if (mascotEl && name && !reduceMotion) {
      mascotEl.classList.remove("bump");
      void mascotEl.offsetWidth;
      mascotEl.classList.add("bump");
    }
  }
  var MOOD_TAGS = [
    ["sad", ["哭", "大哭", "难过", "委屈", "感动", "emo"]], ["angry", ["生气", "暴怒", "不爽"]],
    ["flip", ["掀桌"]], ["cat", ["猫", "喵"]], ["sleep", ["困", "睡觉", "晚安", "睡"]],
    ["love", ["喜欢", "爱心", "亲亲", "抱抱", "贴贴"]], ["wow", ["惊讶", "震惊", "害怕"]],
    ["music", ["唱歌", "跳舞", "音乐"]], ["eat", ["吃", "好吃", "喝茶", "干饭"]],
    ["happy", ["开心", "大笑", "好耶", "欢呼", "笑死"]], ["wave", ["打招呼", "再见", "拜拜"]]
  ];
  function moodForTags(tags) {
    for (var m = 0; m < MOOD_TAGS.length; m++) {
      for (var j = 0; j < tags.length; j++) if (MOOD_TAGS[m][1].indexOf(tags[j]) >= 0) return MOOD_TAGS[m][0];
    }
    return "";
  }

  var lookRaf = 0;
  if (mascotEl && finePointer) {
    window.addEventListener("pointermove", function (e) {
      if (lookRaf) return;
      lookRaf = requestAnimationFrame(function () {
        lookRaf = 0;
        var r = mascotEl.getBoundingClientRect();
        if (r.bottom < 0) return;
        var dx = e.clientX - (r.left + r.width / 2);
        var look = dx < -90 ? "l" : dx > 90 ? "r" : "";
        if (look !== mascot.look) { mascot.look = look; drawMascot(); }
      });
    }, { passive: true });
  }
  (function blink() {
    setTimeout(function () {
      if (!mascot.mood && !document.hidden) {
        var keep = mascot.look;
        mascot.look = "blink"; drawMascot();
        setTimeout(function () { if (mascot.look === "blink") mascot.look = keep; drawMascot(); }, 150);
      }
      blink();
    }, 2600 + Math.random() * 3600);
  })();

  var idleAt = Date.now();
  function wake() {
    if (mascot.mood === "sleep") setMood("wake", 900);
    idleAt = Date.now();
  }
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, wake, { passive: true });
  });
  setInterval(function () {
    if (!mascot.mood && Date.now() - idleAt > 45000 && !document.hidden) setMood("sleep");
  }, 5000);

  /* 气泡里轮流说的小提示 */
  var bubbleEl = $("#bubble");
  var dayKey = (function () { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); })();
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  var todayItem = (function () {
    var pool = items.filter(function (it) { return it.lv < 2 && !it.t.includes("\n") && it.cats.every(function (c) { return partCats.indexOf(c) < 0; }); });
    return pool[hash("today" + dayKey) % pool.length];
  })();
  var TIPS = [
    "点一下就复制，直接去聊天框粘贴",
    "双击一张脸，收进「我的」",
    finePointer ? "右键一张脸，看看它是用哪几种文字拼的" : "长按一张脸，看看它是用哪几种文字拼的",
    "搜「笑死」「emo」「摸鱼」这种说法也能找到",
    "整句话丢进搜索框也行，比如「今天好累想睡觉」",
    "实验室里能捏脸、连发、举牌、抽签",
    "TODAY",
    finePointer ? "按 / 键直接开始搜" : "右上角的骰子会随机掉一张脸"
  ];
  var tipAt = 0;
  function showTip(n) {
    if (!bubbleEl) return;
    tipAt = (n == null ? tipAt + 1 : n) % TIPS.length;
    var tip = TIPS[tipAt];
    bubbleEl.innerHTML = tip === "TODAY"
      ? '今天的幸运脸：<button type="button" data-copy="' + esc(todayItem.t) + '">' + esc(todayItem.t) + "</button>"
      : esc(tip);
    if (!reduceMotion) { bubbleEl.classList.remove("swap"); void bubbleEl.offsetWidth; bubbleEl.classList.add("swap"); }
  }
  setInterval(function () { if (!document.hidden && current === "lib") showTip(); }, 7000);

  var pokes = [], POKE_LINES = ["干嘛～", "再戳就生气了", "别戳了！", "好吧，给你讲个冷知识：ω 是希腊字母"];
  if (mascotEl) mascotEl.addEventListener("click", function () {
    var now = Date.now();
    pokes = pokes.filter(function (t) { return now - t < 2500; });
    pokes.push(now);
    var n = pokes.length;
    setMood(n >= 3 ? "poke3" : n === 2 ? "poke2" : "poke1", 1400);
    haptic(10);
    if (n >= 2) bubbleEl.textContent = POKE_LINES[Math.min(n - 2, POKE_LINES.length - 1)];
    else showTip();
  });

  /* ---------- 格子上的标记 ---------- */
  function tilesOf(text) {
    var it = byText.get(text);
    return it ? $$('.k[data-i="' + it.i + '"]') : [];
  }
  function markText(text, cls, on) {
    tilesOf(text).forEach(function (k) { k.classList.toggle(cls, on); });
  }
  (function markAll() {
    var fav = new Set(state.fav);
    $$(".k[data-i]").forEach(function (k) {
      var t = items[+k.dataset.i].t;
      if (fav.has(t)) k.classList.add("fav");
      if (seenSet.has(t)) k.classList.add("used");
    });
  })();

  function recordUse(text) {
    var r = state.recent, rec = null;
    for (var j = 0; j < r.length; j++) if (r[j].t === text) { rec = r.splice(j, 1)[0]; break; }
    if (rec) { rec.n++; rec.at = Date.now(); } else rec = { t: text, n: 1, at: Date.now() };
    r.unshift(rec);
    if (r.length > 120) r.length = 120;
    store.set("recent", r);
    if (byText.has(text) && !seenSet.has(text)) {
      seenSet.add(text);
      state.seen.push(text);
      store.set("seen", state.seen);
      markText(text, "used", true);
    }
  }

  function isFav(t) { return state.fav.indexOf(t) >= 0; }
  function setFav(t, on) {
    var j = state.fav.indexOf(t);
    if (on && j < 0) state.fav.unshift(t);
    else if (!on && j >= 0) state.fav.splice(j, 1);
    else return false;
    store.set("fav", state.fav);
    markText(t, "fav", on);
    updateBadge();
    if (current === "me") renderMe();
    return true;
  }
  function updateBadge() {
    $$(".tab-badge").forEach(function (b) {
      b.hidden = !state.fav.length;
      b.textContent = state.fav.length > 99 ? "99+" : state.fav.length;
    });
  }

  /* ---------- 动效小件 ---------- */
  function stampAt(k) {
    if (reduceMotion || !k) return;
    k.classList.remove("pop");
    void k.offsetWidth;
    k.classList.add("pop");
    var r = k.getBoundingClientRect();
    var s = document.createElement("span");
    s.className = "stamp";
    s.textContent = "已复制";
    s.style.left = (r.left + r.width / 2) + "px";
    s.style.top = (r.top + r.height / 2) + "px";
    s.style.position = "fixed";
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 1000);
  }
  function heartAt(x, y) {
    if (reduceMotion) return;
    var h = document.createElement("span");
    h.className = "heart";
    h.textContent = "♥";
    h.style.left = x + "px";
    h.style.top = y + "px";
    document.body.appendChild(h);
    setTimeout(function () { h.remove(); }, 950);
  }
  function meTarget() {
    var list = $$('.tab[data-tab="me"], .stab[data-tab="me"]');
    for (var j = 0; j < list.length; j++) { var r = list[j].getBoundingClientRect(); if (r.width) return list[j]; }
    return null;
  }
  function flyTo(x, y, text) {
    var target = meTarget();
    if (!target || reduceMotion || !document.body.animate) return;
    var r = target.getBoundingClientRect();
    var tx = r.left + r.width / 2 - x, ty = r.top + r.height / 2 - y;
    var f = document.createElement("span");
    f.className = "fly";
    f.textContent = text;
    f.style.left = x + "px";
    f.style.top = y + "px";
    document.body.appendChild(f);
    var anim = f.animate([
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
      { transform: "translate(calc(-50% + " + tx * 0.45 + "px), calc(-50% + " + (ty * 0.45 - 90) + "px)) scale(1.1)", opacity: 1, offset: 0.45 },
      { transform: "translate(calc(-50% + " + tx + "px), calc(-50% + " + ty + "px)) scale(.4)", opacity: 0.3 }
    ], { duration: 720, easing: "cubic-bezier(.4,0,.6,1)" });
    anim.onfinish = function () {
      f.remove();
      target.classList.remove("boing");
      void target.offsetWidth;
      target.classList.add("boing");
    };
  }

  /* ---------- 点、双击、长按 ---------- */
  function tileText(k) {
    if (k.dataset.i != null) return items[+k.dataset.i].t;
    return k.dataset.t || k.textContent;
  }
  /* opt.norec：实验室里做出来的句子、电码不记进「最近用过」；opt.face：提示条里显示的字 */
  function copyFrom(text, k, silent, opt) {
    copyText(text);
    if (!(opt && opt.norec)) recordUse(text);
    if (k) stampAt(k);
    if (!silent) toast("已复制", opt && opt.face ? opt.face : text);
    var it = byText.get(text);
    setMood(it ? moodForTags(it.tags) || "happy" : "happy", 1300);
    haptic(8);
  }
  function favFrom(text, x, y) {
    var added = setFav(text, true);
    heartAt(x, y);
    if (added) {
      toast("收进「我的」了", text, "♥");
      flyTo(x, y, "♥");
      setMood("love", 1400);
    } else {
      toast("已经在收藏里啦", text, "♥");
    }
    haptic(15);
  }

  var press = null, suppress = false, lastTap = { k: null, t: 0 };
  function cancelPress() { if (press) { clearTimeout(press.timer); press = null; } }
  document.addEventListener("pointerdown", function (e) {
    suppress = false;
    var k = e.target.closest(".k");
    if (!k || e.button > 0) return;
    cancelPress();
    press = {
      k: k, x: e.clientX, y: e.clientY,
      timer: setTimeout(function () {
        press = null;
        suppress = true;
        haptic(14);
        openDetail(tileText(k));
      }, 480)
    };
  }, { passive: true });
  document.addEventListener("pointermove", function (e) {
    if (press && (Math.abs(e.clientX - press.x) > 9 || Math.abs(e.clientY - press.y) > 9)) cancelPress();
  }, { passive: true });
  document.addEventListener("pointerup", cancelPress, { passive: true });
  document.addEventListener("pointercancel", cancelPress, { passive: true });
  window.addEventListener("scroll", cancelPress, { passive: true });
  document.addEventListener("contextmenu", function (e) {
    var k = e.target.closest(".k");
    if (!k) return;
    e.preventDefault();
    cancelPress();
    if (!sheetOpen || k.closest(".sheet")) openDetail(tileText(k));
  });
  document.addEventListener("click", function (e) {
    var cp = e.target.closest("[data-copy]");
    if (cp) {
      e.preventDefault();
      copyFrom(cp.getAttribute("data-copy"), cp, false, { norec: cp.hasAttribute("data-norec"), face: cp.getAttribute("data-face") });
      return;
    }
    var k = e.target.closest(".k");
    if (!k) return;
    if (suppress) { suppress = false; e.preventDefault(); return; }
    var text = tileText(k), now = Date.now();
    if (lastTap.k === k && now - lastTap.t < 380) {
      lastTap.k = null;
      favFrom(text, e.clientX || 0, e.clientY || 0);
      return;
    }
    lastTap = { k: k, t: now };
    copyFrom(text, k);
  });
  document.addEventListener("keydown", function (e) {
    var k = e.target.closest && e.target.closest(".k");
    if (k) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); copyFrom(tileText(k), k); }
      else if (e.key === "i" || e.key === "I") { e.preventDefault(); openDetail(tileText(k)); }
      else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        var r = k.getBoundingClientRect(), t = tileText(k);
        if (isFav(t)) { setFav(t, false); toast("取消收藏", t, "♡"); } else favFrom(t, r.left + r.width / 2, r.top + r.height / 2);
      }
      return;
    }
    if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && current === "lib" && !sheetOpen) {
      e.preventDefault();
      qEl.focus();
    }
    if (e.key === "Escape") {
      if (!stageEl.hidden) closeStage();
      else if (sheetOpen) closeSheet();
      else if (document.activeElement === qEl && qEl.value) { qEl.value = ""; onQuery(); }
    }
  });
  if (finePointer) {
    document.addEventListener("mouseover", function (e) {
      var k = e.target.closest && e.target.closest(".k[data-i]");
      if (k && !k.title) {
        var it = items[+k.dataset.i];
        k.title = (it.tags.length ? it.tags.join(" · ") + "\n" : "") + "点一下复制 · 双击收藏 · 右键看详情";
      }
    });
  }

  /* ---------- 弹出层 ---------- */
  var sheetEl = $("#sheet"), scrimEl = $("#scrim"), sheetBody = $("#sheetBody"), sheetTitle = $("#sheetTitle");
  var sheetOpen = false, sheetTimer = 0, lastFocus = null, sheetPushed = false;
  var inFrame = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  function openSheet(title, html, cls) {
    clearTimeout(sheetTimer);
    if (!sheetOpen) lastFocus = document.activeElement;
    sheetTitle.innerHTML = title;
    sheetBody.innerHTML = html;
    sheetBody.scrollTop = 0;
    sheetEl.className = "sheet" + (cls ? " " + cls : "");
    sheetEl.hidden = false;
    scrimEl.hidden = false;
    void sheetEl.offsetWidth;
    sheetEl.classList.add("on");
    scrimEl.classList.add("on");
    if (!sheetOpen) {
      sheetOpen = true;
      document.body.style.overflow = "hidden";
      if (!inFrame && !sheetPushed) { try { history.pushState({ sheet: 1 }, ""); sheetPushed = true; } catch (e) {} }
    }
    setTimeout(function () { try { $("#sheetX").focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function closeSheet(fromPop) {
    if (!sheetOpen) return;
    if (!fromPop && sheetPushed) { sheetPushed = false; try { history.back(); return; } catch (e) {} }
    sheetOpen = false;
    sheetPushed = false;
    sheetEl.classList.remove("on");
    scrimEl.classList.remove("on");
    sheetEl.style.transform = "";
    document.body.style.overflow = "";
    sheetTimer = setTimeout(function () { sheetEl.hidden = true; scrimEl.hidden = true; sheetBody.innerHTML = ""; }, 400);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }
  window.addEventListener("popstate", function () { if (sheetOpen) { sheetPushed = false; closeSheet(true); } });
  scrimEl.addEventListener("click", function () { closeSheet(); });
  $("#sheetX").addEventListener("click", function () { closeSheet(); });
  (function dragToClose() {
    var y0 = 0, dy = 0, dragging = false;
    function start(e) {
      if (window.innerWidth >= 760) return;
      if (!e.target.closest(".sheet-grip, .sheet-head")) return;
      dragging = true; y0 = e.touches[0].clientY; dy = 0; sheetEl.classList.add("drag");
    }
    function move(e) {
      if (!dragging) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      sheetEl.style.transform = "translateY(" + dy + "px)";
    }
    function end() {
      if (!dragging) return;
      dragging = false;
      sheetEl.classList.remove("drag");
      sheetEl.style.transform = "";
      if (dy > 90) closeSheet();
    }
    sheetEl.addEventListener("touchstart", start, { passive: true });
    sheetEl.addEventListener("touchmove", move, { passive: true });
    sheetEl.addEventListener("touchend", end);
    sheetEl.addEventListener("touchcancel", end);
  })();

  /* 把一段文字缩放到装得下 */
  function fitText(el, maxW, maxH, maxFs) {
    el.style.fontSize = "100px";
    var w = el.scrollWidth || 1, h = el.scrollHeight || 1;
    var fs = Math.min(maxFs, 100 * maxW / w, 100 * maxH / h);
    el.style.fontSize = Math.max(12, Math.floor(fs)) + "px";
  }

  /* ---------- 详情：标本卡 + 拆解 ---------- */
  var ICONS = {
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    mirror: '<svg viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M8 7 3 12l5 5V7zM16 7l5 5-5 5V7z"/></svg>',
    show: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
  };
  function anatomy(text) {
    var gs = U.graphemes(text.replace(/\n/g, "")).filter(function (g) { return g.trim(); });
    var scripts = [], cells = [], max = 36;
    gs.forEach(function (g, n) {
      var cps = Array.from(g), base = U.info(cps[0]), marks = cps.slice(1).map(U.info);
      [base].concat(marks).forEach(function (inf) { if (inf.script && scripts.indexOf(inf.script) < 0) scripts.push(inf.script); });
      if (n >= max) return;
      var name = base.name || base.block;
      var markTxt = marks.length ? "＋" + marks.map(function (m) { return m.name || m.block; }).join("＋") : "";
      var lv = Math.max.apply(null, [base.level].concat(marks.map(function (m) { return m.level; })));
      cells.push('<div class="ana-c' + (lv === 2 ? " r2" : "") + '"><div class="ana-g">' + esc(g) + "</div>" +
        '<div class="ana-n">' + esc(name) + (markTxt ? "<br>" + esc(markTxt) : "") + "</div>" +
        '<div class="ana-u">' + [base].concat(marks).map(function (m) { return m.code; }).join(" ") + "</div></div>");
    });
    var sum = scripts.length
      ? "这张脸用了 <b>" + scripts.length + "</b> 种文字：" + scripts.map(esc).join("、") + "，剩下的是符号。"
      : "这张脸全是符号，没用到任何一种文字。";
    if (gs.length > max) sum += "（太长了，只拆前 " + max + " 个）";
    return '<p class="ana-sum">' + sum + '</p><div class="ana">' + cells.join("") + "</div>";
  }
  function similar(it, n) {
    if (!it) return [];
    var scored = [];
    items.forEach(function (o) {
      if (o === it) return;
      var s = 0;
      o.tags.forEach(function (t) { if (it.tags.indexOf(t) >= 0) s += 2; });
      o.cats.forEach(function (c) { if (it.cats.indexOf(c) >= 0) s += 1; });
      if (s > 1 && !(state.set.safe && o.lv === 2)) scored.push([s + Math.random() * 0.8, o]);
    });
    scored.sort(function (a, b) { return b[0] - a[0]; });
    return scored.slice(0, n).map(function (x) { return x[1]; });
  }
  function tileHTML(itOrText, extra) {
    var it = typeof itOrText === "string" ? byText.get(itOrText) : itOrText;
    var text = it ? it.t : itOrText;
    var cls = "k" + (text.indexOf("\n") >= 0 ? " ml" : "") +
      (isFav(text) ? " fav" : "") + (seenSet.has(text) ? " used" : "") + (extra ? " " + extra : "");
    return it
      ? '<div class="' + cls + '" role="button" tabindex="0" data-i="' + it.i + '">' + esc(text) + "</div>"
      : '<div class="' + cls + '" role="button" tabindex="0" data-t="' + esc(text) + '">' + esc(text) + "</div>";
  }

  function openDetail(text, opts) {
    opts = opts || {};
    var it = byText.get(text);
    var ci = it ? it.cats.filter(function (c) { return c !== CLASSIC; })[0] : -1;
    if (it && ci == null) ci = it.cats[0];
    var c = ci >= 0 ? cats[ci] : null;
    var shown = text, mirrored = false;
    var title = (c ? '<small>No.' + pad(it.i + 1, 4) + " · " + esc(c.name) + "</small>" : "<small>自己拼的</small>") +
      esc(it && it.tags.length ? it.tags.slice(0, 3).join(" · ") : c ? c.name : "一张新脸");
    var lv = it ? it.lv : U.level(text);
    var sim = similar(it, 12);
    var tags = it ? it.tags.concat(c && it.tags.indexOf(c.name) < 0 ? [c.name] : []) : [];
    var html =
      '<div class="spec ' + (c ? "t" + tintOf(ci) : "t0") + '">' +
        '<span class="spec-no">' + (it ? "No." + pad(it.i + 1, 4) : "DIY") + "</span>" +
        (lv === 2 ? '<span class="spec-lv">含少见字符</span>' : "") +
        '<div class="spec-face' + (text.indexOf("\n") >= 0 ? " ml" : "") + '" id="specFace"></div>' +
      "</div>" +
      '<div class="acts">' +
        '<button class="act primary" type="button" data-act="copy">' + ICONS.copy + "复制</button>" +
        '<button class="act' + (isFav(text) ? " on" : "") + '" type="button" data-act="fav">' + ICONS.heart + (isFav(text) ? "已收藏" : "收藏") + "</button>" +
        '<button class="act" type="button" data-act="mirror">' + ICONS.mirror + "照镜子</button>" +
        '<button class="act" type="button" data-act="show">' + ICONS.show + "举起来</button>" +
      "</div>" +
      (opts.random ? '<button class="btn yellow" type="button" data-act="again">再来一张 ✦</button>' : "") +
      (tags.length ? '<div class="tagrow">' + tags.map(function (t) { return '<button class="tagchip" type="button" data-tag="' + esc(t) + '">#' + esc(t) + "</button>"; }).join("") + "</div>" : "") +
      (lv >= 1 ? '<p class="ana-sum">' + (lv === 2 ? "里面有比较少见的字符，对方的手机或电脑缺字体时会显示成方框 □。" : "大部分新手机都能正常显示；很老的设备上个别符号可能是方框。") + "</p>" : "") +
      '<div><h3 class="sec-t">拆解 <small>每个符号是从哪种文字里借来的</small></h3>' + anatomy(text) + "</div>" +
      (sim.length ? '<div><h3 class="sec-t">相似的 <small>点一下复制</small></h3><div class="grid">' + sim.map(function (o) { return tileHTML(o); }).join("") + "</div></div>" : "");
    openSheet(title, html);
    var face = $("#specFace");
    function paint() {
      face.textContent = shown;
      var w = sheetBody.clientWidth - 72;
      fitText(face, w, 150, 64);
    }
    paint();
    sheetBody.onclick = function (e) {
      var b = e.target.closest("[data-act], [data-tag]");
      if (!b) return;
      var act = b.getAttribute("data-act");
      if (b.hasAttribute("data-tag")) {
        var tag = b.getAttribute("data-tag");
        closeSheet();
        setTimeout(function () { goLib(); qEl.value = tag; onQuery(true); }, 30);
      } else if (act === "copy") {
        copyFrom(shown, null);
        setTimeout(function () { closeSheet(); }, 280);
      } else if (act === "fav") {
        var on = !isFav(text);
        setFav(text, on);
        b.classList.toggle("on", on);
        b.lastChild.textContent = on ? "已收藏" : "收藏";
        if (on) { var r = b.getBoundingClientRect(); heartAt(r.left + r.width / 2, r.top + 10); setMood("love", 1200); }
        toast(on ? "收进「我的」了" : "取消收藏", text, on ? "♥" : "♡");
      } else if (act === "mirror") {
        mirrored = !mirrored;
        shown = mirrored ? U.mirror(text) : text;
        b.lastChild.textContent = mirrored ? "换回来" : "照镜子";
        paint();
        if (!reduceMotion) { face.style.animation = "none"; void face.offsetWidth; face.style.animation = "pop .4s"; }
      } else if (act === "show") {
        openStage(shown);
      } else if (act === "again") {
        randomFace();
      }
    };
  }

  /* ---------- 举起来 ---------- */
  var stageEl = $("#stage"), stageFace = $("#stageFace"), wakeLock = null;
  function fitStage() {
    var W = window.innerWidth, H = window.innerHeight;
    stageFace.classList.remove("rot");
    stageFace.style.fontSize = "100px";
    var wide = stageFace.scrollWidth / Math.max(1, stageFace.scrollHeight) > 2.2;
    /* 竖着拿手机时，宽宽的脸横过来放，占满长边 */
    if (H > W * 1.25 && wide) {
      stageFace.classList.add("rot");
      fitText(stageFace, H * 0.86, W * 0.7, 260);
    } else {
      fitText(stageFace, W * 0.9, H * 0.66, 240);
    }
  }
  function openStage(text) {
    stageFace.textContent = text;
    stageEl.dataset.c = "0";
    stageEl.hidden = false;
    fitStage();
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (l) { wakeLock = l; }, function () {}); } catch (e) {}
  }
  function closeStage() {
    stageEl.hidden = true;
    if (wakeLock) { try { wakeLock.release(); } catch (e) {} wakeLock = null; }
  }
  stageEl.addEventListener("click", function (e) {
    if (e.target.closest("#stageX")) { closeStage(); return; }
    stageEl.dataset.c = String((+stageEl.dataset.c + 1) % 5);
  });
  window.addEventListener("resize", function () {
    if (!stageEl.hidden) fitStage();
  });

  /* ---------- 随机 ---------- */
  function pickRandom(filter) {
    var pool = items.filter(function (it) {
      if (state.set.safe && it.lv === 2) return false;
      if (it.cats.every(function (c) { return partCats.indexOf(c) >= 0; })) return false;
      return filter ? filter(it) : true;
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function randomFace() {
    var it = pickRandom();
    var d = $("#dice");
    if (d && !reduceMotion) { d.classList.remove("spin"); void d.offsetWidth; d.classList.add("spin"); }
    setMood("wow", 900);
    openDetail(it.t, { random: true });
  }
  $("#dice").addEventListener("click", randomFace);

  /* ---------- 搜索 ---------- */
  var qEl = $("#q"), qClear = $("#qClear"), resultsEl = $("#results"), libEl = $("#lib");
  function norm(s) {
    s = String(s).toLowerCase();
    try { s = s.normalize("NFKC"); } catch (e) {}
    return s;
  }
  var IDX = items.map(function (it) {
    var t = [], c = [];
    var add = function (a, x) { x = norm(x); if (x && a.indexOf(x) < 0) a.push(x); };
    it.tags.forEach(function (x) { add(t, x); });
    it.cats.forEach(function (ci) { add(c, cats[ci].name); cats[ci].tags.forEach(function (x) { add(c, x); }); });
    var prior = 0;
    it.cats.forEach(function (ci) {
      var list = cats[ci].items, p = 1 - list.indexOf(it.i) / list.length;
      if (p > prior) prior = p;
    });
    if (it.cats.indexOf(CLASSIC) >= 0) prior += 1.5;
    if (it.lv === 2) prior -= 0.6;
    if (it.cats.every(function (ci) { return partCats.indexOf(ci) >= 0; })) prior -= 0.8;
    if (it.cats.every(function (ci) { return styleCats.indexOf(ci) >= 0 || partCats.indexOf(ci) >= 0; })) prior -= 0.5;
    return { t: t, c: c, norm: norm(it.t), prior: prior };
  });
  var isCJK = function (s) { return /[㐀-鿿]/.test(s); };
  var lookInFace = function (term) { return /[^㐀-鿿a-z0-9\s]/.test(term) || /^[a-z0-9]{2,}$/.test(term); };

  /* 整句话里认出关键词：最长匹配 */
  var SINGLE = "哭笑猫狗熊兔鸟猪鱼饿困累吃喝睡气怒怕惊爱亲抱跑打喵汪雨雪花星月心酷帅萌丧烦冲嘘哼啥耶赞晕跪戳躲茶";
  var DICT = new Map();
  function addDict(w) {
    w = norm(w);
    if (!w || (w.length < 2 && SINGLE.indexOf(w) < 0) || !isCJK(w)) return;
    var a = DICT.get(w[0]);
    if (!a) DICT.set(w[0], a = []);
    if (a.indexOf(w) < 0) a.push(w);
  }
  items.forEach(function (it) { it.tags.forEach(addDict); });
  cats.forEach(function (c) { addDict(c.name); c.tags.forEach(addDict); });
  Object.keys(WORDS).forEach(addDict);
  DICT.forEach(function (a) { a.sort(function (x, y) { return y.length - x.length; }); });
  function extract(s) {
    var out = [];
    for (var i = 0; i < s.length;) {
      var a = DICT.get(s[i]), hit = null;
      if (a) for (var j = 0; j < a.length; j++) if (s.substr(i, a[j].length) === a[j]) { hit = a[j]; break; }
      if (hit) { if (out.indexOf(hit) < 0) out.push(hit); i += hit.length; } else i++;
    }
    return out;
  }

  function scoreTerm(ix, term) {
    var best = 0, j, tg;
    for (j = 0; j < ix.t.length; j++) {
      tg = ix.t[j];
      if (tg === term) return 10;
      var at = tg.indexOf(term);
      if (at === 0) best = Math.max(best, 7);
      else if (at > 0 && term.length >= 2) best = Math.max(best, 5);
      else if (tg.length >= 2 && isCJK(tg) && term.indexOf(tg) >= 0) best = Math.max(best, 4);
    }
    for (j = 0; j < ix.c.length; j++) {
      tg = ix.c[j];
      if (tg === term) { best = Math.max(best, 6); continue; }
      var at2 = tg.indexOf(term);
      if (at2 === 0) best = Math.max(best, 4);
      else if (at2 > 0 && term.length >= 2) best = Math.max(best, 3);
      else if (tg.length >= 2 && isCJK(tg) && term.indexOf(tg) >= 0) best = Math.max(best, 3);
    }
    if (lookInFace(term) && ix.norm.indexOf(term) >= 0) best = Math.max(best, term.length > 1 ? 8 : 6);
    else if (best && isCJK(term) && ix.norm.indexOf(term) >= 0) best += 2;
    return best;
  }
  function score(plan, multi) {
    var out = [];
    for (var i = 0; i < IDX.length; i++) {
      if (state.set.safe && items[i].lv === 2) continue;
      var ix = IDX[i], total = 0, ok = true;
      for (var p = 0; p < plan.length; p++) {
        var alts = plan[p], best = 0, sum = 0;
        for (var a = 0; a < alts.length; a++) {
          var s = scoreTerm(ix, alts[a].t) * alts[a].w;
          if (s > 0) { sum += s; if (s > best) best = s; }
        }
        if (!best) { ok = false; break; }
        total += multi ? best + (sum - best) * 0.35 : best;
      }
      if (ok) out.push({ i: i, s: total + ix.prior });
    }
    out.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    return out;
  }
  function expand(term, w) {
    var alts = [{ t: term, w: w }];
    var ex = WORDS[term];
    if (ex) ex.split(" ").forEach(function (x) { alts.push({ t: norm(x), w: w * 0.92 }); });
    return alts;
  }
  function search(q) {
    var nq = norm(q).trim().replace(/\s+/g, " ");
    if (!nq) return null;
    var tokens = nq.split(" ");
    var aliases = [];
    tokens.forEach(function (t) { if (WORDS[t]) aliases.push([t, WORDS[t]]); });
    var list = score(tokens.map(function (t) { return expand(t, 1); }), false);
    var heard = null;
    var joined = nq.replace(/\s+/g, "");
    var known = tokens.every(function (t) { return WORDS[t] || DICT.has(t[0]) && DICT.get(t[0]).indexOf(t) >= 0; });
    var sentence = isCJK(joined) && joined.length >= 4 && !known;
    if (!list.length || sentence) {
      var words = extract(joined);
      if (words.length && !(words.length === 1 && words[0] === joined)) {
        var alts = [];
        words.forEach(function (w) { expand(w, 0.85).forEach(function (a) { alts.push(a); }); });
        var more = score([alts], true);
        if (more.length) {
          /* 一句话：先放同时对上好几个词的，再接上原来直接搜到的 */
          var have = new Set(more.map(function (r) { return r.i; }));
          list = more.concat(list.filter(function (r) { return !have.has(r.i); }));
          heard = words;
        }
      }
    }
    return { q: q, list: list, heard: heard, aliases: aliases, tokens: tokens };
  }

  var SUGGEST = ["开心", "哭", "猫", "笑死", "晚安", "谢谢", "加油", "掀桌", "摸鱼", "抱抱", "emo", "ω", "生日快乐", "今天好累想睡觉"];
  var shownCount = 0, lastResult = null;
  function renderResults(res, more) {
    if (!more) shownCount = 0;
    var list = res.list;
    var step = 180, upto = Math.min(list.length, shownCount + step);
    var html = "";
    if (!more) {
      html += '<div class="res-h"><h2>搜「<em>' + esc(res.q.trim()) + "</em>」</h2>" +
        '<span class="res-n">' + (list.length ? "找到 " + fmt(list.length) + " 张" : "没找到") + "</span></div>";
      var meta = [];
      res.aliases.forEach(function (a) {
        meta.push('<span class="lbl">「' + esc(a[0]) + "」也就是</span>" + a[1].split(" ").map(function (t) {
          return '<button class="tagchip solid" type="button" data-q="' + esc(t) + '">' + esc(t) + "</button>";
        }).join(""));
      });
      if (res.heard) {
        meta.push('<span class="lbl">从这句话里听出了</span>' + res.heard.map(function (t) {
          return '<button class="tagchip solid" type="button" data-q="' + esc(t) + '">' + esc(t) + "</button>";
        }).join(""));
      }
      if (list.length) {
        var count = {}, skip = new Set(res.tokens.concat(res.heard || []));
        list.slice(0, 60).forEach(function (r) {
          items[r.i].tags.forEach(function (t) { if (!skip.has(norm(t))) count[t] = (count[t] || 0) + 1; });
        });
        var rel = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).slice(0, 8);
        if (rel.length > 1) {
          meta.push('<span class="lbl">相关</span>' + rel.map(function (t) {
            return '<button class="tagchip" type="button" data-q="' + esc(t) + '">' + esc(t) + "</button>";
          }).join(""));
        }
      }
      if (meta.length) html += meta.map(function (m) { return '<div class="res-meta">' + m + "</div>"; }).join("");
      if (!list.length) {
        html += '<div class="empty"><div class="empty-face">(・ω・;)</div><p>没找到这样的脸。换个说法试试：</p><div class="tagrow" style="justify-content:center">' +
          SUGGEST.slice(0, 10).map(function (t) { return '<button class="tagchip" type="button" data-q="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") +
          "</div></div>";
      }
      html += '<div class="grid" id="resGrid"></div>';
      resultsEl.innerHTML = html;
    }
    var grid = $("#resGrid");
    var frag = "";
    for (var j = shownCount; j < upto; j++) frag += tileHTML(items[list[j].i]);
    grid.insertAdjacentHTML("beforeend", frag);
    shownCount = upto;
    var old = $(".res-more", resultsEl);
    if (old) old.remove();
    if (upto < list.length) {
      grid.insertAdjacentHTML("afterend", '<button class="btn ghost res-more" type="button">再看 ' + fmt(Math.min(step, list.length - upto)) + " 张（还有 " + fmt(list.length - upto) + "）</button>");
    }
  }
  resultsEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-q]");
    if (b) { qEl.value = b.getAttribute("data-q"); onQuery(true); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest(".res-more") && lastResult) renderResults(lastResult, true);
  });

  var composing = false, qTimer = 0, searching = false;
  function onQuery(now) {
    clearTimeout(qTimer);
    var run = function () {
      var q = qEl.value;
      qClear.hidden = !q;
      var res = search(q);
      if (!res) {
        if (searching) {
          searching = false;
          resultsEl.hidden = true;
          resultsEl.innerHTML = "";
          libEl.hidden = false;
          setMood("", 0);
          spy();
        }
        return;
      }
      if (!searching) {
        searching = true;
        libEl.hidden = true;
        resultsEl.hidden = false;
        var top = $("#bar").offsetTop;
        if (Math.abs(window.scrollY - top) > 2) window.scrollTo({ top: top });
      }
      lastResult = res;
      renderResults(res);
      var moodTags = res.tokens.slice();
      res.aliases.forEach(function (a) { moodTags = moodTags.concat(a[1].split(" ")); });
      if (res.heard) moodTags = moodTags.concat(res.heard);
      setMood(res.list.length ? moodForTags(moodTags) || "point" : "sweat", 2400);
      if (moodTags.indexOf("掀桌") >= 0 && !reduceMotion) { var h = $(".res-h", resultsEl); if (h) h.classList.add("shake"); }
      setActiveCat(-1);
    };
    if (now === true) run(); else qTimer = setTimeout(run, 90);
  }
  qEl.addEventListener("compositionstart", function () { composing = true; });
  qEl.addEventListener("compositionend", function () { composing = false; onQuery(); });
  qEl.addEventListener("input", function (e) { if (composing || e.isComposing) return; onQuery(); });
  qEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); onQuery(true); qEl.blur(); }
  });
  qEl.addEventListener("focus", function () { setMood("point", 1500); });
  qClear.addEventListener("click", function () { qEl.value = ""; onQuery(true); qEl.focus(); });

  /* 搜索框里轮换的例子 */
  var PH = ["搜：开心 / 哭 / 猫 / 笑死 / 晚安", "试试：emo了", "试试：摸鱼", "试试：今天好累想睡觉", "试试：ω", "试试：谢谢老板", "试试：掀桌", "试试：生日快乐"];
  var phAt = 0;
  setInterval(function () {
    if (document.activeElement === qEl || qEl.value || document.hidden) return;
    qEl.classList.add("ph-fade");
    setTimeout(function () {
      phAt = (phAt + 1) % PH.length;
      qEl.placeholder = PH[phAt];
      qEl.classList.remove("ph-fade");
    }, 320);
  }, 3400);

  /* ---------- 目录、分类条、滚动定位 ---------- */
  var barEl = $("#bar"), chipsEl = $("#chips"), tocEl = $("#toc");
  var chipByCat = {}, tocByCat = {};
  $$(".chip[data-c]", chipsEl).forEach(function (a) { chipByCat[a.dataset.c] = a; });
  $$(".toc-c[data-c]", tocEl).forEach(function (a) { tocByCat[a.dataset.c] = a; });
  var activeCat = -1, chipsTouched = 0;
  chipsEl.addEventListener("pointerdown", function () { chipsTouched = Date.now(); }, { passive: true });
  chipsEl.addEventListener("scroll", function () { chipsTouched = Date.now(); }, { passive: true });

  function setActiveCat(ci) {
    if (ci === activeCat) return;
    if (activeCat >= 0) {
      if (chipByCat[activeCat]) chipByCat[activeCat].classList.remove("on");
      if (tocByCat[activeCat]) tocByCat[activeCat].classList.remove("on");
    }
    activeCat = ci;
    if (ci < 0) return;
    var chip = chipByCat[ci], t = tocByCat[ci];
    if (chip) {
      chip.classList.add("on");
      if (Date.now() - chipsTouched > 1200) {
        chipsEl.scrollTo({ left: chip.offsetLeft - 60, behavior: reduceMotion ? "auto" : "smooth" });
      }
    }
    if (t) {
      t.classList.add("on");
      var side = $(".side");
      if (side && side.offsetParent !== null) {
        var r = t.getBoundingClientRect(), sr = side.getBoundingClientRect();
        if (r.top < sr.top + 120 || r.bottom > sr.bottom - 40) side.scrollTo({ top: t.offsetTop - side.clientHeight / 3, behavior: "smooth" });
      }
    }
  }
  var sections = $$(".cat[data-c]");
  var spyRaf = 0;
  function spy() {
    if (spyRaf || searching || current !== "lib") return;
    spyRaf = requestAnimationFrame(function () {
      spyRaf = 0;
      var line = barEl.getBoundingClientRect().bottom + 24;
      var lo = 0, hi = sections.length - 1, hit = -1;
      while (lo <= hi) {
        var mid = (lo + hi) >> 1;
        if (sections[mid].getBoundingClientRect().top <= line) { hit = mid; lo = mid + 1; } else hi = mid - 1;
      }
      setActiveCat(hit >= 0 ? +sections[hit].dataset.c : -1);
    });
  }
  window.addEventListener("scroll", spy, { passive: true });
  window.addEventListener("scroll", function () { barEl.classList.toggle("stuck", barEl.getBoundingClientRect().top <= 1 && window.scrollY > 10); }, { passive: true });

  function setScrollPad() {
    root.style.scrollPaddingTop = (barEl.offsetHeight + 12) + "px";
  }
  function goCat(id, smooth) {
    var sec = document.getElementById(id);
    if (!sec) return;
    if (searching) { qEl.value = ""; onQuery(true); }
    setScrollPad();
    var y = sec.getBoundingClientRect().top + window.scrollY - barEl.offsetHeight - 6;
    window.scrollTo({ top: Math.max(0, y), behavior: smooth && !reduceMotion ? "smooth" : "auto" });
    try { history.replaceState(history.state, "", "#" + id); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#c-"], a[href^="#g-"]');
    if (!a) return;
    e.preventDefault();
    var id = a.getAttribute("href").slice(1);
    var fromSheet = !!a.closest(".sheet");
    if (fromSheet) closeSheet();
    setTimeout(function () {
      if (current !== "lib") goLib();
      goCat(id, !fromSheet);
    }, fromSheet ? 140 : 0);
  });
  $("#tocBtn").addEventListener("click", function () {
    var html = '<div class="toc">' + tocEl.innerHTML + "</div>";
    openSheet("<small>" + groups.length + " 组 · " + cats.length + " 类</small>跳到分类", html);
    var on = $(".toc-c.on", sheetBody);
    if (on) on.scrollIntoView({ block: "center" });
  });

  window.addEventListener("resize", function () { setScrollPad(); });

  /* ---------- 页面切换 ---------- */
  var VIEWS = { lib: $("#v-lib"), lab: $("#v-lab"), me: $("#v-me") };
  var current = "lib", libScroll = 0;
  var heroEl = $(".hero");
  function goLib() {
    if (current === "lib") return;
    try { history.pushState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; }
    show("lib", "");
  }
  function show(view, sub) {
    var changed = view !== current;
    if (changed && current === "lib") libScroll = window.scrollY;
    current = view;
    Object.keys(VIEWS).forEach(function (k) { VIEWS[k].hidden = k !== view; });
    heroEl.hidden = view !== "lib";
    barEl.hidden = view !== "lib";
    $$("[data-tab]").forEach(function (t) {
      if (t.getAttribute("data-tab") === view) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
    if (view === "me") renderMe();
    if (view === "lab" && window.KMJ_LAB) window.KMJ_LAB.render(VIEWS.lab, sub);
    else if (window.KMJ_LAB) window.KMJ_LAB.stop();
    if (changed && !reduceMotion) {
      VIEWS[view].classList.remove("enter");
      void VIEWS[view].offsetWidth;
      VIEWS[view].classList.add("enter");
    }
    if (view === "lib") {
      if (changed) window.scrollTo(0, libScroll);
      spy();
    } else if (changed || sub) {
      window.scrollTo(0, 0);
    }
  }
  function route() {
    var h = location.hash.replace(/^#/, "");
    if (h === "lab" || h.indexOf("lab-") === 0) show("lab", h.slice(4));
    else if (h === "me") show("me", "");
    else {
      show("lib", "");
      if (/^[cg]-/.test(h)) setTimeout(function () { goCat(h, false); }, 0);
      else if (h === "top") window.scrollTo(0, 0);
    }
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[data-tab="lib"]');
    if (!a) return;
    e.preventDefault();
    if (current === "lib") { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); if (searching) { qEl.value = ""; onQuery(true); } }
    else goLib();
  });

  /* ---------- 我的 ---------- */
  function setSetting(k, v) {
    state.set[k] = v;
    store.set("set", state.set);
    if (k === "theme") {
      var apply = function () {
        if (v === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", v);
      };
      if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply); else apply();
    }
    if (k === "size") { if (v === "m") root.removeAttribute("data-size"); else root.setAttribute("data-size", v); }
    if (k === "safe") { root.classList.toggle("safe", v); recount(); }
  }
  function recount() {
    cats.forEach(function (c) {
      var n = state.set.safe ? c.items.filter(function (i) { return items[i].lv < 2; }).length : c.items.length;
      var sec = document.getElementById("c-" + c.id);
      if (sec) { var el = $(".cat-n", sec); if (el) el.textContent = n + " 张"; }
      var t = tocByCat[c.i];
      if (t) $(".toc-n", t).textContent = n;
    });
    var total = state.set.safe ? items.filter(function (it) { return it.lv < 2; }).length : items.length;
    $("#total").textContent = fmt(total);
  }
  var rareCount = items.filter(function (it) { return it.lv === 2; }).length;
  var confirming = "";

  function renderMe() {
    var v = VIEWS.me;
    var used = state.seen.length;
    var top = state.recent.slice().sort(function (a, b) { return b.n - a.n; })[0];
    var seg = function (key, opts) {
      return '<div class="seg" role="group">' + opts.map(function (o) {
        return '<button type="button" data-set="' + key + '" data-val="' + o[0] + '" aria-pressed="' + (state.set[key] === o[0]) + '">' + o[1] + "</button>";
      }).join("") + "</div>";
    };
    var sw = function (key) {
      return '<button class="sw" type="button" role="switch" data-sw="' + key + '" aria-checked="' + !!state.set[key] + '" aria-label="开关"></button>';
    };
    var clearBtn = function (what, label) {
      return confirming === what
        ? '<span class="confirm">确定清空？<button class="btn sm pink" type="button" data-clear="' + what + '">清空</button><button class="btn sm ghost" type="button" data-clear="">算了</button></span>'
        : '<button class="btn sm ghost" type="button" data-ask="' + what + '">' + label + "</button>";
    };
    var grid = function (list) { return '<div class="grid">' + list.map(function (t) { return tileHTML(t); }).join("") + "</div>"; };
    v.innerHTML =
      '<div class="page-h"><h2>我的</h2><p>收藏、用过的和自己捏的，都只存在这台设备的浏览器里。</p></div>' +
      '<div class="me-stats">' +
        '<div class="me-big num">' + fmt(used) + "<small>/ " + fmt(items.length) + " 张已收集</small></div>" +
        '<div class="meter" aria-hidden="true"><i style="width:' + Math.max(used ? 1.5 : 0, used / items.length * 100).toFixed(1) + '%"></i></div>' +
        '<p class="me-line">' + (top ? '用得最多的是 <span class="kf">' + esc(top.t.split("\n")[0]) + "</span>，一共 " + top.n + " 次。" : "复制过的脸会在图鉴里留一个小圆点，像集邮一样。") + "</p>" +
      "</div>" +
      '<section class="me-sec"><div class="me-sec-h"><h3>收藏<small>' + state.fav.length + "</small></h3>" +
        (state.fav.length ? '<button class="btn sm" type="button" data-copyall="fav">复制全部</button>' + clearBtn("fav", "清空") : "") + "</div>" +
        (state.fav.length ? grid(state.fav) : '<div class="blank"><span class="kf">(｡･ω･｡)ﾉ♡</span>还没有收藏。在图鉴里双击一张脸，或者长按后点「收藏」。</div>') +
      "</section>" +
      '<section class="me-sec"><div class="me-sec-h"><h3>最近用过<small>' + state.recent.length + "</small></h3>" +
        (state.recent.length ? clearBtn("recent", "清空") : "") + "</div>" +
        (state.recent.length ? grid(state.recent.slice(0, 48).map(function (r) { return r.t; })) : '<div class="blank"><span class="kf">( ˘ω˘ )</span>复制过的会按时间排在这里。</div>') +
      "</section>" +
      '<section class="me-sec"><div class="me-sec-h"><h3>我捏的<small>' + state.made.length + "</small></h3>" +
        (state.made.length ? clearBtn("made", "清空") : "") + "</div>" +
        (state.made.length ? grid(state.made) : '<div class="blank"><span class="kf">٩(ˊᗜˋ*)و</span>去<a href="#lab-face">捏脸机</a>拼一张，点「保存」就会出现在这里。</div>') +
      "</section>" +
      '<section class="me-sec"><div class="me-sec-h"><h3>设置</h3></div><div class="set">' +
        '<div class="set-row"><div class="lbl"><b>外观</b><span>浅色、深色，或者跟着系统走</span></div>' + seg("theme", [["auto", "跟随系统"], ["light", "浅色"], ["dark", "深色"]]) + "</div>" +
        '<div class="set-row"><div class="lbl"><b>格子大小</b><span>手机上一行放几张</span></div>' + seg("size", [["s", "小"], ["m", "中"], ["l", "大"]]) + "</div>" +
        '<div class="set-row"><div class="lbl"><b>稳妥模式</b><span>藏起 ' + rareCount + " 张含少见字符的脸，发出去不怕变方框</span></div>" + sw("safe") + "</div>" +
        (navigator.vibrate ? '<div class="set-row"><div class="lbl"><b>震动反馈</b><span>复制、收藏时轻轻震一下</span></div>' + sw("haptic") + "</div>" : "") +
      "</div></section>" +
      '<section class="me-sec"><div class="me-sec-h"><h3>关于</h3></div><div class="about">' +
        "<p>颜文字（kaomoji）是用文字符号拼出来的脸，八九十年代从日本的电子公告板流行开来。和 emoji 不同，它就是一串普通文字，发到哪里都能复制粘贴。</p>" +
        "<ul>" +
          "<li>点一下复制，双击收藏；" + (finePointer ? "右键" : "长按") + "看详情，能看到它借了哪几种文字的符号。</li>" +
          "<li>搜索认识网络用语和整句话：「笑死」「破防了」「今天好累想睡觉」都行，也能直接搜符号，比如 ω。</li>" +
          "<li>少见字符在对方手机缺字体时会变成方框 □，详情里会提醒，嫌麻烦就打开上面的稳妥模式。</li>" +
          "<li>这一页是一个独立的网页文件，离线也能用；收藏只存在这台设备上。</li>" +
        "</ul>" +
        '<p>共收录 ' + fmt(items.length) + " 张脸，" + cats.length + " 类。旧版还在：<a href=\"https://peipei707.github.io/kaomoji/\">颜文字小铺</a>。</p>" +
      "</div></section>";
  }
  VIEWS.me.addEventListener("click", function (e) {
    var b = e.target.closest("[data-set], [data-sw], [data-ask], [data-clear], [data-copyall]");
    if (!b) return;
    if (b.hasAttribute("data-set")) { setSetting(b.getAttribute("data-set"), b.getAttribute("data-val")); renderMe(); }
    else if (b.hasAttribute("data-sw")) { var k = b.getAttribute("data-sw"); setSetting(k, !state.set[k]); renderMe(); }
    else if (b.hasAttribute("data-ask")) { confirming = b.getAttribute("data-ask"); renderMe(); }
    else if (b.hasAttribute("data-clear")) {
      var what = b.getAttribute("data-clear");
      if (what === "fav") { state.fav.slice().forEach(function (t) { markText(t, "fav", false); }); state.fav = []; store.set("fav", []); updateBadge(); }
      if (what === "recent") { state.recent = []; store.set("recent", []); }
      if (what === "made") { state.made = []; store.set("made", []); }
      if (what) toast("清空了", "", "✓");
      confirming = "";
      renderMe();
    } else if (b.hasAttribute("data-copyall")) {
      copyText(state.fav.join("\n"));
      toast("已复制 " + state.fav.length + " 张", "", "✓");
      setMood("ok", 1200);
    }
  });

  function addMade(text) {
    if (state.made.indexOf(text) >= 0) return false;
    state.made.unshift(text);
    if (state.made.length > 200) state.made.length = 200;
    store.set("made", state.made);
    return true;
  }

  /* ---------- 给实验室用的 ---------- */
  window.KMJ = {
    U: U, items: items, cats: cats, groups: groups, byText: byText, catById: catById, partCats: partCats,
    esc: esc, pad: pad, fmt: fmt, hash: hash, dayKey: dayKey, store: store, state: state,
    copy: copyFrom, copyText: copyText, toast: toast, haptic: haptic, setMood: setMood,
    openDetail: openDetail, openStage: openStage, openSheet: openSheet, closeSheet: closeSheet,
    pickRandom: pickRandom, search: search, tileHTML: tileHTML, addMade: addMade,
    fitText: fitText, reduceMotion: reduceMotion, finePointer: finePointer, route: route, $: $, $$: $$
  };

  /* ---------- 开始 ---------- */
  updateBadge();
  if (state.set.safe) recount();
  showTip(0);
  setScrollPad();
  route();
  var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(function () { setScrollPad(); spy(); });
})();
