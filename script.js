var ver = "2.0",
  inten = "medium",
  iter = 0,
  cp = null;

var hostPools = {
  quic_initial: [
    "yandex.net","yastatic.net","s3.yandex.net","storage.yandexcloud.net",
    "cloud.yandex.ru","dzen.ru","music.yandex.ru","vk.com","mycdn.me",
    "vk-cdn.net","userapi.com","ok.ru","mail.ru","imgsmail.ru","cdn.mail.ru",
    "avito.ru","ozon.ru","cdn1.ozone.ru","wildberries.ru","wbstatic.net",
    "kinopoisk.ru","ivi.ru","rutube.ru","rt.ru","sber.ru","sberbank.ru",
    "sbp.ru","tbank.ru","raiffeisen.ru","vtb.ru","alfabank.ru","kaspersky.ru",
    "kaspersky.com","drweb.ru","selectel.ru","selectel.com","timeweb.cloud",
    "timeweb.com","reg.ru","beget.com","mchost.ru","nic.ru","dataline.ru",
    "mts.ru","beeline.ru","megafon.ru","rostelecom.ru",
    "gcore.com","api.gcore.com","cdn.gcore.com","g.gcdn.co",
    "bunny.net","b-cdn.net","storage.bunnycdn.com","cdn77.com","rsc.cdn77.org",
    "fastly.net","a.ssl.fastly.net","global.fastly.net","fastlylabs.com",
    "a248.e.akamai.net","akamaiedge.net","akamaihd.net","akamaistream.net","edgekey.net",
    "cloudfront.net","d1.awsstatic.com","d2.awsstatic.com","s3.amazonaws.com",
    "msedge.net","cdn.office.net","azureedge.net","live.com","outlook.com",
    "office.com","microsoft.com","xbox.com","xboxlive.com","onedrive.live.com",
    "icloud.com","cdn-apple.com","mzstatic.com","apple.com","appleid.apple.com",
    "github.com","objects.githubusercontent.com","raw.githubusercontent.com",
    "codeload.github.com","github.githubassets.com","avatars.githubusercontent.com",
    "gitlab.com","cdn.jsdelivr.net","unpkg.com","registry.npmjs.org",
    "pypi.org","files.pythonhosted.org","archive.ubuntu.com","security.ubuntu.com",
    "packages.ubuntu.com","deb.debian.org","ftp.debian.org",
    "steamstatic.com","steamcontent.com","steampowered.com","steamcdn-a.akamaihd.net",
    "spotify.com","scdn.co","heads-ak.spotify.com","jtvnw.net","twitchsvc.net",
    "wikipedia.org","upload.wikimedia.org","wikimedia.org","wikidata.org",
    "hetzner.com","hetzner.de","hetzner.cloud","your-server.de",
    "ovhcloud.com","ovh.net","ovh.com",
    "tencentcs.com","tencent.com","myqcloud.com","qpic.cn",
    "alicdn.com","aliyuncs.com","alibabacloud.com","taobao.com",
    "huaweicloud.com","hwcdn.net",
    "dropbox.com","dropboxstatic.com","epicgames.com","ea.com",
    "battle.net","blizzard.com","ubisoft.com",
  ],
  quic_0rtt: [
    "yandex.net","yastatic.net","storage.yandexcloud.net","vk.com","mycdn.me",
    "vk-cdn.net","mail.ru","ozon.ru","avito.ru","wildberries.ru","wbstatic.net",
    "kinopoisk.ru","sber.ru","kaspersky.com","selectel.ru","timeweb.cloud",
    "gcore.com","cdn.gcore.com","g.gcdn.co","bunny.net","b-cdn.net",
    "cdn77.com","fastly.net","a.ssl.fastly.net","global.fastly.net",
    "cloudfront.net","s3.amazonaws.com","d1.awsstatic.com",
    "msedge.net","cdn.office.net","live.com","office.com","xbox.com",
    "icloud.com","cdn-apple.com","mzstatic.com",
    "github.com","objects.githubusercontent.com","cdn.jsdelivr.net","unpkg.com",
    "registry.npmjs.org","archive.ubuntu.com","steamstatic.com","steamcontent.com",
    "spotify.com","scdn.co","wikipedia.org","wikimedia.org","dropbox.com","epicgames.com",
    "alicdn.com","tencentcs.com","myqcloud.com","huaweicloud.com",
  ],
  tls_client_hello: [
    "yandex.net","yandex.ru","yastatic.net","s3.yandex.net","storage.yandexcloud.net",
    "cloud.yandex.ru","dzen.ru","music.yandex.ru","vk.com","mycdn.me","vk-cdn.net",
    "userapi.com","ok.ru","mail.ru","imgsmail.ru","cdn.mail.ru","avito.ru","ozon.ru",
    "cdn1.ozone.ru","wildberries.ru","wbstatic.net","kinopoisk.ru","ivi.ru",
    "rutube.ru","premier.one","okko.tv","more.tv","rt.ru","russia.tv","1tv.ru",
    "ntv.ru","ren.tv","tvc.ru","sber.ru","sberbank.ru","sbp.ru","online.sberbank.ru",
    "tbank.ru","raiffeisen.ru","vtb.ru","vtb24.ru","alfabank.ru","gazprombank.ru",
    "sovcombank.ru","rosbank.ru","kaspersky.ru","kaspersky.com","drweb.ru","drweb.com",
    "roscosmos.ru","gosuslugi.ru","mts.ru","beeline.ru","megafon.ru","tele2.ru",
    "rostelecom.ru","selectel.ru","selectel.com","timeweb.cloud","timeweb.com",
    "reg.ru","beget.com","nic.ru","dataline.ru","mchost.ru","citilink.ru","mvideo.ru",
    "sbermegamarket.ru","lamoda.ru","eldorado.ru","detmir.ru","sportmaster.ru",
    "letoile.ru","gazeta.ru","rbc.ru","kommersant.ru","tass.ru","ria.ru","hh.ru",
    "superjob.ru","rabota.ru","rambler.ru","lenta.ru","rg.ru","2gis.ru",
    "maps.yandex.ru","mos.ru","nalog.ru","pfr.gov.ru",
    "gcore.com","api.gcore.com","cdn.gcore.com","g.gcdn.co","bunny.net","b-cdn.net",
    "storage.bunnycdn.com","cdn77.com","rsc.cdn77.org","fastly.net","a.ssl.fastly.net",
    "global.fastly.net","fastlylabs.com","a248.e.akamai.net","akam.net","akamaiedge.net",
    "akamaihd.net","akamaistream.net","edgekey.net","cloudfront.net","d1.awsstatic.com",
    "d2.awsstatic.com","s3.amazonaws.com","aws.amazon.com","msedge.net",
    "azure.microsoft.com","azureedge.net","cdn.office.net","live.com","outlook.com",
    "hotmail.com","office.com","onedrive.live.com","xbox.com","xboxlive.com",
    "microsoft.com","icloud.com","cdn-apple.com","mzstatic.com","apple.com",
    "appleid.apple.com",
    "github.com","objects.githubusercontent.com","raw.githubusercontent.com",
    "codeload.github.com","github.githubassets.com","avatars.githubusercontent.com",
    "gitlab.com","bitbucket.org","cdn.jsdelivr.net","unpkg.com","registry.npmjs.org",
    "pypi.org","files.pythonhosted.org","archive.ubuntu.com","security.ubuntu.com",
    "packages.ubuntu.com","deb.debian.org","ftp.debian.org","launchpad.net",
    "snapcraft.io","steamstatic.com","steamcontent.com","steampowered.com",
    "steamcdn-a.akamaihd.net","store.steampowered.com","epicgames.com","ea.com",
    "ubisoft.com","battle.net","blizzard.com","riotgames.com","leagueoflegends.com",
    "spotify.com","scdn.co","heads-ak.spotify.com","jtvnw.net","twitchsvc.net",
    "wikipedia.org","upload.wikimedia.org","wikimedia.org","wikidata.org",
    "commons.wikimedia.org","hetzner.com","hetzner.de","hetzner.cloud","your-server.de",
    "ovhcloud.com","ovh.net","ovh.com","gra-g1.ovh.net","dropbox.com","dropboxstatic.com",
    "dropboxapi.com","notion.so","notionusercontent.com","zoom.us","zmtr.cn",
    "tencentcs.com","tencent.com","myqcloud.com","qpic.cn","alicdn.com","aliyuncs.com",
    "alibabacloud.com","huaweicloud.com","hwcdn.net","baidu.com","bdstatic.com",
  ],
  dtls: [
    "turn.yandex.net","stun.yandex.net","stun1.yandex.net","telemost.yandex.ru",
    "turn.vk.com","stun.vk.com","stun1.vk.com","rtc.vk.com",
    "stun.mail.ru","turn.mail.ru","stun.sipnet.ru","stun.sipnet.net",
    "stun.zadarma.com","turn.zadarma.com","stun.zepter.ru","stun.mango-office.ru",
    "stun.beeline.ru","stun.mts.ru","stun.megafon.ru","stun.rostelecom.ru",
    "stun.stunprotocol.org","stun.voip.ipp2p.com","stun.voipstunt.com",
    "stun.voipbuster.com","stun.voipwise.com","stun.voiptia.net","stun.voxox.com",
    "stun.voxgratia.org","stun.voys.nl","stun.voztele.com","stun.ippi.fr",
    "stun.antisip.com","stun.freecall.com","stun.internetcalls.com",
    "stun.counterpath.com","stun.counterpath.net","stun.softjoys.com",
    "stun.sipgate.net","stun.sip.us","stun.ekiga.net","stun.ideasip.com",
    "stun.schlund.de","stun.xs4all.nl","stun.xten.com","stun.sonetel.com",
    "stun.sonetel.net","stun.rock.com","stun.ooma.com","stun.vyke.com",
    "stun.webcalldirect.com","stun.wwdl.net","stun.yesdates.com","stun.zoiper.com",
    "stun01.sipphone.com","stun1.faktortel.com.au","stun.noc.ams-ix.net",
    "stun.voipzoom.com",
    "meet.jit.si","stun.jit.si","turn.jit.si","8x8.vc",
    "stun.services.mozilla.com","turn.matrix.org","stun.matrix.org",
    "stun.nextcloud.com","turn.nextcloud.com","janus.conf.meetecho.com",
    "stun.meetecho.com",
    "global.stun.twilio.com","stun.us1.twilio.com","stun.ie1.twilio.com",
    "stun.au1.twilio.com","stun.nexmo.com","stun.vonage.com",
    "global.stun.bandwidth.com","stun.plivo.com",
    "openrelay.metered.ca","coturn.net","freestun.net","relay.webwormhole.io",
    "stun.f.haeder.net","stunserver.stunprotocol.org",
  ],
  sip: [
    "sip.beeline.ru","voip.beeline.ru","sip.mts.ru","voip.mts.ru",
    "sip.megafon.ru","voip.megafon.ru","sip.tele2.ru","voip.tele2.ru",
    "sip.rostelecom.ru","voip.rostelecom.ru","sip.mtt.ru","voip.mtt.ru",
    "sip.vk.com","sip.yandex.ru","sip.mail.ru","voip.sberbank.ru","sip.tbank.ru",
    "sip.sipnet.ru","sip.sipnet.net","sip.mango-office.ru","pbx.mango-office.ru",
    "sip.zadarma.com","pbx.zadarma.com","sip.gravitel.ru","sip.onlinepbx.ru",
    "sip.uis.ru","pbx.uis.ru","sip.comagic.ru","sip.binotel.ru","sip.novofon.ru",
    "sip.megacall.ru","sip.zebra-telecom.ru","sip.obit.ru",
    "sip.mtsglobaltelecom.ru","sip.vats.sber.ru","pbx.rt.ru",
    "sip2sip.info","sip.linphone.org","proxy.sipthor.net","sip.sipthor.net",
    "sip.antisip.com","sip.ippi.fr","sip.voipbuster.com","sip.voipstunt.com",
    "sip.freecall.com","sip.powervoip.com","sip.poivy.com","sip.voipwise.com",
    "sip.internetcalls.com","sip.counterpath.com","sipml5.org","sip.zoiper.com",
    "sip.microsip.org","asterisk.org","sip.asterisk.org",
    "sip.vonage.com","sip.ringcentral.com","sip.8x8.com","sip.plivo.com",
    "sip.telnyx.com","sip.bandwidth.com","sip.twilio.com","global.sip.twilio.com",
    "sip.infobip.com","sip.messagebird.com","sip.signalwire.com","sip.did.telnyx.com",
  ],
};

