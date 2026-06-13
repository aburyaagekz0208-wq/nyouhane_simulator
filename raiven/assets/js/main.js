/* =========================================================
   RAIVEN 歌舞伎町店 — main.js
   - モバイルナビ開閉
   - data/site-data.js (window.RAIVEN_DATA) から
     キャスト / イベント / メニューを描画
   ========================================================= */
(function () {
  "use strict";

  var DATA = window.RAIVEN_DATA || {};

  /* ---------- helpers ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function imgPath(id) {
    if (!id) return "";
    return (DATA.imageBase || "public/images/") + id + (DATA.imageExt || ".png");
  }
  function fmtDate(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    if (p.length !== 3) return iso;
    return p[1] + "." + p[2]; // MM.DD
  }
  var SNS_SVG = {
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.84l-5.36-7-6.13 7H1.4l8.02-9.17L1 2h7l4.84 6.4L18.244 2Zm-1.2 18h1.9L7.04 4H5.02l12.02 16Z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 3c.3 2.1 1.7 3.7 3.8 3.9V9.3c-1.4.1-2.7-.3-3.8-1v5.9a5.6 5.6 0 1 1-5.6-5.6c.2 0 .5 0 .7.1v2.5a3.1 3.1 0 1 0 2.2 3V3h2.7Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.6A3.4 3.4 0 1 0 12 15.4 3.4 3.4 0 0 0 12 8.6Zm0 5.6a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4ZM16 3H8a5 5 0 0 0-5 5v8a5 5 0 0 0 5 5h8a5 5 0 0 0 5-5V8a5 5 0 0 0-5-5Zm3.8 13a3.8 3.8 0 0 1-3.8 3.8H8A3.8 3.8 0 0 1 4.2 16V8A3.8 3.8 0 0 1 8 4.2h8A3.8 3.8 0 0 1 19.8 8v8Zm-3.55-9.15a.85.85 0 1 0 0 1.7.85.85 0 0 0 0-1.7Z"/></svg>'
  };

  function snsLinks(links, name) {
    if (!links) return "";
    var order = ["x", "tiktok", "instagram"];
    var labels = { x: "X（旧Twitter）", tiktok: "TikTok", instagram: "Instagram" };
    var out = "";
    order.forEach(function (k) {
      var url = links[k];
      if (!url) return;
      out += '<a class="sns-ico" href="' + esc(url) + '" target="_blank" rel="noopener" ' +
        'aria-label="' + esc(name) + 'の' + labels[k] + 'を見る（新しいタブで開きます）">' +
        (SNS_SVG[k] || k) + '</a>';
    });
    return out;
  }

  /* ---------- mobile nav ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = el("primary-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- cast cards ---------- */
  function castCard(c) {
    return '' +
      '<article class="card cast-card">' +
        '<div class="cast-card__media">' +
          '<img src="' + esc(imgPath(c.image_id)) + '" alt="RAIVEN歌舞伎町店キャスト ' + esc(c.name) + 'の写真" loading="lazy" decoding="async" width="900" height="1200">' +
        '</div>' +
        '<div class="cast-card__body">' +
          (c.role ? '<p class="cast-card__role">' + esc(c.role) + '</p>' : '') +
          '<h3 class="cast-card__name">' + esc(c.name) + '</h3>' +
          '<p class="cast-card__bio">' + esc(c.profile_short) + '</p>' +
          '<div class="cast-card__sns">' + snsLinks(c.links, c.name) + '</div>' +
        '</div>' +
      '</article>';
  }
  function renderCasts() {
    var hosts = document.querySelectorAll("[data-casts]");
    if (!hosts.length || !DATA.casts) return;
    hosts.forEach(function (host) {
      var limit = parseInt(host.getAttribute("data-casts"), 10);
      var list = isNaN(limit) ? DATA.casts : DATA.casts.slice(0, limit);
      host.innerHTML = list.map(castCard).join("");
    });
  }

  /* ---------- event cards ---------- */
  function eventCard(ev) {
    var link = ev.source_url
      ? '<a class="textlink" href="' + esc(ev.source_url) + '" target="_blank" rel="noopener">公式Xの投稿を見る<span class="sr-only">（新しいタブで開きます）</span></a>'
      : '';
    return '' +
      '<article class="card event-card">' +
        '<div class="event-card__media">' +
          '<span class="date-chip">' + esc(fmtDate(ev.date)) + '</span>' +
          '<img src="' + esc(imgPath(ev.image_id)) + '" alt="' + esc(ev.title) + 'の告知画像" loading="lazy" decoding="async" width="1200" height="1500">' +
        '</div>' +
        '<div class="event-card__body">' +
          '<h3>' + esc(ev.title) + '</h3>' +
          '<p class="small">' + esc(ev.summary || "") + '</p>' +
          link +
        '</div>' +
      '</article>';
  }
  function renderEvents() {
    var hosts = document.querySelectorAll("[data-events]");
    if (!hosts.length || !DATA.events) return;
    hosts.forEach(function (host) {
      var limit = parseInt(host.getAttribute("data-events"), 10);
      var list = isNaN(limit) ? DATA.events : DATA.events.slice(0, limit);
      host.innerHTML = list.map(eventCard).join("");
    });
  }

  /* ---------- menu cards ---------- */
  function menuRow(it) {
    var unit = it.unit ? '<span class="menu-row__unit">/ ' + esc(it.unit) + '</span>' : '';
    var tag = it.status ? '<span class="tag-ref">' + esc(it.status) + '</span>' : '';
    return '' +
      '<div class="menu-row">' +
        '<span class="menu-row__name">' + esc(it.label) + '</span>' +
        '<span class="menu-row__price"><b>' + esc(it.price) + '</b>' + unit + tag + '</span>' +
      '</div>';
  }
  function menuCard(g) {
    return '' +
      '<div class="menu-card">' +
        '<div class="menu-card__title"><span class="label brand-serif">' + esc(g.label) + '</span></div>' +
        g.items.map(menuRow).join("") +
        (g.note ? '<p class="small menu-card__note">' + esc(g.note) + '</p>' : '') +
      '</div>';
  }
  function renderMenu() {
    var hosts = document.querySelectorAll("[data-menu]");
    if (!hosts.length || !DATA.menu) return;
    hosts.forEach(function (host) {
      var limit = parseInt(host.getAttribute("data-menu"), 10);
      var list = isNaN(limit) ? DATA.menu : DATA.menu.slice(0, limit);
      host.innerHTML = list.map(menuCard).join("");
    });
  }

  /* ---------- text bindings (last updated, address, etc.) ---------- */
  function bindText() {
    if (!DATA.site) return;
    var map = {
      "bind-updated": DATA.site.lastUpdated,
      "bind-address": DATA.site.address,
      "bind-open": DATA.site.grandOpen,
      "bind-producer": DATA.site.producer,
      "bind-sister": DATA.site.sister
    };
    Object.keys(map).forEach(function (id) {
      var node = el(id);
      if (node && map[id]) node.textContent = map[id];
    });
    // notices
    document.querySelectorAll("[data-notice]").forEach(function (n) {
      var key = n.getAttribute("data-notice");
      if (DATA.notices && DATA.notices[key]) n.textContent = DATA.notices[key];
    });
  }

  /* =========================================================
     Motion / アニメーション
     ※ 全体をオフにしたいときは下の MOTION を false に。
       （OSの「視差効果を減らす」設定時も自動でオフになります）
     ========================================================= */
  var MOTION = true;
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FX_ENABLED = MOTION && !REDUCED;

  // 浮遊する泡の数（増やしたいときはこの数値を変更）
  var BUBBLE_COUNT = 14;

  /* ---- スクロール出現（reveal）---- */
  var revealIO = null;
  function initRevealObserver() {
    if (!FX_ENABLED || !("IntersectionObserver" in window)) return;
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); revealIO.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  }
  var REVEAL_SELECTOR = ".section__head, .updatebar, .card, .menu-card, .info-block, .media-frame, .notice, .split > *, .two-col > *";
  function applyReveal(root) {
    if (!FX_ENABLED || !revealIO) return;
    var nodes = (root || document).querySelectorAll(REVEAL_SELECTOR);
    nodes.forEach(function (n) {
      if (n.__rv || n.closest(".hero")) return;
      n.__rv = 1;
      n.classList.add("reveal");
      // 同じ並びの要素は少しずつ遅らせて連続表示（stagger）
      var sibs = n.parentElement ? n.parentElement.children : [n];
      var idx = Array.prototype.indexOf.call(sibs, n);
      n.style.setProperty("--reveal-delay", Math.min(idx, 6) * 70 + "ms");
      revealIO.observe(n);
    });
  }

  /* ---- ヘッダーのスクロール状態 ---- */
  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 24); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- 背景の浮遊する泡 ---- */
  function initBubbles() {
    if (!FX_ENABLED || BUBBLE_COUNT <= 0) return;
    var wrap = document.createElement("div");
    wrap.className = "fx-bubbles";
    wrap.setAttribute("aria-hidden", "true");
    for (var i = 0; i < BUBBLE_COUNT; i++) {
      var s = document.createElement("span");
      var size = 6 + Math.random() * 26;
      s.style.left = (Math.random() * 100) + "%";
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.animationDuration = (12 + Math.random() * 16) + "s";
      s.style.animationDelay = (-Math.random() * 20) + "s";
      s.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
      wrap.appendChild(s);
    }
    document.body.appendChild(wrap);
  }

  /* ---- 更新バーの流れるテロップ ---- */
  function initTicker() {
    var host = el("ticker");
    if (!host || !DATA.events || !DATA.events.length) return;
    var items = DATA.events.map(function (ev) {
      return '<span><b>' + esc(fmtDate(ev.date)) + '</b>　' + esc(ev.title) + '</span>';
    }).join("");
    // 途切れず流すために2回繰り返す
    host.innerHTML = '<div class="ticker__track">' + items + items + '</div>';
  }

  /* ---------- boot ---------- */
  function boot() {
    initNav();
    bindText();
    initRevealObserver();
    renderCasts();
    renderEvents();
    renderMenu();
    initTicker();
    applyReveal();          // データ描画後にまとめて適用
    initHeaderScroll();
    initBubbles();
    var y = el("bind-year");
    if (y) y.textContent = new Date().getFullYear();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
