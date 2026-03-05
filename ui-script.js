/**
 * AmneziaWG Architect — UI layer (ui-script.js)
 *
 * Содержит все DOM-зависимые функции:
 *   - Чтение состояния контролов (getT, getHost, getBrowserFpProfile, getFpRange, getUserMTU)
 *   - Управление видимостью UI-элементов (toggleBrowserFp, toggleYandexWarn, applyVersionUi)
 *   - Рендер конфига (renderCfg, renderPrev, sec, esc)
 *   - Экспорт (getPlain, copyConfig, downloadConfig)
 *   - Действия пользователя (generate, setVersion, setIntensity, feedback, updateIter)
 *   - Служебные (addLog, toggleFaq)
 *   - Инициализация (DOMContentLoaded)
 *
 * Загружается ПОСЛЕ script.js — использует генераторы и данные из него.
 */

/* ── DOM bridge helpers ──────────────────────────────────────────────────────
 *
 * Эти функции читают состояние UI и предоставляют данные генераторам
 * (mkQUICi, mkNoise и т.д.), определённым в script.js.
 * Они должны быть в глобальном scope на момент первого вызова generate().
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * getT(id) — читает состояние чекбокса тега по его id.
 * Если элемент не найден — по умолчанию считается включённым (безопасный fallback).
 */
function getT(id) {
  return (document.getElementById(id) || { checked: true }).checked;
}

/**
 * getHost(profile) — возвращает текущий пользовательский хост (если введён),
 * иначе выбирает случайный хост из пула hostPools[profile].
 * При неизвестном профиле используется пул tls_client_hello.
 */
function getHost(profile) {
  var elem = document.getElementById("customHost");
  var custom = elem ? elem.value.trim() : "";
  if (custom) return custom;
  var pool = hostPools[profile] || hostPools.tls_client_hello;
  return pool[rnd(0, pool.length - 1)];
}

/**
 * getBrowserFpProfile() — активный профиль браузера или "" если отключён.
 */
function getBrowserFpProfile() {
  var cbx = document.getElementById("useBrowserFp");
  if (!cbx || !cbx.checked) return "";
  var el = document.getElementById("browserFpProfile");
  return el ? el.value : "";
}

/**
 * getFpRange(slot) — возвращает [min, max] байт для текущего BFP-профиля и слота.
 * slot: "qi" | "q0" | "h3" | "tls" | "nx" | "dtls"
 * Если fp отключён или профиль неизвестен — возвращает null.
 */
function getFpRange(slot) {
  var profile = getBrowserFpProfile();
  return (BFP[profile] && BFP[profile][slot]) || null;
}

/**
 * getUserMTU() — читает значение MTU из поля ввода пользователя.
 *
 * Допустимый диапазон: 576–9000.
 * По умолчанию: 1500 (стандартный Ethernet MTU).
 * Распространённые значения:
 *   1500 — стандартный Ethernet
 *   1420 — WireGuard / PPPoE (1500 - 80 байт overhead)
 *   1280 — минимальный IPv6 MTU
 *    576 — минимальный IPv4 (RFC 791)
 */
function getUserMTU() {
  var el = document.getElementById("userMtu");
  if (!el) return 1500;
  var v = parseInt(el.value, 10);
  if (isNaN(v) || v < 576 || v > 9000) return 1500;
  return v;
}

/* ── UI toggle functions ─────────────────────────────────────────────────── */

/**
 * applyVersionUi(v) — показывает/скрывает элементы, зависящие от версии AWG.
 *
 * AWG 1.0: нет I1–I5 (CPS), нет BFP, нет MTU-паддинга, нет S3/S4/H3/H4 диапазонов.
 *          Скрываем: cpsBlock, bfpOuterBlock, mtuBlock, mimicAll-label.
 *          Показываем: cpsUnsupportedNotice, verNotice10.
 *
 * AWG 1.5: есть I1–I5 (только клиент), есть BFP/MTU, нет S3/S4/H3/H4.
 *          Показываем всё, но добавляем verNotice15.
 *
 * AWG 2.0: всё поддерживается, все блоки видны.
 */