// ── core helpers ──────────────────────────────────────────────────────────────

function getHost(profile) {
  var elem = document.getElementById("customHost");
  var custom = elem ? elem.value.trim() : "";
  if (custom) return custom;
  var pool = hostPools[profile] || hostPools.tls_client_hello;
  return pool[rnd(0, pool.length - 1)];
}
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

/**
 * rh(n) — n байт случайного hex. Аргумент приводится к целому.
 * Возвращает строку длиной ровно n*2 символов (всегда чётная).
 */
function rh(n) {
  var bytes = Math.max(0, Math.floor(n));
  var s = "";
  for (var i = 0; i < bytes; i++)
    s += ("0" + Math.floor(Math.random() * 256).toString(16)).slice(-2);
  return s;
}

/**
 * hexPad(value, byteLen) — число → hex-строка ровно byteLen байт (byteLen*2 символов).
 * Заменяет опасный .toString(16) без гарантии чётной длины.
 */
function hexPad(value, byteLen) {
  var hex = Math.floor(value).toString(16);
  while (hex.length < byteLen * 2) hex = "0" + hex;
  return hex.slice(-(byteLen * 2));
}

/**
 * assertEvenHex(hex, label) — страховочная проверка.
 * Если вдруг hex нечётный — логирует и дополняет нулём.
 * При корректном использовании hexPad/rh эта ветка никогда не должна срабатывать.
 */
