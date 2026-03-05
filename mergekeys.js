/**
 * AmneziaWG Architect — MergeKeys (mergekeys.js)
 *
 * Браузерный порт алгоритма encode/decode из test_py.py.
 * Использует pako (zlib для браузера) для сжатия/распаковки.
 *
 * Формат vpn://:
 *   base64url( 4-байтный big-endian заголовок с длиной оригинала + zlib(JSON) )
 *
 * ── Что меняем в AWG-ключе ────────────────────────────────────────────────
 *
 * ТОЛЬКО клиентские параметры обфускации:
 *   Jc, Jmin, Jmax  — Junk-train (работа туннеля)
 *   I1–I5           — CPS цепочка (AWG 1.5 / 2.0)
 *
 * НЕ трогаем серверные параметры (иначе соединение не пройдёт):
 *   H1–H4           — идентификаторы типов пакетов (должны совпадать на сервере)
 *   S1–S4           — размеры префиксов (должны совпадать на сервере)
 *   PrivateKey, PublicKey, PresharedKey, Endpoint, Address, DNS, Port — очевидно
 *
 * ── Container Merge ───────────────────────────────────────────────────────
 *
 * Принимает несколько vpn:// ключей, объединяет все containers[] в один
 * мастер-ключ. Это позволяет использовать AWG + XRay (или любые другие
 * протоколы Amnezia) из одного ключа.
 *
 * Публичные функции (вызываются из mergekeys.html):
 *   mergeApplyObf()     — обновляет Jc/Jmin/Jmax/I1-I5 в ключе #mkInput
 *   mergeContainers()   — объединяет контейнеры из нескольких ключей
 *   mkDecodeOnly(id)    — просмотр JSON содержимого ключа
 *   mkCopyResult(id)    — копирование результата
 *   mkDownloadResult()  — скачивание JSON
 *   vpnDecode(str)      — публичный декодер (используется в mergekeys.html)
 *   vpnEncode(obj)      — публичный энкодер
 */

/* ── vpn:// codec ─────────────────────────────────────────────────────────── */

/**
 * vpnDecode(str) — декодирует строку vpn://... в JS-объект.
 * Точный порт decode_config() из test_py.py.
 */