function applyVersionUi(v) {
  var is10 = v === "1.0";

  // Version notices
  var n10 = document.getElementById("verNotice10");
  var n15 = document.getElementById("verNotice15");
  if (n10) n10.style.display = is10 ? "flex" : "none";
  if (n15) n15.style.display = v === "1.5" ? "flex" : "none";

  // CPS block (tags, profile, mimic-all)
  var cpsBlock = document.getElementById("cpsBlock");
  var cpsUnsupported = document.getElementById("cpsUnsupportedNotice");
  var mimicAllLabel = document.querySelector('label[for="mimicAll"]');
  var mimicAllWrap = mimicAllLabel
    ? mimicAllLabel.closest("label") || mimicAllLabel.parentElement
    : null;
  // The mimicAll label is a direct child label.check-label — find it by checkbox
  var mimicAllCbx = document.getElementById("mimicAll");
  var mimicAllParent = mimicAllCbx ? mimicAllCbx.closest("label") : null;

  if (cpsBlock) cpsBlock.style.display = is10 ? "none" : "block";
  if (cpsUnsupported) cpsUnsupported.style.display = is10 ? "block" : "none";
  if (mimicAllParent) mimicAllParent.style.display = is10 ? "none" : "";

  // Also hide the quicProfile select label + customHostWrap in 1.0
  var quicProfileLabel =
    document.querySelector(".clabel[for-ver]") ||
    (function () {
      // Find the "Профиль мимикрии I1:" label — it's the first .clabel in .controls
      var labels = document.querySelectorAll(".controls .clabel");
      return labels.length ? labels[0] : null;
    })();
  var quicProfileSel = document.getElementById("quicProfile");
  var customHostWrap = document.getElementById("customHostWrap");
  if (quicProfileLabel) quicProfileLabel.style.display = is10 ? "none" : "";
  if (quicProfileSel)
    quicProfileSel.parentElement &&
      (quicProfileSel.style.display = is10 ? "none" : "");
  if (customHostWrap && is10) customHostWrap.classList.remove("show");

  // BFP outer block
  var bfpOuter = document.getElementById("bfpOuterBlock");
  if (bfpOuter) bfpOuter.style.display = is10 ? "none" : "block";

  // MTU block
  var mtuBlock = document.getElementById("mtuBlock");
  if (mtuBlock) mtuBlock.style.display = is10 ? "none" : "block";

  // MergeKeys: show AWG-version warning if 1.0
  var mkVWarn = document.getElementById("mkVersionWarn");
  if (mkVWarn) mkVWarn.style.display = is10 ? "flex" : "none";
}

/**
 * toggleBrowserFp — показывает/скрывает блок выбора профиля браузера.
 * Вызывается из чекбокса "useBrowserFp".
 */
function toggleBrowserFp() {
  var cbx = document.getElementById("useBrowserFp");
  var wrap = document.getElementById("browserFpWrap");
  if (wrap) wrap.style.display = cbx && cbx.checked ? "block" : "none";
  toggleYandexWarn();
}

/**
 * toggleYandexWarn — показывает синее предупреждение если выбран
 * нестабильный профиль Яндекс Браузера.
 */
function toggleYandexWarn() {
  var el = document.getElementById("browserFpProfile");
  var warn = document.getElementById("yandexFpWarn");
  if (!warn) return;
  var isYandex = el && YANDEX_UNSTABLE_PROFILES.indexOf(el.value) !== -1;
  var fpActive = (function () {
    var cbx = document.getElementById("useBrowserFp");
    return cbx && cbx.checked;
  })();
  warn.style.display = isYandex && fpActive ? "flex" : "none";
}

/* ── Rendering ───────────────────────────────────────────────────────────── */

/** Карта отображаемых названий протоколов */
var plabs = {
  quic_initial: "QUIC Initial",
  quic_0rtt: "QUIC 0-RTT",
  tls_client_hello: "TLS 1.3",
  wireguard_noise: "Noise_IK",
  dtls: "DTLS 1.3",
  http3: "HTTP/3",
  sip: "SIP",
  random: "Random",
};