function assertEvenHex(hex, label) {
  if (hex.length % 2 !== 0) {
    console.warn("[AWG] odd hex in " + (label || "?") + " len=" + hex.length);
    hex = hex + "0";
  }
  return hex;
}

function rRange(base, spread) {
  var s = base + rnd(0, spread || 500000);
  return s + "-" + (s + rnd(1000, 50000));
}

// ── protocol generators ───────────────────────────────────────────────────────

/**
 * mkQUICi — QUIC Initial (RFC 9000, Long Header 0xC0-0xC3)
 *
 * Long Header layout:
 *   1B flags | 4B version | 1B dcid_len | dcid | 1B scid_len | scid
 *   | 1B token_len | token | 4B reserved/PN
 *
 * Все части чётные по определению:
 *   hexPad(x, n) → 2n символов; rh(k) → 2k символов.
 */
function mkQUICi(iv) {
  var host     = getHost("quic_initial");
  var dcid     = rnd(8, 20);
  var scid     = rnd(0, 20);
  var tokenLen = rnd(0, 1) === 0 ? 0 : rnd(8, 32);
  var sniRc    = Math.min(host.length + rnd(0, 6), 64);

  var hex = assertEvenHex(
    hexPad(0xc0 | rnd(0, 3), 1) +   // 1B flags
    "00000001" +                      // 4B version
    hexPad(dcid, 1) +                 // 1B DCID length
    rh(dcid) +                        // N bytes DCID
    hexPad(scid, 1) +                 // 1B SCID length
    rh(scid) +                        // N bytes SCID
    hexPad(tokenLen, 1) +             // 1B token length
    rh(tokenLen) +                    // N bytes token
    rh(4),                            // 4B reserved/PN
    "mkQUICi"
  );

  return "<b 0x" + hex + "><rc " + sniRc + "><c><t><r " +
         Math.min(rnd(20, 80) * iv, 500) + ">";
}