function vpnDecode(str) {
  if (typeof pako === "undefined") {
    throw new Error("pako не загружен. Проверьте подключение к интернету.");
  }

  var encoded = str.trim();
  if (encoded.startsWith("vpn://")) encoded = encoded.slice(6);

  // Восстанавливаем base64url-паддинг
  var pad = (4 - (encoded.length % 4)) % 4;
  encoded += "=".repeat(pad);

  // base64url → Uint8Array (-→+, _→/)
  var b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  var binary = atob(b64);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  // Пробуем zlib-распаковку (как в test_py.py)
  try {
    var originalLen =
      (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
    var compressed = bytes.slice(4);
    var decompressed = pako.inflate(compressed);

    if (decompressed.length !== originalLen) {
      throw new Error(
        "Длина после распаковки (" +
          decompressed.length +
          ") не совпадает с заголовком (" +
          originalLen +
          ")",
      );
    }

    return JSON.parse(new TextDecoder("utf-8").decode(decompressed));
  } catch (zlibErr) {
    // Fallback: данные не сжаты — просто base64-encoded JSON (старый формат)
    try {
      return JSON.parse(new TextDecoder("utf-8").decode(bytes));
    } catch (e) {
      throw new Error("Не удалось декодировать ключ: " + zlibErr.message);
    }
  }
}

/**
 * vpnEncode(obj) — кодирует JS-объект в строку vpn://...
 * Точный порт encode_config() из test_py.py.
 */
function vpnEncode(obj) {
  if (typeof pako === "undefined") {
    throw new Error("pako не загружен. Проверьте подключение к интернету.");
  }

  var jsonStr = JSON.stringify(obj, null, 4);
  var jsonBytes = new TextEncoder().encode(jsonStr);
  var compressed = pako.deflate(jsonBytes);

  // 4-байтный big-endian заголовок с длиной оригинала
  var originalLen = jsonBytes.length;
  var combined = new Uint8Array(4 + compressed.length);
  combined[0] = (originalLen >>> 24) & 0xff;
  combined[1] = (originalLen >>> 16) & 0xff;
  combined[2] = (originalLen >>> 8) & 0xff;
  combined[3] = originalLen & 0xff;
  combined.set(compressed, 4);

  // binary → base64url (без паддинга =)
  var binary = "";
  for (var i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  var b64url = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return "vpn://" + b64url;
}

/* ── AWG obfuscation patch ────────────────────────────────────────────────── */

/**
 * AWG_CLIENT_FIELDS — ТОЛЬКО клиентские поля, которые безопасно обновлять.
 * H1–H4 и S1–S4 — серверные, их менять нельзя без пересинхронизации сервера.
 */
var AWG_CLIENT_FIELDS_BASE = ["Jc", "Jmin", "Jmax"];
var AWG_CLIENT_FIELDS_CPS = ["I1", "I2", "I3", "I4", "I5"];

/**
 * getClientFields(awgVer) — поля для обновления в зависимости от версии AWG.
 * awgVer: "1" (AWG 1.0) | "2" (AWG 1.5/2.0)
 */
function getClientFields(awgVer) {
  if (awgVer === "1") return AWG_CLIENT_FIELDS_BASE.slice();
  return AWG_CLIENT_FIELDS_BASE.concat(AWG_CLIENT_FIELDS_CPS);
}

/**
 * buildObfuscationPatch(p, selectedVer) — строит объект с новыми значениями
 * клиентских параметров обфускации из объекта p (результат genCfg()).
 *
 * selectedVer — выбранная версия AWG в генераторе ("1.0" | "1.5" | "2.0"),
 * но в ключе Amnezia protocol_version = "1" или "2".
 */
function buildObfuscationPatch(p, selectedVer) {
  if (!p) {
    throw new Error(
      "Конфиг не сгенерирован. Вернитесь на главную и нажмите «СГЕНЕРИРОВАТЬ».",
    );
  }

  var patch = {
    Jc: String(p.jc),
    Jmin: String(p.jmin),
    Jmax: String(p.jmax),
  };

  // I1-I5 только если версия поддерживает CPS
  if (selectedVer !== "1.0") {
    patch.I1 = String(p.i1);
    patch.I2 = String(p.i2);
    patch.I3 = String(p.i3);
    patch.I4 = String(p.i4);
    patch.I5 = String(p.i5);
  }

  return patch;
}

/**
 * patchWgQuickString(str, field, value) — заменяет значение поля в строке
 * формата wg-quick ("Field = Value\n").
 * Безопасна для многострочных строк с < > и другими спецсимволами.
 */
function patchWgQuickString(str, field, value) {
  // Ищем строку вида "Field = anything до конца строки"
  var re = new RegExp(
    "^(" + escapeRegExp(field) + "[ \\t]*=[ \\t]*)(.*)$",
    "m",
  );
  if (re.test(str)) {
    return str.replace(re, "$1" + value);
  }
  // Поля нет — добавляем в конец секции [Interface], если она есть
  if (str.includes("[Interface]")) {
    return str.replace(/(\[Interface\][^\[]*)/, function (m) {
      return m.trimEnd() + "\n" + field + " = " + value + "\n";
    });
  }
  return str + "\n" + field + " = " + value;
}

/**
 * patchJsonString(jsonStr, field, value) — заменяет значение поля в JSON-строке.
 * Используется для awg.last_config (это JSON внутри JSON).
 */
function patchJsonString(jsonStr, field, value) {
  try {
    var obj = JSON.parse(jsonStr);
    if (field in obj) {
      obj[field] = value;
      return JSON.stringify(obj, null, 4) + "\n";
    }
    return jsonStr;
  } catch (e) {
    // Если не парсится — regex-замена как wg-quick
    return patchWgQuickString(jsonStr, field, value);
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * applyObfPatchToAwg(awg, patch) — применяет патч к объекту awg-контейнера.
 * Обновляет:
 *   1. Поля верхнего уровня awg (awg.Jc, awg.I1, ...)
 *   2. awg.last_config (JSON-строка)
 *   3. awg.config (wg-quick строка)
 *
 * Возвращает список изменённых полей.
 */
function applyObfPatchToAwg(awg, patch) {
  var changed = [];
  var fields = Object.keys(patch);

  fields.forEach(function (field) {
    var newVal = patch[field];
    var oldVal = awg[field];

    // 1. Верхний уровень
    if (
      awg[field] !== undefined ||
      AWG_CLIENT_FIELDS_CPS.indexOf(field) !== -1
    ) {
      awg[field] = newVal;
      if (oldVal !== newVal) changed.push(field);
    }

    // 2. last_config
    if (awg.last_config && typeof awg.last_config === "string") {
      awg.last_config = patchJsonString(awg.last_config, field, newVal);
    }

    // 3. config (wg-quick)
    if (awg.config && typeof awg.config === "string") {
      awg.config = patchWgQuickString(awg.config, field, newVal);
    }
  });

  return changed;
}

/**
 * applyPatchToVpnConfig(cfg, patch) — применяет патч ко всем AWG-контейнерам
 * в объекте конфигурации vpn://.
 * Возвращает { updated: cfg, changed: string[], containerCount: number }
 */
function applyPatchToVpnConfig(cfg, patch) {
  var containers = cfg.containers || [];
  var awgContainers = containers.filter(function (c) {
    return c.awg != null;
  });

  if (awgContainers.length === 0) {
    throw new Error(
      "В ключе не найдено ни одного AWG-контейнера. " +
        "Этот инструмент работает только с AmneziaWG-ключами.",
    );
  }

  var allChanged = [];
  awgContainers.forEach(function (c) {
    var ch = applyObfPatchToAwg(c.awg, patch);
    ch.forEach(function (f) {
      if (allChanged.indexOf(f) === -1) allChanged.push(f);
    });
  });

  return {
    updated: cfg,
    changed: allChanged,
    containerCount: awgContainers.length,
  };
}

/* ── Container Merge ─────────────────────────────────────────────────────── */

/**
 * mergeVpnConfigs(configs) — объединяет массив декодированных vpn-объектов
 * в один мастер-конфиг.
 *
 * Стратегия:
 *   - containers[]: объединяем все, дедупликация по container-имени
 *     (если два ключа имеют одинаковый container — берём первый, предупреждаем)
 *   - defaultContainer: из первого ключа
 *   - description: объединяем через " + "
 *   - dns1/dns2: из первого ключа (или первого у кого есть)
 *   - hostName: из первого ключа
 *   - nameOverriddenByUser: true
 *
 * Возвращает { merged: obj, warnings: string[], stats: {total, unique, dupes} }
 */
function mergeVpnConfigs(configs) {
  if (!configs || configs.length < 2) {
    throw new Error("Для объединения нужно минимум 2 ключа.");
  }

  var mergedContainers = [];
  var seenNames = {};
  var warnings = [];
  var dupes = 0;
  var total = 0;

  configs.forEach(function (cfg, cfgIdx) {
    var containers = cfg.containers || [];
    containers.forEach(function (c) {
      total++;
      var name = c.container || "unknown_" + cfgIdx + "_" + total;
      if (seenNames[name]) {
        dupes++;
        warnings.push(
          "Дубликат контейнера «" +
            name +
            "» из ключа #" +
            (cfgIdx + 1) +
            " пропущен (уже есть из ключа #" +
            seenNames[name] +
            ").",
        );
      } else {
        seenNames[name] = cfgIdx + 1;
        mergedContainers.push(c);
      }
    });
  });

  // Берём метаданные из первого ключа, description объединяем
  var first = configs[0];
  var descriptions = configs
    .map(function (c) {
      return c.description || "";
    })
    .filter(function (d) {
      return d.length > 0;
    });
  var uniqueDescriptions = descriptions.filter(function (d, i) {
    return descriptions.indexOf(d) === i;
  });

  var merged = {
    containers: mergedContainers,
    defaultContainer:
      first.defaultContainer ||
      (mergedContainers[0] && mergedContainers[0].container) ||
      "",
    description: uniqueDescriptions.join(" + ") || "Merged",
    dns1:
      first.dns1 ||
      configs.find(function (c) {
        return c.dns1;
      })?.dns1 ||
      "",
    dns2:
      first.dns2 ||
      configs.find(function (c) {
        return c.dns2;
      })?.dns2 ||
      "",
    hostName: first.hostName || "",
    nameOverriddenByUser: true,
  };

  return {
    merged: merged,
    warnings: warnings,
    stats: { total: total, unique: mergedContainers.length, dupes: dupes },
  };
}

/* ── Page state ──────────────────────────────────────────────────────────── */

// Хранит загруженные ключи для режима объединения контейнеров
var mkMergeSlots = [null, null]; // до 4 слотов
var mkLastResult = null; // последний vpn:// результат

// Данные из генератора (переданы через sessionStorage)
var mkPendingCfg = null;
var mkPendingVer = "2.0";

/**
 * mkInit() — инициализация страницы mergekeys.html.
 * Вызывается из DOMContentLoaded.
 */
function mkInit() {
  // Загружаем pending cfg из sessionStorage если есть
  try {
    var raw = sessionStorage.getItem("awg_pending_cfg");
    if (raw) {
      var parsed = JSON.parse(raw);
      mkPendingCfg = parsed.cfg || null;
      mkPendingVer = parsed.ver || "2.0";
      sessionStorage.removeItem("awg_pending_cfg");
    }
  } catch (e) {
    /* ignore */
  }

  // Обновляем информационный баннер
  var banner = document.getElementById("mkPendingBanner");
  var bannerText = document.getElementById("mkPendingText");
  var noCfgNotice = document.getElementById("mkNoCfgNotice");
  if (mkPendingCfg) {
    if (banner) banner.style.display = "flex";
    if (noCfgNotice) noCfgNotice.style.display = "none";
    if (bannerText) {
      bannerText.textContent =
        " Загружен конфиг AWG " +
        mkPendingVer +
        " (Jc=" +
        mkPendingCfg.jc +
        ", Jmin=" +
        mkPendingCfg.jmin +
        ", Jmax=" +
        mkPendingCfg.jmax +
        ")." +
        (mkPendingVer !== "1.0"
          ? " CPS I1–I5 готовы к вставке."
          : " AWG 1.0: только Jc/Jmin/Jmax.");
    }
  } else {
    if (banner) banner.style.display = "none";
    if (noCfgNotice) noCfgNotice.style.display = "flex";
  }

  // Инициализируем слоты объединения
  mkRenderMergeSlots();

  // Читаем ?tab= из URL и переключаемся на нужную вкладку
  try {
    var urlParams = new URLSearchParams(window.location.search);
    var tabParam = urlParams.get("tab");
    if (tabParam === "merge" || tabParam === "update") {
      mkSwitchTab(tabParam);
    }
  } catch (e) {
    /* ignore — старые браузеры без URLSearchParams */
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
}

/* ── Tab switching ───────────────────────────────────────────────────────── */

/**
 * mkSwitchTab(tab) — переключает вкладки "Обновить обфускацию" / "Объединить ключи"
 */
function mkSwitchTab(tab) {
  var tabs = ["update", "merge"];
  tabs.forEach(function (t) {
    var btn = document.getElementById("mkTab_" + t);
    var pane = document.getElementById("mkPane_" + t);
    if (btn) {
      btn.classList.toggle("active", t === tab);
      // support both old .tab-btn and new .mk-tab-btn
      btn.classList.toggle("active", t === tab);
    }
    if (pane) {
      // support both inline display and CSS class "visible"
      if (t === tab) {
        pane.style.display = "";
        pane.classList.add("visible");
      } else {
        pane.style.display = "none";
        pane.classList.remove("visible");
      }
    }
  });
  if (typeof lucide !== "undefined") setTimeout(lucide.createIcons, 50);
}

/* ── Tab 1: Update obfuscation ───────────────────────────────────────────── */

/**
 * mergeApplyObf() — обновляет Jc/Jmin/Jmax/I1-I5 в ключе из #mkSingleInput.
 * Использует mkPendingCfg (из генератора) или показывает ошибку.
 */
function mergeApplyObf() {
  mkClearSingleResult();

  var input = document.getElementById("mkSingleInput");
  var val = input ? input.value.trim() : "";

  if (!val) {
    mkShowSingleError("Вставьте ваш vpn://-ключ в поле выше.");
    return;
  }

  if (!mkPendingCfg) {
    mkShowSingleError(
      "Нет сгенерированного конфига. Вернитесь на главную страницу, " +
        "нажмите «СГЕНЕРИРОВАТЬ» а затем «Открыть MergeKeys».",
    );
    return;
  }

  try {
    var decoded = vpnDecode(val);
    var patch = buildObfuscationPatch(mkPendingCfg, mkPendingVer);
    var result = applyPatchToVpnConfig(decoded, patch);
    var newKey = vpnEncode(result.updated);

    mkLastResult = newKey;

    var out = document.getElementById("mkSingleOutput");
    if (out) out.value = newKey;

    var summary = document.getElementById("mkSingleSummary");
    if (summary) {
      summary.textContent =
        "Обновлено: " +
        result.changed.join(", ") +
        " (в " +
        result.containerCount +
        " AWG-контейнере(ах)).";
    }

    mkShowSingleOk();

    if (typeof lucide !== "undefined") setTimeout(lucide.createIcons, 50);
  } catch (err) {
    mkShowSingleError(err.message || String(err));
  }
}

/**
 * mkSingleDecodeOnly() — только просмотр JSON ключа без изменений.
 */
function mkSingleDecodeOnly() {
  mkClearSingleResult();
  var input = document.getElementById("mkSingleInput");
  var val = input ? input.value.trim() : "";
  if (!val) {
    mkShowSingleError("Вставьте vpn://-ключ.");
    return;
  }
  try {
    var decoded = vpnDecode(val);
    var pre = document.getElementById("mkSinglePreviewCode");
    if (pre) pre.textContent = JSON.stringify(decoded, null, 2);
    mkShowSinglePreview();
    if (typeof lucide !== "undefined") setTimeout(lucide.createIcons, 50);
  } catch (err) {
    mkShowSingleError(err.message || String(err));
  }
}

function mkSingleClear() {
  var inp = document.getElementById("mkSingleInput");
  if (inp) inp.value = "";
  mkClearSingleResult();
}

/* ── Tab 2: Merge containers ─────────────────────────────────────────────── */

var MK_MAX_SLOTS = 4;

/**
 * mkRenderMergeSlots() — рендерит динамические слоты ввода ключей.
 */
function mkRenderMergeSlots() {
  var container = document.getElementById("mkMergeSlots");
  if (!container) return;

  // Убеждаемся что слотов достаточно
  while (mkMergeSlots.length < 2) mkMergeSlots.push(null);

  container.innerHTML = "";
  mkMergeSlots.forEach(function (_, idx) {
    var div = document.createElement("div");
    div.className = "mk-slot";
    div.id = "mkSlot_" + idx;
    div.innerHTML = mkSlotHTML(idx);
    container.appendChild(div);
  });

  if (typeof lucide !== "undefined") setTimeout(lucide.createIcons, 30);
}

function mkSlotHTML(idx) {
  var isLast = idx === mkMergeSlots.length - 1;
  var canRemove = mkMergeSlots.length > 2 && isLast;
  var labels = ["Первый ключ", "Второй ключ", "Третий ключ", "Четвёртый ключ"];
  var label = labels[idx] || "Ключ #" + (idx + 1);
  var numBadge =
    '<span style="' +
    "display:inline-flex;align-items:center;justify-content:center;" +
    "width:18px;height:18px;border-radius:50%;" +
    "background:rgba(232,168,64,0.12);border:1px solid rgba(232,168,64,0.25);" +
    "font-size:0.6rem;font-weight:700;color:var(--amber2);flex-shrink:0" +
    '">' +
    (idx + 1) +
    "</span>";

  return (
    '<div class="mk-slot-head">' +
    numBadge +
    '<span class="mk-slot-label">' +
    '<i data-lucide="key" style="width:11px;height:11px"></i>' +
    label +
    ' <span style="color:var(--text3);font-weight:400;text-transform:none">(vpn://...)</span>' +
    "</span>" +
    (canRemove
      ? '<button class="mk-btn-icon" title="Удалить слот" onclick="mkRemoveSlot(' +
        idx +
        ')" style="width:26px;height:26px;border-radius:6px">' +
        '<i data-lucide="x" style="width:11px;height:11px"></i></button>'
      : "") +
    "</div>" +
    '<div class="mk-slot-row">' +
    '<textarea id="mkMergeInput_' +
    idx +
    '" class="mk-ta" rows="3" ' +
    'placeholder="vpn://AAAGX..." ' +
    'oninput="mkClearMergeResult()">' +
    "</textarea>" +
    '<div class="mk-slot-btns">' +
    '<button class="mk-btn-icon" title="Просмотр JSON" onclick="mkMergeDecodeSlot(' +
    idx +
    ')">' +
    '<i data-lucide="eye" style="width:13px;height:13px"></i>' +
    "</button>" +
    '<button class="mk-btn-icon" title="Очистить" onclick="mkClearSlot(' +
    idx +
    ')" style="background:rgba(212,96,74,0.08);border-color:rgba(212,96,74,0.2);color:var(--red)">' +
    '<i data-lucide="x" style="width:13px;height:13px"></i>' +
    "</button>" +
    "</div>" +
    "</div>"
  );
}

function mkAddSlot() {
  if (mkMergeSlots.length >= MK_MAX_SLOTS) return;
  var saved = mkCollectSlotValuesAll();
  mkMergeSlots.push(null);
  mkRenderMergeSlots();
  mkRestoreSlotValues(saved);
  mkUpdateAddSlotBtn();
}

function mkRemoveSlot(idx) {
  if (mkMergeSlots.length <= 2) return;
  var saved = mkCollectSlotValuesAll();
  mkMergeSlots.splice(idx, 1);
  mkRenderMergeSlots();
  // Сдвигаем сохранённые значения: удаляем запись с idx, остальные переиндексируем
  var shifted = saved
    .filter(function (s) {
      return s.idx !== idx;
    })
    .map(function (s) {
      return { idx: s.idx > idx ? s.idx - 1 : s.idx, val: s.val };
    });
  mkRestoreSlotValues(shifted);
  mkUpdateAddSlotBtn();
}

/**
 * mkUpdateAddSlotBtn() — скрывает кнопку "Добавить" если достигнут лимит.
 */
function mkUpdateAddSlotBtn() {
  var btn = document.getElementById("mkAddSlotBtn");
  if (btn)
    btn.style.display = mkMergeSlots.length >= MK_MAX_SLOTS ? "none" : "";
}

function mkClearSlot(idx) {
  var ta = document.getElementById("mkMergeInput_" + idx);
  if (ta) ta.value = "";
  mkClearMergeResult();
}

/**
 * mkRestoreSlotValues(saved) — восстанавливает значения textarea после перерендера.
 * saved — массив { idx, val } от mkCollectSlotValues().
 */
function mkRestoreSlotValues(saved) {
  if (!saved) return;
  saved.forEach(function (s) {
    var ta = document.getElementById("mkMergeInput_" + s.idx);
    if (ta) ta.value = s.val;
  });
}

/**
 * mkCollectSlotValues() — считывает ВСЕ значения из слотов (включая пустые с непустыми).
 * Возвращает массив { idx, val } для всех слотов у которых есть значение.
 */
function mkCollectSlotValues() {
  var values = [];
  for (var i = 0; i < mkMergeSlots.length; i++) {
    var ta = document.getElementById("mkMergeInput_" + i);
    if (ta && ta.value.trim()) values.push({ idx: i, val: ta.value.trim() });
  }
  return values;
}

/**
 * mkCollectSlotValuesAll() — считывает все значения (включая пустые) для сохранения при ре-рендере.
 */
function mkCollectSlotValuesAll() {
  var values = [];
  for (var i = 0; i < mkMergeSlots.length; i++) {
    var ta = document.getElementById("mkMergeInput_" + i);
    values.push({ idx: i, val: ta ? ta.value : "" });
  }
  return values;
}

/**
 * mergeContainers() — объединяет контейнеры из всех заполненных слотов.
 * Если в первом ключе есть AWG — также применяет обновление обфускации.
 */
function mergeContainers() {
  mkClearMergeResult();

  var slots = mkCollectSlotValues();
  if (slots.length < 2) {
    mkShowMergeError("Заполните минимум 2 поля с ключами vpn://.");
    return;
  }

  try {
    // Декодируем все ключи
    var decoded = slots.map(function (s) {
      try {
        return { idx: s.idx, cfg: vpnDecode(s.val) };
      } catch (e) {
        throw new Error("Ошибка в ключе #" + (s.idx + 1) + ": " + e.message);
      }
    });

    // Объединяем контейнеры
    var configs = decoded.map(function (d) {
      return d.cfg;
    });
    var mergeResult = mergeVpnConfigs(configs);

    // Если есть pending cfg — применяем обновление обфускации к AWG-контейнерам
    var obfChanged = [];
    if (mkPendingCfg) {
      try {
        var patch = buildObfuscationPatch(mkPendingCfg, mkPendingVer);
        var obfResult = applyPatchToVpnConfig(mergeResult.merged, patch);
        mergeResult.merged = obfResult.updated;
        obfChanged = obfResult.changed;
      } catch (e) {
        // Нет AWG контейнеров — это нормально для merge без AWG
      }
    }

    // Кодируем результат
    var newKey = vpnEncode(mergeResult.merged);
    mkLastResult = newKey;

    var out = document.getElementById("mkMergeOutput");
    if (out) out.value = newKey;

    // Формируем сводку
    var lines = [];
    lines.push(
      "Объединено " +
        mergeResult.stats.unique +
        " контейнеров из " +
        slots.length +
        " ключей.",
    );
    if (mergeResult.stats.dupes > 0) {
      lines.push("Пропущено дублей: " + mergeResult.stats.dupes + ".");
    }
    if (obfChanged.length > 0) {
      lines.push("Обфускация AWG обновлена: " + obfChanged.join(", ") + ".");
    }

    var summary = document.getElementById("mkMergeSummary");
    if (summary) summary.textContent = lines.join(" ");

    // Предупреждения
    var warnEl = document.getElementById("mkMergeWarnings");
    if (warnEl) {
      if (mergeResult.warnings.length > 0) {
        warnEl.style.display = "block";
        warnEl.innerHTML = mergeResult.warnings
          .map(function (w) {
            return (
              '<div style="margin-bottom:4px">⚠ ' + escapeHtml(w) + "</div>"
            );
          })
          .join("");
      } else {
        warnEl.style.display = "none";
        warnEl.innerHTML = "";
      }
    }

    mkShowMergeOk();
    if (typeof lucide !== "undefined") setTimeout(lucide.createIcons, 50);
  } catch (err) {
    mkShowMergeError(err.message || String(err));
  }
}

/**
 * mkMergeDecodeSlot(idx) — показывает JSON ключа из слота для просмотра.
 */
function mkMergeDecodeSlot(idx) {
  var ta = document.getElementById("mkMergeInput_" + idx);
  if (!ta || !ta.value.trim()) {
    mkShowMergeError("Слот #" + (idx + 1) + " пуст.");
    return;
  }
  try {
    var decoded = vpnDecode(ta.value.trim());
    var pre = document.getElementById("mkMergePreviewCode");
    var label = document.getElementById("mkMergePreviewLabel");
    if (pre) pre.textContent = JSON.stringify(decoded, null, 2);
    if (label) label.textContent = "Содержимое ключа #" + (idx + 1);
    mkShowMergePreview();
    if (typeof lucide !== "undefined") setTimeout(lucide.createIcons, 50);
  } catch (err) {
    mkShowMergeError("Ошибка в ключе #" + (idx + 1) + ": " + err.message);
  }
}

/* ── Shared copy/download ─────────────────────────────────────────────────── */

function mkCopyResult(btnId, sourceId) {
  var src = document.getElementById(sourceId);
  var btn = document.getElementById(btnId);
  if (!src || !src.value) return;

  function done() {
    if (btn) {
      var orig = btn.innerHTML;
      btn.textContent = "✓ Скопировано!";
      btn.classList.add("copied");
      setTimeout(function () {
        btn.innerHTML = orig;
        btn.classList.remove("copied");
        if (typeof lucide !== "undefined") lucide.createIcons();
      }, 2000);
    }
  }

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(src.value)
      .then(done)
      .catch(function () {
        mkFallbackCopy(src.value, done);
      });
  } else {
    mkFallbackCopy(src.value, done);
  }
}

function mkFallbackCopy(text, callback) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  if (callback) callback();
}

function mkDownloadResult(sourceId) {
  var src = document.getElementById(sourceId);
  if (!src || !src.value) return;
  try {
    var decoded = vpnDecode(src.value);
    var json = JSON.stringify(decoded, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "amnezia-merged-" + Date.now() + ".json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    // Если не парсится — скачиваем как есть
    var blob2 = new Blob([src.value], { type: "text/plain" });
    var url2 = URL.createObjectURL(blob2);
    var a2 = document.createElement("a");
    a2.href = url2;
    a2.download = "amnezia-key-" + Date.now() + ".txt";
    a2.click();
    URL.revokeObjectURL(url2);
  }
}

/* ── UI state helpers ─────────────────────────────────────────────────────── */

// ── Single tab ──
function mkClearSingleResult() {
  var rb = document.getElementById("mkSingleResultBlock");
  if (rb) rb.style.display = "none";
  ["mkSingleOk", "mkSingleError", "mkSinglePreview"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}
function mkShowSingleError(msg) {
  var rb = document.getElementById("mkSingleResultBlock");
  var eb = document.getElementById("mkSingleError");
  var et = document.getElementById("mkSingleErrorText");
  if (rb) rb.style.display = "flex";
  if (eb) eb.style.display = "flex";
  if (et) et.textContent = msg;
}
function mkShowSingleOk() {
  var rb = document.getElementById("mkSingleResultBlock");
  var ok = document.getElementById("mkSingleOk");
  if (rb) rb.style.display = "flex";
  if (ok) ok.style.display = "flex";
}
function mkShowSinglePreview() {
  var rb = document.getElementById("mkSingleResultBlock");
  var pv = document.getElementById("mkSinglePreview");
  if (rb) rb.style.display = "flex";
  if (pv) pv.style.display = "flex";
}

// ── Merge tab ──
function mkClearMergeResult() {
  var rb = document.getElementById("mkMergeResultBlock");
  if (rb) rb.style.display = "none";
  [
    "mkMergeOk",
    "mkMergeError",
    "mkMergeWarnings",
    "mkMergePreviewBlock",
  ].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}
function mkShowMergeError(msg) {
  var rb = document.getElementById("mkMergeResultBlock");
  var eb = document.getElementById("mkMergeError");
  var et = document.getElementById("mkMergeErrorText");
  if (rb) rb.style.display = "flex";
  if (eb) eb.style.display = "flex";
  if (et) et.textContent = msg;
}
function mkShowMergeOk() {
  var rb = document.getElementById("mkMergeResultBlock");
  var ok = document.getElementById("mkMergeOk");
  if (rb) rb.style.display = "flex";
  if (ok) ok.style.display = "flex";
}
function mkShowMergePreview() {
  var rb = document.getElementById("mkMergeResultBlock");
  var pv = document.getElementById("mkMergePreviewBlock");
  if (rb) rb.style.display = "flex";
  if (pv) pv.style.display = "flex";
}

/* ── Misc helpers ─────────────────────────────────────────────────────────── */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