/**
 * renderCfg(p) — отрисовывает сгенерированные параметры в таблицу на странице.
 * Добавляет shimmer-анимацию и передаёт результат в renderPrev для предпросмотра.
 */
function renderCfg(p) {
  var tbl = document.getElementById("configTable");
  tbl.classList.add("shimmer");
  setTimeout(function () {
    tbl.classList.remove("shimmer");
  }, 650);
  var pn = plabs[p.profile] || p.profile;
  var html = "";

  if (ver === "2.0") {
    html += sec("DYNAMIC HEADERS H1–H4", [
      ["H1", p.h1, "va", "— Init type (диапазон)"],
      ["H2", p.h2, "va", "— Response type"],
      ["H3", p.h3, "va", "— Cookie Reply"],
      ["H4", p.h4, "va", "— Data type"],
    ]);
    html += sec("PACKET SIZE PREFIXES S1–S4", [
      ["S1", p.s1, "vp", "— Init ≤64 B"],
      [
        "S2",
        p.s2,
        "vp",
        '— Resp ≤64 B <span style="color:var(--text3);font-size:9px">S1+56≠S2 ✓</span>',
      ],
      ["S3", p.s3, "vp", "— Cookie ≤64 B"],
      ["S4", p.s4, "vp", "— Data ≤32 B"],
    ]);
    html += sec("JUNK TRAIN", [
      ["Jc", p.jc, "vb", "— пакетов"],
      ["Jmin", p.jmin, "vb", "— min байт"],
      ["Jmax", p.jmax, "vb", "— max байт"],
    ]);
  } else {
    html += sec("HEADERS H1–H4 (одно значение)", [
      ["H1", p.h1s, "va", ""],
      ["H2", p.h2s, "va", ""],
      ["H3", p.h3s, "va", ""],
      ["H4", p.h4s, "va", ""],
    ]);
    html += sec("PREFIXES S1–S2", [
      ["S1", p.s1, "vp", "≤64 B"],
      [
        "S2",
        p.s2,
        "vp",
        '≤64 B <span style="color:var(--text3);font-size:9px">S1+56≠S2 ✓</span>',
      ],
    ]);
    html += sec("JUNK TRAIN", [
      ["Jc", p.jc, "vb", ""],
      ["Jmin", p.jmin, "vb", ""],
      ["Jmax", p.jmax, "vb", ""],
    ]);
  }

  if (ver !== "1.0") {
    var lbl = "CPS SIGNATURE CHAIN I1–I5";
    if (ver === "1.5")
      lbl +=
        '<span style="color:var(--text3);font-size:9px;margin-left:6px">CLIENT ONLY</span>';
    html +=
      '<div class="psec"><div class="pseclabel">' +
      lbl +
      '<span class="qbadge">✦ ' +
      pn +
      "</span></div>";
    for (var n = 1; n <= 5; n++) {
      var i1 = n === 1;
      html +=
        '<div class="prow" style="animation-delay:' +
        n * 0.04 +
        's">' +
        '<div class="pkey">I' +
        n +
        (i1 ? " ✦" : "") +
        "</div>" +
        '<div class="pval ' +
        (i1 ? "vc" : "vg") +
        '" style="font-size:10.5px">' +
        esc(p["i" + n]) +
        "</div></div>";
    }
    html += "</div>";
  }

  tbl.innerHTML = html;
  renderPrev(p);
}

/** sec(label, rows) — создаёт HTML-секцию в таблице параметров */
function sec(label, rows) {
  var h = '<div class="psec"><div class="pseclabel">' + label + "</div>";
  rows.forEach(function (r, idx) {
    h +=
      '<div class="prow" style="animation-delay:' +
      idx * 0.04 +
      's">' +
      '<div class="pkey">' +
      r[0] +
      "</div>" +
      '<div class="pval ' +
      r[2] +
      '">' +
      r[1] +
      (r[3]
        ? '<span style="color:var(--text3);font-size:10px"> ' + r[3] + "</span>"
        : "") +
      "</div></div>";
  });
  return h + "</div>";
}