/**
 * mkQUIC0 — QUIC 0-RTT (Long Header 0xD0-0xD3)
 */
function mkQUIC0(iv) {
  var host       = getHost("quic_0rtt");
  var dcid       = rnd(8, 20);
  var scid       = rnd(0, 20);
  var ticketHint = Math.min(host.length + rnd(4, 16), 48);

  var hex = assertEvenHex(
    hexPad(0xd0 | rnd(0, 3), 1) +
    "00000001" +
    hexPad(dcid, 1) +
    rh(dcid) +
    hexPad(scid, 1) +
    rh(scid) +
    rh(4),
    "mkQUIC0"
  );

  return "<b 0x" + hex + "><t><r " +
         Math.min(rnd(30, 120) * iv, 600) + "><rc " + ticketHint + "><c>";
}

/**
 * mkTLS — TLS 1.3 Client Hello
 *
 * TLS Record: 16 03 01 [2B recLen] 01 [3B hsLen] 03 03 [32B random]
 *
 * Все числовые поля через hexPad — гарантированно чётные.
 */
function mkTLS(iv) {
  var host   = getHost("tls_client_hello");
  var recLen = rnd(300, 550);
  var hsLen  = recLen - rnd(4, 9);
  var sniExt = 2 + 2 + 2 + 1 + 2 + host.length;
  var sniRc  = Math.min(sniExt, 64);

  var hex = assertEvenHex(
    "160301" +                    // 3B: record type + legacy version
    hexPad(recLen, 2) +           // 2B: record length
    "01" +                        // 1B: handshake type = ClientHello
    hexPad(hsLen, 3) +            // 3B: handshake length
    "0303" +                      // 2B: client_version (TLS 1.2 legacy)
    rh(32),                       // 32B: client random
    "mkTLS"
  );

  return "<b 0x" + hex + "><rc " + sniRc + "><r " +
         Math.min(rnd(20, 60) * iv, 300) + "><c><t>";
}

/**
 * mkNoise — WireGuard Noise_IK Handshake Initiation
 * Разбит на несколько <b> тегов для удобства отображения.
 * rh(n) всегда чётный — каждый тег корректен.
 */
function mkNoise(iv) {
  return (
    "<b 0x01000000" + rh(4) + ">" +  // type(1) + reserved(3) + sender_index(4)
    "<b 0x" + rh(32) + ">" +          // ephemeral public key
    "<b 0x" + rh(48) + ">" +          // encrypted static
    "<b 0x" + rh(28) + ">" +          // encrypted timestamp
    "<r " + Math.min(rnd(10, 40) * iv, 200) + "><t><rc " + rnd(4, 12) + ">"
  );
}

/**
 * mkDTLS — DTLS 1.2 Client Hello
 *
 * DTLS Record:
 *   1B content_type | 2B version=0xFEFD | 2B epoch | 6B seq_num
 *   | 2B length | 1B hs_type | 3B hs_len | 2B msg_seq | 3B frag_offset
 *   | 3B frag_len | 2B dtls_version | 4B epoch+rnd | 32B random
 *
 * epoch через hexPad(epoch, 2) = ровно 4 hex-символа.
 */
function mkDTLS(iv) {
  var host    = getHost("dtls");
  var fragLen = rnd(100, 300);
  var sniRc   = Math.min(host.length + rnd(2, 8), 60);
  var epoch   = rnd(0, 255);

  var hex = assertEvenHex(
    "16" +                        // 1B: content_type = Handshake
    "fefd" +                      // 2B: version = DTLS 1.2
    hexPad(epoch, 2) +            // 2B: epoch  ← hexPad гарантирует 4 символа
    rh(6) +                       // 6B: sequence number
    hexPad(fragLen, 2) +          // 2B: fragment length
    "01" +                        // 1B: handshake type = ClientHello
    rh(6) +                       // 3B hs_len + 2B msg_seq + 1B pad
    "fefd0000" +                  // 2B dtls_version + 2B cookie_len
    rh(4) +                       // 4B random prefix
    rh(32),                       // 32B random
    "mkDTLS"
  );

  return "<b 0x" + hex + "><rc " + sniRc + "><c><t><r " +
         Math.min(rnd(15, 50) * iv, 250) + ">";
}

/**
 * mkHTTP3 — HTTP/3 over QUIC (QUIC Long Header с расширенным набором типов)
 */
function mkHTTP3(iv) {
  var host   = getHost("quic_initial");
  var ptypes = [0xc0, 0xc1, 0xc2, 0xc3, 0xe0, 0xe1, 0xe2];
  var dcid   = rnd(8, 20);
  var scid   = rnd(0, 20);
  var sniLen = Math.min(host.length + 9 + rnd(0, 6), 64);

  var hex = assertEvenHex(
    hexPad(ptypes[rnd(0, ptypes.length - 1)], 1) +
    "00000001" +
    hexPad(dcid, 1) +
    rh(dcid) +
    hexPad(scid, 1) +
    rh(scid) +
    rh(4),
    "mkHTTP3"
  );

  return "<b 0x" + hex + "><rc " + sniLen + "><r " +
         Math.min(rnd(30, 100) * iv, 500) + "><c><t>";
}

/**
 * mkSIP — SIP REGISTER request
 *
 * ASCII "REGISTER sip:" = 13 символов = 26 hex (чётное).
 * hostHex: каждый ASCII-символ → 2 hex (всегда чётное).
 * " " (0x20) = 2 hex-символа.
 * rh(4) = 8 hex-символов.
 * Итого: гарантированно чётное.
 */
function mkSIP(iv) {
  var host    = getHost("sip");
  var hostHex = "";
  for (var i = 0; i < host.length; i++)
    hostHex += ("0" + host.charCodeAt(i).toString(16)).slice(-2);

  var hex = assertEvenHex(
    "524547495354455220736970" +  // "REGISTER sip"
    "3a" +                        // ":"
    hostHex +                     // host as ASCII hex
    "20" +                        // " "
    rh(4),                        // 4B random suffix
    "mkSIP"
  );

  var rcVal = Math.min(host.length + rnd(8, 24) * iv, 150);
  return "<b 0x" + hex + "><rc " + rcVal + "><c><t><r " +
         Math.min(rnd(5, 30) * iv, 120) + ">";
}