/** esc(s) — экранирует HTML-символы для безопасного вывода CPS-строк */
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** renderPrev(p) — генерирует текстовый блок [Interface] для предпросмотра конфига */
function renderPrev(p) {
  var lines = [];
  lines.push('<span class="cm"># AmneziaWG ' + ver + "</span>");
  lines.push('<span class="cm">[Interface]</span>');
  lines.push(
    '<span class="cm"># PrivateKey = &lt;ключ&gt;  Address = 10.0.0.2/32</span>',
  );
  function kv(k, v) {
    lines.push(
      '<span class="kk">' + k + '</span> = <span class="vv">' + v + "</span>",
    );
  }
  if (ver === "2.0") {
    kv("H1", p.h1);
    kv("H2", p.h2);
    kv("H3", p.h3);
    kv("H4", p.h4);
    kv("S1", p.s1);
    kv("S2", p.s2);
    kv("S3", p.s3);
    kv("S4", p.s4);
    kv("Jc", p.jc);
    kv("Jmin", p.jmin);
    kv("Jmax", p.jmax);
    kv("I1", esc(p.i1));
    kv("I2", esc(p.i2));
    kv("I3", esc(p.i3));
    kv("I4", esc(p.i4));
    kv("I5", esc(p.i5));
  } else if (ver === "1.5") {
    kv("H1", p.h1s);
    kv("H2", p.h2s);
    kv("H3", p.h3s);
    kv("H4", p.h4s);
    kv("S1", p.s1);
    kv("S2", p.s2);
    kv("Jc", p.jc);
    kv("Jmin", p.jmin);
    kv("Jmax", p.jmax);
    lines.push('<span class="cm"># I1-I5 только клиент (AWG 1.5):</span>');
    kv("I1", esc(p.i1));
    kv("I2", esc(p.i2));
    kv("I3", esc(p.i3));
    kv("I4", esc(p.i4));
    kv("I5", esc(p.i5));
  } else {
    kv("H1", p.h1s);
    kv("H2", p.h2s);
    kv("H3", p.h3s);
    kv("H4", p.h4s);
    kv("S1", p.s1);
    kv("S2", p.s2);
    kv("Jc", p.jc);
    kv("Jmin", p.jmin);
    kv("Jmax", p.jmax);
    lines.push('<span class="cm"># I1-I5 не поддерживаются в AWG 1.0</span>');
  }
  document.getElementById("previewCode").innerHTML = lines.join("\n");
}

/** getPlain(p) — формирует финальный текст конфигурационного файла */
function getPlain(p) {
  var l = [
    "# AmneziaWG " + ver,
    "[Interface]",
    "# PrivateKey = <ключ>",
    "# Address = 10.0.0.2/32",
  ];
  if (ver === "2.0") {
    l.push("H1 = " + p.h1, "H2 = " + p.h2, "H3 = " + p.h3, "H4 = " + p.h4);
    l.push("S1 = " + p.s1, "S2 = " + p.s2, "S3 = " + p.s3, "S4 = " + p.s4);
    l.push("Jc = " + p.jc, "Jmin = " + p.jmin, "Jmax = " + p.jmax);
    l.push(
      "I1 = " + p.i1,
      "I2 = " + p.i2,
      "I3 = " + p.i3,
      "I4 = " + p.i4,
      "I5 = " + p.i5,
    );
  } else if (ver === "1.5") {
    l.push("H1 = " + p.h1s, "H2 = " + p.h2s, "H3 = " + p.h3s, "H4 = " + p.h4s);
    l.push(
      "S1 = " + p.s1,
      "S2 = " + p.s2,
      "Jc = " + p.jc,
      "Jmin = " + p.jmin,
      "Jmax = " + p.jmax,
    );
    l.push(
      "# I1-I5 только клиент:",
      "I1 = " + p.i1,
      "I2 = " + p.i2,
      "I3 = " + p.i3,
      "I4 = " + p.i4,
      "I5 = " + p.i5,
    );
  } else {
    l.push("H1 = " + p.h1s, "H2 = " + p.h2s, "H3 = " + p.h3s, "H4 = " + p.h4s);
    l.push(
      "S1 = " + p.s1,
      "S2 = " + p.s2,
      "Jc = " + p.jc,
      "Jmin = " + p.jmin,
      "Jmax = " + p.jmax,
    );
  }
  return l.join("\n");
}