/**
 * mkEntropy — энтропийные блоки для I2-I5
 */
function mkEntropy(idx, iv) {
  var r  = Math.min(rnd(10, 40) * iv, 300);
  var rc = rnd(4, 12);
  var bStr = "";
  if (iv >= 2) {
    bStr = "<b 0x" + rh(rnd(4, Math.floor(8 * iv))) + ">";
  }
  var p = [
    bStr + "<r " + r + "><t><rc " + rc + "><c>",
    "<c><t>" + bStr + "<r " + (r + 5) + "><rc " + (rc + 2) + ">",
    "<rc " + rc + ">" + bStr + "<r " + r + "><c><t>",
    "<t><r " + (r + 3) + "><c><rc " + rc + ">" + bStr,
    "<r " + (r + 2) + "><rc " + (rc + 1) + ">" + bStr + "<t><c>",
  ];
  return p[(idx + rnd(0, 2)) % p.length];
}

function genI1(profile, iv) {
  var m = {
    quic_initial:     function() { return mkQUICi(iv); },
    quic_0rtt:        function() { return mkQUIC0(iv); },
    tls_client_hello: function() { return mkTLS(iv); },
    wireguard_noise:  function() { return mkNoise(iv); },
    dtls:             function() { return mkDTLS(iv); },
    http3:            function() { return mkHTTP3(iv); },
    sip:              function() { return mkSIP(iv); },
  };
  if (profile === "random") {
    var k = Object.keys(m);
    return genI1(k[rnd(0, k.length - 1)], iv);
  }
  return (m[profile] || m.quic_initial)();
}

// ── config generation ─────────────────────────────────────────────────────────

function genCfg() {
  var profile      = document.getElementById("quicProfile").value;
  var jc           = parseInt(document.getElementById("junkLevel").value);
  var mimicAllElem = document.getElementById("mimicAll");
  var doMimicAll   = mimicAllElem && mimicAllElem.checked;
  var imap         = { low: 1, medium: 2, high: 3 };
  var boost        = iter * 5;
  var iv           = imap[inten] + (iter > 3 ? 1 : 0);

  var h1 = rRange(100000000);
  var h2 = rRange(1200000000);
  var h3 = rRange(2400000000);
  var h4 = rRange(3600000000);
  var h1s = 100000000 + rnd(0, 4000000);
  var h2s = 1200000000 + rnd(0, 4000000);
  var h3s = 2400000000 + rnd(0, 4000000);
  var h4s = 3600000000 + rnd(0, 4000000);

  var s1 = Math.min(64, rnd(15, 32) + boost);
  var s2 = Math.min(64, rnd(15, 32) + boost);
  if (s2 === s1 + 56) s2 += 1;
  var s3  = Math.min(64, rnd(8, 24) + boost);
  var s4  = Math.min(32, rnd(6, 18) + boost);
  var jcv = Math.min(10, jc + (inten === "high" ? 2 : 0));
  var jmin = 64 + boost * 2;
  var jmax = Math.min(1024, 256 + iv * 150 + boost * 5);

  return {
    h1, h2, h3, h4, h1s, h2s, h3s, h4s,
    s1, s2, s3, s4, jc: jcv, jmin, jmax,
    i1: genI1(profile, iv),
    i2: doMimicAll ? genI1(profile, iv) : mkEntropy(1, iv),
    i3: doMimicAll ? genI1(profile, iv) : mkEntropy(2, iv),
    i4: doMimicAll ? genI1(profile, iv) : mkEntropy(3, iv),
    i5: doMimicAll ? genI1(profile, iv) : mkEntropy(4, iv),
    profile,
  };
}

// ── rendering ─────────────────────────────────────────────────────────────────

var plabs = {
  quic_initial: "QUIC Initial", quic_0rtt: "QUIC 0-RTT",
  tls_client_hello: "TLS 1.3", wireguard_noise: "Noise_IK",
  dtls: "DTLS 1.3", http3: "HTTP/3", sip: "SIP", random: "Random",
};