/* ── Action handlers ─────────────────────────────────────────────────────── */

/**
 * generate() — главная точка входа при нажатии кнопки или изменении настроек.
 * Вызывает genCfg() из script.js, рендерит результат, обновляет подсказки.
 */
function generate() {
  cp = genCfg();
  renderCfg(cp);

  var s = document.getElementById("quicProfile");
  var wrap = document.getElementById("customHostWrap");
  var hint = document.getElementById("customHostHint");
  var noHost = s.value === "wireguard_noise";

  if (wrap) {
    if (!noHost) wrap.classList.add("show");
    else wrap.classList.remove("show");
  }

  if (hint) {
    var hintMap = {
      quic_initial: "QUIC-capable: fastly.net, cdn-apple.com, yastatic.net …",
      quic_0rtt: "QUIC 0-RTT: fastly.net, s3.amazonaws.com, yastatic.net …",
      tls_client_hello: "Любой HTTPS-хост: vk.com, github.com, ozon.ru …",
      dtls: "STUN/TURN-сервер: stun.yandex.net, stun.jit.si …",
      http3: "HTTP/3-хост: fastly.net, cdn.gcore.com, yandex.net …",
      sip: "SIP-регистратор: sip.zadarma.com, sip.linphone.org …",
      random:
        "Пул выбирается по случайному профилю (опционально укажите свой хост)",
    };
    hint.textContent = hintMap[s.value] || "";
  }

  var input = document.getElementById("customHost");
  if (input) {
    var phMap = {
      quic_initial: "Хост с QUIC (напр., fastly.net)",
      quic_0rtt: "Хост с QUIC 0-RTT (напр., cdn-apple.com)",
      tls_client_hello: "Любой домен (напр., github.com)",
      dtls: "STUN/TURN-хост (напр., stun.jit.si)",
      http3: "HTTP/3-домен (напр., vk.com)",
      sip: "SIP-сервер (напр., sip.zadarma.com)",
      random: "Свой домен (опционально)",
    };
    input.placeholder = phMap[s.value] || "Свой домен";
  }

  addLog("✦ Сгенерирован — " + s.options[s.selectedIndex].text, "info");
}

function setVersion(v, btn) {
  ver = v;
  document.querySelectorAll(".tab-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  btn.classList.add("active");
  applyVersionUi(v);
  if (cp) renderCfg(cp);
}

function setIntensity(level) {
  inten = level;
  var map = { low: "al", medium: "am", high: "ah" };
  ["low", "medium", "high"].forEach(function (l) {
    var b = document.getElementById("i" + l.slice(0, 3));
    b.className = "int-b";
    if (l === level) b.classList.add(map[l]);
  });
  document.getElementById("modeLabel").textContent = level.toUpperCase();
  if (cp) generate();
}

function feedback(ok) {
  if (ok) {
    addLog("✓ Конфигурация подтверждена!", "ok");
    iter = 0;
  } else {
    iter++;
    generate();
    addLog(
      iter > 3
        ? "✗ Попытка " + iter + ": HIGH режим, максимальная обфускация..."
        : "✗ Попытка " + iter + ": перегенерация, усиленные параметры",
      "bad",
    );
  }
  updateIter();
}

function updateIter() {
  document.getElementById("iterCount").textContent = iter;
  for (var d = 0; d < 5; d++) {
    var dot = document.getElementById("d" + d);
    dot.className = "idot";
    if (d < iter) dot.classList.add(iter > 3 ? "fh" : "fi");
  }
}

function addLog(msg, type) {
  var log = document.getElementById("statusLog");
  var e = document.createElement("div");
  e.className = "logent log-" + type;
  e.textContent = msg;
  log.insertBefore(e, log.firstChild);
  while (log.children.length > 4) log.removeChild(log.lastChild);
}

function copyConfig() {
  if (!cp) {
    addLog("⚠ Сначала сгенерируйте конфиг", "bad");
    return;
  }
  var text = getPlain(cp);
  var btn = document.getElementById("copyBtn");

  function done() {
    btn.textContent = "✓ Скопировано!";
    btn.classList.add("copied");
    setTimeout(function () {
      btn.textContent = "📋 Копировать";
      btn.classList.remove("copied");
    }, 2000);
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(done).catch(fb);
  } else {
    fb();
  }

  function fb() {
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    done();
  }
}

function downloadConfig() {
  if (!cp) {
    addLog("⚠ Сначала сгенерируйте конфиг", "bad");
    return;
  }
  var blob = new Blob([getPlain(cp)], { type: "text/plain" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "amneziawg-" + ver + "-" + Date.now() + ".conf";
  a.click();
  URL.revokeObjectURL(url);
}

function toggleFaq(head) {
  var card = head.parentElement;
  var body = card.querySelector(".fbody");
  if (!body) return;
  var isOpen = card.classList.contains("open");

  if (isOpen) {
    // Закрываем: фиксируем текущую высоту, убираем open (CSS перейдёт к padding: 0 20px),
    // затем форс-рефлоу и анимируем max-height до 0
    body.style.maxHeight = body.scrollHeight + "px";
    body.offsetHeight; // force reflow
    card.classList.remove("open");
    // Ещё один рефлоу чтобы CSS успел применить стили без open
    body.offsetHeight; // force reflow
    body.style.maxHeight = "0";
    // После окончания анимации сбрасываем инлайн-стиль
    body.addEventListener("transitionend", function onClose(e) {
      if (e.propertyName === "max-height") {
        body.style.maxHeight = "";
        body.removeEventListener("transitionend", onClose);
      }
    });
  } else {
    // Открываем: добавляем open (CSS применит padding-bottom: 20px),
    // затем устанавливаем max-height по реальной высоте контента
    card.classList.add("open");
    body.style.maxHeight = body.scrollHeight + "px";
    // После завершения анимации снимаем жёсткий лимит высоты
    body.addEventListener("transitionend", function onOpen(e) {
      if (e.propertyName === "max-height") {
        body.style.maxHeight = "9999px";
        body.removeEventListener("transitionend", onOpen);
      }
    });
  }
}

/* ── Initialisation ──────────────────────────────────────────────────────── */

window.addEventListener("DOMContentLoaded", function () {
  // Инициализация иконок Lucide
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Начальное состояние подсказки по хосту
  var wrap = document.getElementById("customHostWrap");
  var hint = document.getElementById("customHostHint");
  var input = document.getElementById("customHost");
  if (wrap) wrap.classList.add("show");
  if (hint)
    hint.textContent =
      "QUIC-capable: fastly.net, cdn-apple.com, yastatic.net …";
  if (input) input.placeholder = "Хост с QUIC (напр., fastly.net)";

  // Патчим window.generate и window.renderCfg для перезапуска Lucide
  // после динамического добавления иконок в DOM
  var _generate = generate;
  window.generate = function () {
    _generate();
    if (typeof lucide !== "undefined") setTimeout(lucide.createIcons, 50);
  };

  var _renderCfg = renderCfg;
  window.renderCfg = function (p) {
    _renderCfg(p);
    if (typeof lucide !== "undefined") setTimeout(lucide.createIcons, 50);
  };

  // Применяем начальное состояние UI для текущей версии (2.0 по умолчанию)
  applyVersionUi(ver);

  // Первая генерация при загрузке страницы
  generate();
});