function renderCfg(p) {
  var tbl = document.getElementById("configTable");
  tbl.classList.add("shimmer");
  setTimeout(function() { tbl.classList.remove("shimmer"); }, 650);
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
      ["S2", p.s2, "vp", '— Resp ≤64 B <span style="color:var(--text3);font-size:9px">S1+56≠S2 ✓</span>'],
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
      ["H1", p.h1s, "va", ""], ["H2", p.h2s, "va", ""],
      ["H3", p.h3s, "va", ""], ["H4", p.h4s, "va", ""],
    ]);
    html += sec("PREFIXES S1–S2", [
      ["S1", p.s1, "vp", "≤64 B"],
      ["S2", p.s2, "vp", '≤64 B <span style="color:var(--text3);font-size:9px">S1+56≠S2 ✓</span>'],
    ]);
    html += sec("JUNK TRAIN", [
      ["Jc", p.jc, "vb", ""], ["Jmin", p.jmin, "vb", ""], ["Jmax", p.jmax, "vb", ""],
    ]);
  }

  if (ver !== "1.0") {
    var lbl = "CPS SIGNATURE CHAIN I1–I5";
    if (ver === "1.5")
      lbl += '<span style="color:var(--text3);font-size:9px;margin-left:6px">CLIENT ONLY</span>';
    html += '<div class="psec"><div class="pseclabel">' + lbl +
            '<span class="qbadge">✦ ' + pn + "</span></div>";
    for (var n = 1; n <= 5; n++) {
      var i1 = n === 1;
      html += '<div class="prow" style="animation-delay:' + n * 0.04 + 's">' +
              '<div class="pkey">I' + n + (i1 ? " ✦" : "") + "</div>" +
              '<div class="pval ' + (i1 ? "vc" : "vg") + '" style="font-size:10.5px">' +
              esc(p["i" + n]) + "</div></div>";
    }
    html += "</div>";
  }

  tbl.innerHTML = html;
  renderPrev(p);
}

function sec(label, rows) {
  var h = '<div class="psec"><div class="pseclabel">' + label + "</div>";
  rows.forEach(function(r, idx) {
    h += '<div class="prow" style="animation-delay:' + idx * 0.04 + 's">' +
         '<div class="pkey">' + r[0] + "</div>" +
         '<div class="pval ' + r[2] + '">' + r[1] +
         (r[3] ? '<span style="color:var(--text3);font-size:10px"> ' + r[3] + "</span>" : "") +
         "</div></div>";
  });
  return h + "</div>";
}

function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function renderPrev(p) {
  var lines = [];
  lines.push('<span class="cm"># AmneziaWG ' + ver + "</span>");
  lines.push('<span class="cm">[Interface]</span>');
  lines.push('<span class="cm"># PrivateKey = &lt;ключ&gt;  Address = 10.0.0.2/32</span>');
  function kv(k, v) {
    lines.push('<span class="kk">' + k + '</span> = <span class="vv">' + v + "</span>");
  }
  if (ver === "2.0") {
    kv("H1",p.h1); kv("H2",p.h2); kv("H3",p.h3); kv("H4",p.h4);
    kv("S1",p.s1); kv("S2",p.s2); kv("S3",p.s3); kv("S4",p.s4);
    kv("Jc",p.jc); kv("Jmin",p.jmin); kv("Jmax",p.jmax);
    kv("I1",esc(p.i1)); kv("I2",esc(p.i2)); kv("I3",esc(p.i3));
    kv("I4",esc(p.i4)); kv("I5",esc(p.i5));
  } else if (ver === "1.5") {
    kv("H1",p.h1s); kv("H2",p.h2s); kv("H3",p.h3s); kv("H4",p.h4s);
    kv("S1",p.s1); kv("S2",p.s2);
    kv("Jc",p.jc); kv("Jmin",p.jmin); kv("Jmax",p.jmax);
    lines.push('<span class="cm"># I1-I5 только клиент (AWG 1.5):</span>');
    kv("I1",esc(p.i1)); kv("I2",esc(p.i2)); kv("I3",esc(p.i3));
    kv("I4",esc(p.i4)); kv("I5",esc(p.i5));
  } else {
    kv("H1",p.h1s); kv("H2",p.h2s); kv("H3",p.h3s); kv("H4",p.h4s);
    kv("S1",p.s1); kv("S2",p.s2);
    kv("Jc",p.jc); kv("Jmin",p.jmin); kv("Jmax",p.jmax);
    lines.push('<span class="cm"># I1-I5 не поддерживаются в AWG 1.0</span>');
  }
  document.getElementById("previewCode").innerHTML = lines.join("\n");
}

function getPlain(p) {
  var l = ["# AmneziaWG " + ver,"[Interface]","# PrivateKey = <ключ>","# Address = 10.0.0.2/32"];
  if (ver === "2.0") {
    l.push("H1 = "+p.h1,"H2 = "+p.h2,"H3 = "+p.h3,"H4 = "+p.h4);
    l.push("S1 = "+p.s1,"S2 = "+p.s2,"S3 = "+p.s3,"S4 = "+p.s4);
    l.push("Jc = "+p.jc,"Jmin = "+p.jmin,"Jmax = "+p.jmax);
    l.push("I1 = "+p.i1,"I2 = "+p.i2,"I3 = "+p.i3,"I4 = "+p.i4,"I5 = "+p.i5);
  } else if (ver === "1.5") {
    l.push("H1 = "+p.h1s,"H2 = "+p.h2s,"H3 = "+p.h3s,"H4 = "+p.h4s);
    l.push("S1 = "+p.s1,"S2 = "+p.s2,"Jc = "+p.jc,"Jmin = "+p.jmin,"Jmax = "+p.jmax);
    l.push("# I1-I5 только клиент:","I1 = "+p.i1,"I2 = "+p.i2,"I3 = "+p.i3,"I4 = "+p.i4,"I5 = "+p.i5);
  } else {
    l.push("H1 = "+p.h1s,"H2 = "+p.h2s,"H3 = "+p.h3s,"H4 = "+p.h4s);
    l.push("S1 = "+p.s1,"S2 = "+p.s2,"Jc = "+p.jc,"Jmin = "+p.jmin,"Jmax = "+p.jmax);
  }
  return l.join("\n");
}

// ── actions ───────────────────────────────────────────────────────────────────

function generate() {
  cp = genCfg();
  renderCfg(cp);
  var s    = document.getElementById("quicProfile");
  var wrap = document.getElementById("customHostWrap");
  var hint = document.getElementById("customHostHint");
  var noHost = s.value === "wireguard_noise";
  if (wrap) { if (!noHost) wrap.classList.add("show"); else wrap.classList.remove("show"); }
  if (hint) {
    var hintMap = {
      quic_initial:     "QUIC-capable: fastly.net, cdn-apple.com, yastatic.net …",
      quic_0rtt:        "QUIC 0-RTT: fastly.net, s3.amazonaws.com, yastatic.net …",
      tls_client_hello: "Любой HTTPS-хост: vk.com, github.com, ozon.ru …",
      dtls:             "STUN/TURN-сервер: stun.yandex.net, stun.jit.si …",
      http3:            "HTTP/3-хост: fastly.net, cdn.gcore.com, yandex.net …",
      sip:              "SIP-регистратор: sip.zadarma.com, sip.linphone.org …",
      random:           "Пул выбирается по случайному профилю (опционально укажите свой хост)",
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
  document.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
  btn.classList.add("active");
  if (cp) renderCfg(cp);
}

function setIntensity(level) {
  inten = level;
  var map = { low: "al", medium: "am", high: "ah" };
  ["low","medium","high"].forEach(function(l) {
    var b = document.getElementById("i" + l.slice(0,3));
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
      "bad"
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
  if (!cp) { addLog("⚠ Сначала сгенерируйте конфиг", "bad"); return; }
  var text = getPlain(cp);
  var btn = document.getElementById("copyBtn");
  function done() {
    btn.textContent = "✓ Скопировано!";
    btn.classList.add("copied");
    setTimeout(function() { btn.textContent = "📋 Копировать"; btn.classList.remove("copied"); }, 2000);
  }
  if (navigator.clipboard) { navigator.clipboard.writeText(text).then(done).catch(fb); }
  else { fb(); }
  function fb() {
    var ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta); done();
  }
}

function downloadConfig() {
  if (!cp) { addLog("⚠ Сначала сгенерируйте конфиг", "bad"); return; }
  var blob = new Blob([getPlain(cp)], { type: "text/plain" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "amneziawg-" + ver + "-" + Date.now() + ".conf";
  a.click();
  URL.revokeObjectURL(url);
}

function toggleFaq(head) { head.parentElement.classList.toggle("open"); }

window.addEventListener("DOMContentLoaded", function() { generate(); });