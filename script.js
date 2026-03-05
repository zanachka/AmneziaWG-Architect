var ver = "2.0",
  inten = "medium",
  iter = 0,
  cp = null;

/**
 * AmneziaWG Architect — hostPools v2.3
 *
 * Последнее обновление пула: март 2026.
 *
 * Критерии отбора доменов:
 *   1. Поддержка релевантного протокола (QUIC/HTTP3, TLS1.3, DTLS/STUN, SIP)
 *   2. Доступность из России на момент Q1 2026 — не внесены в блок-листы РКН/TSPU
 *   3. Достаточно крупный трафик: блокировка приводит к заметному ущербу (банки,
 *      госуслуги, массовые сервисы), что снижает риск цензурного коллапса
 *
 * ── САЙТЫ, ЗАБЛОКИРОВАННЫЕ в России на момент марта 2026 ─────────────────────
 *  YouTube         — полностью заблокирован с 2024 (удаление из NSDI)
 *  Cloudflare CDN  — блокировка *.cloudflare.com, 1.1.1.1, *.workers.dev
 *  Discord         — полностью заблокирован с 2024
 *  Facebook/Meta   — полностью заблокирован (экстремистская организация)
 *  Instagram       — полностью заблокирован (экстремистская организация)
 *  WhatsApp        — полностью заблокирован с 11.02.2026 (DNS удалены из NSDI)
 *  Snapchat        — блокируется
 *  LinkedIn        — блокируется с 2016
 *  Google services — частично: поиск/YouTube заблокированы; GCP/Firebase часто доступны
 *                    (но STUN-серверы Google 74.125.x.x/172.217.x.x недоступны из-за
 *                    перекрытия с заблокированными диапазонами YouTube)
 *  Twitter/X       — доступ существенно ограничен, считается заблокированным
 *
 * ── Статус CDN Telegram ─────────────────────────────────────────────────────
 *  На 01.03.2026 Telegram заметно ТРОТТЛИТСЯ (медиа загружаются ≈10% скорости).
 *  Ожидается возможная полная блокировка — поэтому cdn1-5.telegram.org исключены
 *  из пулов по умолчанию. При уверенной доступности у вашего провайдера —
 *  можно возвращать их в пул вручную.
 *
 * ── Уровни «безопасности» по пулам ──────────────────────────────────────────
 *  🟢 RU-domestic  — полностью российские сервисы, минимальный риск блокировки
 *  🔵 CDN-infra    — CDN, обслуживающие банки/госструктуры; блокировка приводит к
 *                   экономическим последствиям и потому менее вероятна
 *  🟡 Tech-neutral — GitHub, Steam, Apple, Microsoft — массово используемые сервисы
 *  🟠 International — международные провайдеры; доступны, но имеют меньшую гарантию
 */

var hostPools = {
  /* ──────────────────────────────────────────────────────────────────────────
   * QUIC Initial (RFC 9000, Long Header 0xC0-0xC3, UDP 443)
   * Хосты, у которых подтверждена установка HTTP/3 (QUIC) по UDP/443 и которые
   * доступны из России. Пулы формируются с приоритетом на отказоустойчивость
   * и минимальный риск региональных блокировок.
   * ────────────────────────────────────────────────────────────────────────── */
  quic_initial: [
    // 🟢 RU-domestic CDN & portals
    "yandex.net", // Yandex CDN backbone — HTTP/3 enabled
    "yastatic.net", // Yandex static CDN
    "s3.yandex.net", // Yandex Object Storage
    "storage.yandexcloud.net",
    "cloud.yandex.ru",
    "dzen.ru", // Dzen (ex-Yandex Zen)
    "music.yandex.ru",
    "vk.com",
    "mycdn.me", // VK CDN
    "vk-cdn.net",
    "userapi.com",
    "ok.ru",
    "mail.ru",
    "imgsmail.ru",
    "cdn.mail.ru",
    "avito.ru", // #1 RU classifieds — HTTP/3
    "ozon.ru",
    "cdn1.ozone.ru",
    "wildberries.ru",
    "wbstatic.net", // WB CDN
    "kinopoisk.ru",
    "ivi.ru",
    "rutube.ru",
    "rt.ru", // RT (state media) — always accessible
    "sber.ru",
    "sberbank.ru",
    "sbp.ru",
    "tbank.ru",
    "raiffeisen.ru",
    "vtb.ru",
    "alfabank.ru",
    "gazprombank.ru", // Газпромбанк
    "sovcombank.ru", // Совкомбанк
    "rosbank.ru", // Росбанк
    "kaspersky.ru",
    "kaspersky.com",
    "drweb.ru",
    "selectel.ru", // Selectel (RU cloud)
    "selectel.com",
    "timeweb.cloud",
    "timeweb.com",
    "reg.ru",
    "beget.com",
    "mchost.ru",
    "nic.ru",
    "dataline.ru",
    "mts.ru", // Mobile operators — unblockable
    "beeline.ru",
    "megafon.ru",
    "rostelecom.ru",
    "tele2.ru",
    "mvideo.ru", // Retail
    "eldorado.ru",
    "dns-shop.ru",
    "citilink.ru",
    "lamoda.ru",
    "sportmaster.ru",
    "detmir.ru",
    "sbermegamarket.ru",
    "gosuslugi.ru", // 🟢 Gov — абсолютно незаблокируемые
    "mos.ru",
    "nalog.ru",
    "pfr.gov.ru",
    "cbr.ru",
    "roscosmos.ru",
    "premier.one", // RU VOD
    "okko.tv",
    "more.tv",
    "1tv.ru", // RU TV channels
    "ntv.ru",
    "russia.tv",
    "rbc.ru", // RU news
    "tass.ru",
    "ria.ru",
    "gazeta.ru",
    "lenta.ru",
    "hh.ru", // Job boards
    "superjob.ru",
    "2gis.ru", // Maps
    "championat.com", // Sports
    "sports.ru",
    "rambler.ru",
    "livejournal.com",

    // 🔵 CDN-infra (RU banks/gov/enterprises depend on these)
    "gcore.com", // Gcore — HTTP/3, PoP в Москве/СПб
    "api.gcore.com",
    "cdn.gcore.com",
    "g.gcdn.co", // Gcore edge alias
    "gcdn.co",
    "bunny.net", // BunnyCDN — HTTP/3 default
    "b-cdn.net",
    "storage.bunnycdn.com",
    "cdn77.com", // CDN77 — HTTP/3
    "rsc.cdn77.org",
    "fastly.net", // Fastly — serves GitHub, npm, Spotify
    "a.ssl.fastly.net",
    "global.fastly.net",
    "fastlylabs.com",
    "a248.e.akamai.net", // Akamai — serves Sberbank, Tinkoff, VTB CDN
    "akamaiedge.net",
    "akamaihd.net",
    "akamaistream.net",
    "edgekey.net",
    "akam.net",
    "cloudfront.net", // AWS CloudFront — serves RU banking APIs
    "d1.awsstatic.com",
    "d2.awsstatic.com",
    "s3.amazonaws.com",
    "msedge.net", // Microsoft CDN — Win Update, Office365
    "cdn.office.net",
    "azureedge.net",
    "azure.microsoft.com",
    "live.com",
    "outlook.com",
    "office.com",
    "hotmail.com",
    "microsoft.com",
    "xbox.com",
    "xboxlive.com",
    "onedrive.live.com",
    "trafficmanager.net",
    "icloud.com", // Apple — ~50M RU iOS devices
    "cdn-apple.com",
    "mzstatic.com",
    "apple.com",
    "appleid.apple.com",
    "limelight.com", // Limelight/Edgio CDN
    "llnwd.net",
    "edg.io", // Edgio (ex-Limelight)
    "highwinds.com",
    "stackpathdns.com", // StackPath/Highwinds
    "cachefly.net", // CacheFly — HPC CDN
    "imperva.com", // Imperva CDN (ex-Incapsula)

    // 🟡 Tech-neutral
    "github.com",
    "objects.githubusercontent.com",
    "raw.githubusercontent.com",
    "codeload.github.com",
    "github.githubassets.com",
    "avatars.githubusercontent.com",
    "releases.githubusercontent.com",
    "gitlab.com", // GitLab (not blocked)
    "cdn.jsdelivr.net", // jsDelivr — open CDN for npm/GitHub
    "unpkg.com",
    "registry.npmjs.org",
    "pypi.org", // Python Package Index
    "files.pythonhosted.org",
    "archive.ubuntu.com", // Ubuntu mirrors
    "security.ubuntu.com",
    "packages.ubuntu.com",
    "deb.debian.org",
    "ftp.debian.org",
    "launchpad.net",
    "snapcraft.io",
    "steamstatic.com", // Steam/Valve
    "steamcontent.com",
    "steampowered.com",
    "steamcdn-a.akamaihd.net",
    "store.steampowered.com",
    "epicgames.com",
    "ea.com",
    "battle.net",
    "blizzard.com",
    "ubisoft.com",
    "riotgames.com",
    "leagueoflegends.com",
    "spotify.com", // Spotify (accessible in RU)
    "scdn.co",
    "heads-ak.spotify.com",
    "jtvnw.net", // Twitch media CDN
    "twitchsvc.net",
    "wikipedia.org", // Wikipedia — never blocked
    "upload.wikimedia.org",
    "wikimedia.org",
    "wikidata.org",
    "commons.wikimedia.org",
    "hetzner.com", // Hetzner (popular RU dev VPS)
    "hetzner.de",
    "hetzner.cloud",
    "your-server.de",
    "ovhcloud.com", // OVH
    "ovh.net",
    "ovh.com",
    "gra-g1.ovh.net",
    "digitalocean.com", // DigitalOcean — widely used by RU devs
    "dropbox.com",
    "dropboxstatic.com",
    "dropboxapi.com",
    "notion.so", // Notion (accessible in RU)
    "notionusercontent.com",
    "zoom.us", // Zoom (accessible in RU)
    "zmtr.cn",
    "valve.net",
    "linode.com", // Akamai/Linode cloud

    // 🟠 Asian CDN / cloud
    "tencentcs.com",
    "tencent.com",
    "myqcloud.com",
    "qpic.cn",
    "alicdn.com",
    "aliyuncs.com",
    "alibabacloud.com",
    "taobao.com",
    "huaweicloud.com",
    "hwcdn.net",
    "baidu.com", // Baidu CDN
    "bdstatic.com",
    "bceloss.com", // Baidu BCE CDN
  ],

  /* ──────────────────────────────────────────────────────────────────────────
   * QUIC 0-RTT (Early Data, Long Header 0xD0-0xD3, UDP 443)
   * Хосты, у которых в сессии с QUIC возможен TLS session resumption (0-RTT).
   * Только CDN/сервисы с подтверждённой поддержкой 0-RTT / QUIC session tickets.
   * ────────────────────────────────────────────────────────────────────────── */
  quic_0rtt: [
    // 🟢 RU-domestic
    "yandex.net",
    "yastatic.net",
    "storage.yandexcloud.net",
    "vk.com",
    "mycdn.me",
    "vk-cdn.net",
    "mail.ru",
    "ozon.ru",
    "avito.ru",
    "wildberries.ru",
    "wbstatic.net",
    "kinopoisk.ru",
    "sber.ru",
    "kaspersky.com",
    "selectel.ru",
    "timeweb.cloud",
    "tbank.ru",
    "alfabank.ru",
    "gosuslugi.ru",

    // 🔵 CDN-infra (confirmed 0-RTT)
    "gcore.com",
    "cdn.gcore.com",
    "g.gcdn.co",
    "gcdn.co",
    "bunny.net",
    "b-cdn.net",
    "cdn77.com",
    "fastly.net",
    "a.ssl.fastly.net",
    "global.fastly.net",
    "cloudfront.net", // CloudFront: 0-RTT via TLS 1.3 session tickets
    "s3.amazonaws.com",
    "d1.awsstatic.com",
    "msedge.net",
    "cdn.office.net",
    "live.com",
    "office.com",
    "xbox.com",
    "icloud.com", // Apple: 0-RTT confirmed in iOS 17+
    "cdn-apple.com",
    "mzstatic.com",
    "akamaiedge.net",
    "akamaihd.net",
    "edgekey.net",

    // 🟡 Tech-neutral
    "github.com",
    "objects.githubusercontent.com",
    "cdn.jsdelivr.net",
    "unpkg.com",
    "registry.npmjs.org",
    "archive.ubuntu.com",
    "steamstatic.com",
    "steamcontent.com",
    "spotify.com",
    "scdn.co",
    "wikipedia.org",
    "wikimedia.org",
    "dropbox.com",
    "epicgames.com",

    // 🟠 Asian CDN
    "alicdn.com",
    "tencentcs.com",
    "myqcloud.com",
    "huaweicloud.com",
    "bdstatic.com",
  ],

  /* ──────────────────────────────────────────────────────────────────────────
   * TLS 1.3 Client Hello (TCP 443)
   * Широкий пул — TLS используется практически везде. Сортировка по надёжности
   * в России в 2026 году.
   * ────────────────────────────────────────────────────────────────────────── */
  tls_client_hello: [
    // 🟢 RU-domestic: топ-100 российских сайтов по посещаемости
    "yandex.net",
    "yandex.ru",
    "yastatic.net",
    "s3.yandex.net",
    "storage.yandexcloud.net",
    "cloud.yandex.ru",
    "dzen.ru",
    "music.yandex.ru",
    "vk.com",
    "mycdn.me",
    "vk-cdn.net",
    "userapi.com",
    "ok.ru",
    "mail.ru",
    "imgsmail.ru",
    "cdn.mail.ru",
    "avito.ru",
    "ozon.ru",
    "cdn1.ozone.ru",
    "wildberries.ru",
    "wbstatic.net",
    "kinopoisk.ru",
    "ivi.ru",
    "rutube.ru",
    "premier.one",
    "okko.tv",
    "more.tv",
    "rt.ru",
    "russia.tv",
    "1tv.ru",
    "ntv.ru",
    "ren.tv",
    "tvc.ru",
    "5-tv.ru",
    "sber.ru",
    "sberbank.ru",
    "sbp.ru",
    "online.sberbank.ru",
    "tbank.ru",
    "raiffeisen.ru",
    "vtb.ru",
    "vtb24.ru",
    "alfabank.ru",
    "gazprombank.ru",
    "sovcombank.ru",
    "rosbank.ru",
    "otkritie.ru",
    "rshb.ru", // Открытие, Россельхозбанк
    "pochtabank.ru",
    "bspb.ru", // Почта Банк, БСП
    "kaspersky.ru",
    "kaspersky.com",
    "drweb.ru",
    "drweb.com",
    "roscosmos.ru",
    "gosuslugi.ru",
    "mos.ru",
    "nalog.ru",
    "pfr.gov.ru",
    "cbr.ru",
    "esia.gosuslugi.ru",
    "epgu.gosuslugi.ru",
    "mts.ru",
    "beeline.ru",
    "megafon.ru",
    "tele2.ru",
    "rostelecom.ru",
    "selectel.ru",
    "selectel.com",
    "timeweb.cloud",
    "timeweb.com",
    "reg.ru",
    "beget.com",
    "nic.ru",
    "dataline.ru",
    "mchost.ru",
    "spaceweb.ru",
    "sweb.ru", // SpaceWeb RU hoster
    "ihc.ru",
    "fastvps.ru", // IHC, FastVPS
    "citilink.ru",
    "mvideo.ru",
    "sbermegamarket.ru",
    "lamoda.ru",
    "eldorado.ru",
    "detmir.ru",
    "sportmaster.ru",
    "letoile.ru",
    "dns-shop.ru",
    "technopark.ru",
    "nix.ru",
    "aliexpress.ru",
    "joom.com", // Marketplace accessible in RU
    "gazeta.ru",
    "rbc.ru",
    "kommersant.ru",
    "tass.ru",
    "ria.ru",
    "hh.ru",
    "superjob.ru",
    "rabota.ru",
    "rambler.ru",
    "lenta.ru",
    "rg.ru",
    "kp.ru",
    "mk.ru",
    "izvestia.ru",
    "iz.ru",
    "vedomosti.ru",
    "2gis.ru",
    "maps.yandex.ru",
    "championat.com",
    "sports.ru",
    "matchtv.ru",
    "livejournal.com",
    "pikabu.ru",
    "habr.com", // Dev community RU
    "vc.ru",
    "spark.ru",
    "ruvds.com", // RuVDS hosting
    "vdsina.ru", // VDSina
    "gcorelabs.com", // Gcore Labs

    // 🔵 CDN-infra
    "gcore.com",
    "api.gcore.com",
    "cdn.gcore.com",
    "g.gcdn.co",
    "gcdn.co",
    "bunny.net",
    "b-cdn.net",
    "storage.bunnycdn.com",
    "cdn77.com",
    "rsc.cdn77.org",
    "fastly.net",
    "a.ssl.fastly.net",
    "global.fastly.net",
    "fastlylabs.com",
    "a248.e.akamai.net",
    "akam.net",
    "akamaiedge.net",
    "akamaihd.net",
    "akamaistream.net",
    "edgekey.net",
    "cloudfront.net",
    "d1.awsstatic.com",
    "d2.awsstatic.com",
    "s3.amazonaws.com",
    "aws.amazon.com",
    "msedge.net",
    "azure.microsoft.com",
    "azureedge.net",
    "cdn.office.net",
    "live.com",
    "outlook.com",
    "hotmail.com",
    "office.com",
    "onedrive.live.com",
    "xbox.com",
    "xboxlive.com",
    "microsoft.com",
    "trafficmanager.net",
    "icloud.com",
    "cdn-apple.com",
    "mzstatic.com",
    "apple.com",
    "appleid.apple.com",
    "limelight.com",
    "llnwd.net",
    "edg.io",
    "stackpathdns.com",
    "cachefly.net",
    "imperva.com",
    "incapsula.com", // Imperva/Incapsula
    "sucuri.net", // Sucuri CDN/WAF

    // 🟡 Tech-neutral
    "github.com",
    "objects.githubusercontent.com",
    "raw.githubusercontent.com",
    "codeload.github.com",
    "github.githubassets.com",
    "avatars.githubusercontent.com",
    "releases.githubusercontent.com",
    "gitlab.com",
    "bitbucket.org",
    "cdn.jsdelivr.net",
    "unpkg.com",
    "registry.npmjs.org",
    "pypi.org",
    "files.pythonhosted.org",
    "archive.ubuntu.com",
    "security.ubuntu.com",
    "packages.ubuntu.com",
    "deb.debian.org",
    "ftp.debian.org",
    "launchpad.net",
    "snapcraft.io",
    "alpinelinux.org",
    "archlinux.org", // Popular Linux distros
    "centos.org",
    "fedoraproject.org",
    "steamstatic.com",
    "steamcontent.com",
    "steampowered.com",
    "steamcdn-a.akamaihd.net",
    "store.steampowered.com",
    "epicgames.com",
    "ea.com",
    "ubisoft.com",
    "battle.net",
    "blizzard.com",
    "riotgames.com",
    "leagueoflegends.com",
    "spotify.com",
    "scdn.co",
    "heads-ak.spotify.com",
    "jtvnw.net",
    "twitchsvc.net",
    "wikipedia.org",
    "upload.wikimedia.org",
    "wikimedia.org",
    "wikidata.org",
    "commons.wikimedia.org",
    "hetzner.com",
    "hetzner.de",
    "hetzner.cloud",
    "your-server.de",
    "ovhcloud.com",
    "ovh.net",
    "ovh.com",
    "gra-g1.ovh.net",
    "digitalocean.com",
    "do.co",
    "linode.com",
    "vultr.com",
    "dropbox.com",
    "dropboxstatic.com",
    "dropboxapi.com",
    "notion.so",
    "notionusercontent.com",
    "zoom.us",
    "zmtr.cn",
    "docker.com",
    "hub.docker.com", // Docker Hub
    "registry-1.docker.io",
    "quay.io", // Red Hat container registry
    "ghcr.io", // GitHub Container Registry
    "jetbrains.com", // JetBrains (popular in RU dev)
    "plugins.jetbrains.com",
    "download.jetbrains.com",

    // 🟠 Asian CDN
    "tencentcs.com",
    "tencent.com",
    "myqcloud.com",
    "qpic.cn",
    "alicdn.com",
    "aliyuncs.com",
    "alibabacloud.com",
    "huaweicloud.com",
    "hwcdn.net",
    "baidu.com",
    "bdstatic.com",
    "bceloss.com",
  ],

  /* ──────────────────────────────────────────────────────────────────────────
   * DTLS 1.3 — хосты/сервисы, работающие с DTLS (WebRTC, STUN/TURN)
   *
   * ⚠ ИСКЛЮЧЕНО: stun.l.google.com и варианты — IP-адреса Google (74.125.x.x,
   *   172.217.x.x) заблокированы ТСПУ в России как часть блокировки YouTube.
   * ⚠ ИСКЛЮЧЕНО: stun.cloudflare.com — Cloudflare заблокирован в РФ.
   * ⚠ ИСКЛЮЧЕНО: stun.telegram.org / turn.telegram.org — Telegram CDN
   *   троттлится; полная блокировка ожидается в апреле 2026.
   * ────────────────────────────────────────────────────────────────────────── */
  dtls: [
    // 🟢 RU-domestic STUN/TURN (операторы и сервисы)
    "turn.yandex.net", // Yandex Telemost (видеоконференции)
    "stun.yandex.net",
    "stun1.yandex.net",
    "telemost.yandex.ru",
    "turn.vk.com", // VK Video Calls
    "stun.vk.com",
    "stun1.vk.com",
    "rtc.vk.com",
    "stun.mail.ru",
    "turn.mail.ru",
    "stun.sipnet.ru", // Sipnet (RU SIP провайдер)
    "stun.sipnet.net",
    "stun.zadarma.com", // Zadarma (RU-friendly VoIP)
    "turn.zadarma.com",
    "stun.zepter.ru", // Zepter Russia WebRTC
    "stun.mango-office.ru", // MangoOffice (RU PBX)
    "stun.beeline.ru",
    "stun.mts.ru",
    "stun.megafon.ru",
    "stun.rostelecom.ru",
    "stun.tele2.ru",
    "stun.sber.ru", // Сбер WebRTC (SberJazz)

    // 🔵 Публичные STUN-серверы (глобальная маршрутизация, не заблокированы в РФ)
    "stun.stunprotocol.org", // RFC-совместимый, поддерживается волонтёрами
    "stunserver.stunprotocol.org",
    "stun.voip.ipp2p.com",
    "stun.voipstunt.com",
    "stun.voipbuster.com",
    "stun.voipwise.com",
    "stun.voiptia.net",
    "stun.voxox.com",
    "stun.voxgratia.org",
    "stun.voys.nl",
    "stun.voztele.com",
    "stun.voipzoom.com",
    "stun.vopium.com",
    "stun.ippi.fr",
    "stun.antisip.com",
    "stun.freecall.com",
    "stun.internetcalls.com",
    "stun.counterpath.com",
    "stun.counterpath.net",
    "stun.softjoys.com",
    "stun.sipgate.net",
    "stun.sipgate.net:10000",
    "stun.sip.us",
    "stun.ekiga.net",
    "stun.ideasip.com",
    "stun.schlund.de",
    "stun.xs4all.nl",
    "stun.xten.com",
    "stun.sonetel.com",
    "stun.sonetel.net",
    "stun.rock.com",
    "stun.ooma.com",
    "stun.vyke.com",
    "stun.webcalldirect.com",
    "stun.wwdl.net",
    "stun.yesdates.com",
    "stun.yesss.at",
    "stun.zoiper.com",
    "stun01.sipphone.com",
    "stun1.faktortel.com.au",
    "stun.noc.ams-ix.net",
    "stun.xtratelecom.es",
    "stun.wifirst.net",
    "stun.whoi.edu",
    "stun.zadv.com",
    "stun.zentauron.de",
    "stun.voztovoice.org",
    "stun1.voiceeclipse.net",
    "stun.f.haeder.net",

    // 🟡 Open-source / hosted WebRTC инфраструктура
    "meet.jit.si", // Jitsi Meet — открытый видеоконференс, не заблокирован
    "stun.jit.si",
    "turn.jit.si",
    "8x8.vc",
    "stun.services.mozilla.com", // Firefox WebRTC
    "turn.matrix.org", // Matrix / Element
    "stun.matrix.org",
    "stun.nextcloud.com", // Nextcloud Talk
    "turn.nextcloud.com",
    "janus.conf.meetecho.com", // Janus WebRTC Gateway
    "stun.meetecho.com",

    // 🟡 Commercial VoIP STUN (EU/US, accessible from RU)
    "global.stun.twilio.com",
    "stun.us1.twilio.com",
    "stun.ie1.twilio.com",
    "stun.au1.twilio.com",
    "stun.us2.twilio.com",
    "stun.nexmo.com",
    "stun.vonage.com",
    "global.stun.bandwidth.com",
    "stun.plivo.com",
    "stun.signalwire.com",
    "stun.livekit.cloud", // LiveKit WebRTC infrastructure
    "stun.metered.ca", // Metered.ca STUN

    // 🟠 TURN-реле (бесплатные тиры, не заблокированы в РФ)
    "openrelay.metered.ca", // OpenRelay — free, 500 MB/mo
    "coturn.net",
    "freestun.net", // freestun.net:3479 — free STUN/TURN
    "relay.webwormhole.io",
    "expressturn.com", // ExpressTURN — free tier 1000 GB/mo
  ],

  /* ──────────────────────────────────────────────────────────────────────────
   * SIP REGISTER (UDP 5060 / TLS 5061)
   * Российские и международные SIP-регистраторы для имитации VoIP-трафика.
   * ────────────────────────────────────────────────────────────────────────── */
  sip: [
    // 🟢 RU mobile operators (SIP trunks, обязаны работать по закону)
    "sip.beeline.ru",
    "voip.beeline.ru",
    "sip.mts.ru",
    "voip.mts.ru",
    "sip.megafon.ru",
    "voip.megafon.ru",
    "sip.tele2.ru",
    "voip.tele2.ru",
    "sip.rostelecom.ru",
    "voip.rostelecom.ru",
    "sip.mtt.ru",
    "voip.mtt.ru", // MTT Telecom (RU carrier)

    // 🟢 RU SIP / cloud PBX провайдеры
    "sip.vk.com",
    "sip.yandex.ru",
    "sip.mail.ru",
    "voip.sberbank.ru",
    "sip.vats.sber.ru", // Сбер ВАТС
    "sip.tbank.ru",
    "sip.sipnet.ru",
    "sip.sipnet.net",
    "sip2.sipnet.ru",
    "sip.mango-office.ru",
    "pbx.mango-office.ru",
    "sip.zadarma.com",
    "pbx.zadarma.com",
    "sip.gravitel.ru", // Гравитель
    "sip.onlinepbx.ru", // OnlinePBX
    "sip.uis.ru",
    "pbx.uis.ru",
    "sip.comagic.ru", // CoMagic
    "sip.binotel.ru",
    "sip.novofon.ru", // Novofon (ex-Zadarma RU)
    "sip.megacall.ru",
    "sip.zebra-telecom.ru",
    "sip.obit.ru", // Obit (Сибирь/Урал)
    "sip.mtsglobaltelecom.ru",
    "pbx.rt.ru", // Ростелеком PBX
    "sip.telfin.ru", // Телфин
    "sip.uiscom.ru",
    "sip.voxlink.ru",
    "sip.datafox.ru", // DataFox
    "sip.sipmarket.net", // SIPmarket
    "sip.ngs.ru", // НГС (Новосибирск)
    "sip.kolabora.com", // Колабора
    "sip.sipuni.com", // SIPuni
    "sip.voximplant.com", // Voximplant (облачная платформа)
    "sip.exolve.ru", // MTS Exolve
    "sip.dialpad.ru",
    "sip.oblako.ru", // Облако (RU cloud PBX)
    "pbx.onlinesim.ru",
    "sip.onlinesim.ru",
    "sip.iptel.org", // iptel.org (open SIP registrar)

    // 🟡 Международные SIP (доступны из РФ, широко используемые)
    "sip2sip.info",
    "sip.linphone.org", // Linphone open-source registrar
    "proxy.sipthor.net",
    "sip.sipthor.net",
    "sip.antisip.com",
    "sip.ippi.fr",
    "sip.voipbuster.com",
    "sip.voipstunt.com",
    "sip.freecall.com",
    "sip.powervoip.com",
    "sip.poivy.com",
    "sip.voipwise.com",
    "sip.internetcalls.com",
    "sip.counterpath.com",
    "sipml5.org",
    "sip.zoiper.com",
    "sip.microsip.org",
    "asterisk.org",
    "sip.asterisk.org",
    "sip.kamailio.org", // Kamailio open-source SIP
    "sip.opensips.org", // OpenSIPS
    "sip.freeswitch.org", // FreeSWITCH

    // 🟠 Enterprise / cloud PBX (EU/US, доступны из РФ)
    "sip.vonage.com",
    "sip.ringcentral.com",
    "sip.8x8.com",
    "sip.plivo.com",
    "sip.telnyx.com",
    "sip.bandwidth.com",
    "sip.twilio.com",
    "global.sip.twilio.com",
    "sip.infobip.com",
    "sip.messagebird.com",
    "sip.signalwire.com",
    "sip.did.telnyx.com",
    "sip.livekit.cloud",
    "sip.dialpad.com",
    "sip.aircall.io",
    "sip.3cx.com", // 3CX hosted SIP
  ],
};

/* ── Browser Fingerprint ───────────────────────────────────────────────────── */

/**
 * Таблица реальных размеров UDP payload по браузерам и протоколам.
 *
 * Источники: RFC 9000 §14.1, Chromium quiche, исследования перехваченного трафика.
 *
 *   qi  — QUIC Initial (Long Header 0xC0-0xC3)
 *          Chrome/Edge: 1250 (PADDING frame до фиксированного размера)
 *          Firefox:     1200–1252 (адаптируется, минимум RFC 9000)
 *          Safari:      1250 или 1252 (iOS 15+ измерения)
 *
 *   q0  — QUIC 0-RTT Early Data (Long Header 0xD0-0xD3)
 *          Зависит от данных; выравнивается по Initial-границе либо
 *          идёт на максимум MTU (~1350 байт для большого GET).
 *
 *   h3  — HTTP/3 DATA после хендшейка
 *          Браузеры стремятся использовать MTU по максимуму: ~1350 байт
 *          (MTU 1500 − 20 IP − 8 UDP − ~122 QUIC/TLS overhead).
 *
 *   tls — TLS 1.3 Client Hello ("голый" TLS поверх TCP)
 *          512–800 байт; Chrome выравнивает до кратного 128 байт.
 *
 *   nx  — WireGuard Noise_IK Initiation
 *          Строго 148 байт без padding. При включённом fp добивается до 1200–1250.
 *
 *   dtls — DTLS 1.2/1.3 Client Hello (WebRTC)
 *           Браузеры держат < 1200 байт для исключения IP-фрагментации.
 *
 * Формат: [min, max] байт UDP payload (без UDP/IP заголовков).
 */
var BFP = {
  //           qi              q0              h3              tls           nx              dtls
  chrome: {
    qi: [1250, 1250],
    q0: [1250, 1350],
    h3: [1250, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
  edge: {
    qi: [1250, 1250],
    q0: [1250, 1350],
    h3: [1250, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
  firefox: {
    qi: [1200, 1252],
    q0: [1200, 1300],
    h3: [1200, 1350],
    tls: [512, 700],
    nx: [1200, 1250],
    dtls: [1050, 1200],
  },
  safari: {
    qi: [1250, 1252],
    q0: [1250, 1300],
    h3: [1250, 1350],
    tls: [512, 750],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },

  // Яндекс Браузер — базируется на Chromium/quiche, но с оптимизациями для
  // российской инфраструктуры и собственных сервисов (Поиск, Дзен, Видео).
  //
  // Два суб-профиля:
  //   "desktop" — поведение десктопного Яндекс Браузера.
  //               QUIC Initial жёстко 1250 байт (как актуальный Chromium).
  //               DATA-пакеты HTTP/3 стремятся к максимуму MTU: 1350 байт.
  //
  //   "mobile"  — мобильный Яндекс Браузер / Turbo-прокси режим.
  //               QUIC Initial: 1232 байт (кратно 16, удобно для AES).
  //               0-RTT и DATA: 1250–1350 байт.
  //
  // ⚠ НЕСТАБИЛЬНЫЙ ПРОФИЛЬ: Параметры получены эмпирически и могут меняться
  //   между версиями браузера.
  yandex_desktop: {
    qi: [1250, 1250],
    q0: [1250, 1350],
    h3: [1350, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
  yandex_mobile: {
    qi: [1232, 1232],
    q0: [1250, 1350],
    h3: [1350, 1350],
    tls: [512, 800],
    nx: [1200, 1250],
    dtls: [1100, 1200],
  },
};

/**
 * YANDEX_UNSTABLE_PROFILES — профили, помеченные как нестабильные.
 * Используется в UI для отображения предупреждения.
 */
var YANDEX_UNSTABLE_PROFILES = ["yandex_desktop", "yandex_mobile"];

/* ── Pure utility functions ─────────────────────────────────────────────────── */

function rnd(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

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

/**
 * splitPad(n, tag) — разбивает N байт паддинга на один или несколько CPS-тегов,
 * строго соблюдая лимит AmneziaWG: не более 1000 байт на каждый тег <r>/<rc>/<rd>.
 *
 *   n    — суммарный размер паддинга в байтах
 *   tag  — 'r' | 'rc' | 'rd'  (по умолчанию 'r')
 *
 * Примеры:
 *   splitPad(1200)       → "<r 1000><r 200>"
 *   splitPad(2500)       → "<r 1000><r 1000><r 500>"
 *   splitPad(64, 'rc')   → "<rc 64>"
 *   splitPad(0)          → ""
 */
function splitPad(n, tag) {
  tag = tag || "r";
  n = Math.max(0, Math.floor(n));
  if (n === 0) return "";
  var out = "";
  while (n > 1000) {
    out += "<" + tag + " 1000>";
    n -= 1000;
  }
  out += "<" + tag + " " + n + ">";
  return out;
}

/**
 * calcPadding(headerB, extraB, range, iv, mtu) — вычисляет размер паддинга в байтах.
 *
 *   headerB — байты, занятые тегом <b 0x...>
 *   extraB  — байты от других фиксированных тегов (например <rc N>)
 *   range   — [min, max] из BFP или null
 *   iv      — intensity multiplier (fallback когда range=null)
 *   mtu     — MTU интерфейса (по умолчанию 1500); ограничивает максимум
 *
 * Если range задан: добивает occupied до min, с jitter до max, но не превышает MTU.
 * Если range null: обычный энтропийный размер (20-80 * iv, но ≤ 500 и ≤ MTU).
 *
 * ВАЖНО: возвращаемое значение — суммарный паддинг, который может превышать 1000.
 * Используй splitPad() для разбивки на CPS-теги при рендере.
 */
function calcPadding(headerB, extraB, range, iv, mtu) {
  mtu = mtu != null ? mtu : 1500;
  var maxPad = Math.max(0, mtu - headerB - extraB);

  if (!range) {
    return Math.min(rnd(20, 80) * iv, 500, maxPad);
  }

  var occupied = headerB + extraB;
  var min = range[0],
    max = range[1];

  // Ограничиваем целевой диапазон MTU
  var clampedMin = Math.min(min, mtu);
  var clampedMax = Math.min(max, mtu);

  var needed = Math.max(0, clampedMin - occupied);
  var jitter = Math.max(
    0,
    Math.min(clampedMax - clampedMin, clampedMax - occupied - needed, 20),
  );
  var pad = needed + (jitter > 0 ? rnd(0, jitter) : 0);
  return Math.min(pad, maxPad);
}

/**
 * alignTo128(n) — выравнивает размер TLS ClientHello до кратного 128 байт,
 * как это делает Chrome для скрытия набора расширений.
 */
function alignTo128(n) {
  return Math.ceil(n / 128) * 128;
}

/* ── Protocol generators ─────────────────────────────────────────────────────
 *
 * СОГЛАШЕНИЕ:
 *   - Все генераторы принимают (iv) — intensity value [1..3+].
 *   - DOM-читающие функции (getT, getHost, getFpRange, getUserMTU)
 *     определены в ui-script.js и доступны глобально к моменту вызова.
 *   - Для паддинга ВСЕГДА используем splitPad(pad), а НЕ "<r " + pad + ">",
 *     чтобы не нарушать лимит AmneziaWG: не более 1000 байт на один тег.
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * mkQUICi — QUIC Initial (RFC 9000, Long Header 0xC0-0xC3)
 *
 * Long Header layout (фиксированные поля):
 *   1B  flags       0xC0 | version_bits
 *   4B  version     0x00000001
 *   1B  dcid_len    (8–20)
 *   N   dcid
 *   1B  scid_len    (0–20)
 *   M   scid
 *   1B  token_len   (0 или 8–32)
 *   K   token
 *   4B  reserved/PN
 *
 * Браузерный padding (RFC 9000 §14.1):
 *   Chrome/Edge → 1250 байт фиксированно
 *   Firefox     → 1200–1252 байт (адаптивный)
 *   Safari      → 1250–1252 байт
 */
function mkQUICi(iv) {
  var host = getHost("quic_initial");
  var dcid = rnd(8, 20);
  var scid = rnd(0, 20);
  var tokenLen = rnd(0, 1) === 0 ? 0 : rnd(8, 32);
  var sniRc = Math.min(host.length + rnd(0, 6), 64);

  var hex = assertEvenHex(
    hexPad(0xc0 | rnd(0, 3), 1) + // 1B  flags
      "00000001" + // 4B  version = 1
      hexPad(dcid, 1) + // 1B  DCID length
      rh(dcid) + // N   DCID
      hexPad(scid, 1) + // 1B  SCID length
      rh(scid) + // M   SCID
      hexPad(tokenLen, 1) + // 1B  token length
      rh(tokenLen) + // K   token
      rh(4), // 4B  reserved / Packet Number
    "mkQUICi",
  );

  var mtu = getUserMTU();
  var headerB = hex.length / 2;
  var extraB = getT("useTagRC") ? sniRc : 0;
  var pad = calcPadding(headerB, extraB, getFpRange("qi"), iv, mtu);

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagRC") ? "<rc " + sniRc + ">" : "") +
    (getT("useTagC") ? "<c>" : "") +
    (getT("useTagT") ? "<t>" : "") +
    (getT("useTagR") ? splitPad(pad) : "")
  );
}

/**
 * mkQUIC0 — QUIC 0-RTT Early Data (Long Header 0xD0-0xD3)
 *
 * Размер вариативен: зависит от данных запроса (обычно GET + заголовки).
 * Браузеры выравнивают по той же 1250-байтной границе, что и Initial,
 * или идут до ~1350 байт при большом запросе (ближе к MTU).
 *
 * Layout аналогичен Initial, но flags = 0xD0–0xD3.
 * ticketHint в <rc> имитирует TLS session-ticket hint (ASCII).
 */
function mkQUIC0(iv) {
  var host = getHost("quic_0rtt");
  var dcid = rnd(8, 20);
  var scid = rnd(0, 20);
  var ticketHint = Math.min(host.length + rnd(4, 16), 48);

  var hex = assertEvenHex(
    hexPad(0xd0 | rnd(0, 3), 1) + // 1B  flags (0-RTT type)
      "00000001" + // 4B  version = 1
      hexPad(dcid, 1) + // 1B  DCID length
      rh(dcid) + // N   DCID
      hexPad(scid, 1) + // 1B  SCID length
      rh(scid) + // M   SCID
      rh(4), // 4B  reserved / Packet Number
    "mkQUIC0",
  );

  var mtu = getUserMTU();
  var headerB = hex.length / 2;
  var extraB = getT("useTagRC") ? ticketHint : 0;
  var pad = calcPadding(headerB, extraB, getFpRange("q0"), iv, mtu);

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagT") ? "<t>" : "") +
    (getT("useTagR") ? splitPad(pad) : "") +
    (getT("useTagRC") ? "<rc " + ticketHint + ">" : "") +
    (getT("useTagC") ? "<c>" : "")
  );
}

/**
 * mkTLS — TLS 1.3 Client Hello (поверх TCP или внутри QUIC Initial)
 *
 * TLS Record layout:
 *   1B  content_type   0x16 (Handshake)
 *   2B  legacy_version 0x0301
 *   2B  record_length  (300–550)
 *   1B  hs_type        0x01 (ClientHello)
 *   3B  hs_length      (record_length − 4..9)
 *   2B  client_version 0x0303 (TLS 1.2 legacy field)
 *  32B  client random
 *
 * Размер "голого" TLS: 512–800 байт.
 * Chrome выравнивает итоговый ClientHello до кратного 128 байт (padding ext 0x0015).
 * Внутри QUIC Initial этот TLS-фрейм упакован в пакет 1250 байт.
 *
 * BFP-диапазон "tls" применяется только если fp включён.
 */
function mkTLS(iv) {
  var host = getHost("tls_client_hello");
  var sniExt = 2 + 2 + 2 + 1 + 2 + host.length; // SNI extension size estimate
  var sniRc = Math.min(sniExt, 64);

  // record length: выбираем базу, затем выравниваем до 128 если активен
  // Chromium-based профиль (Chrome, Edge, Яндекс) — как делает quiche.
  var fpRange = getFpRange("tls");
  var baseLen = fpRange ? rnd(fpRange[0], fpRange[1]) : rnd(300, 550);
  var chromiumLike = ["chrome", "edge", "yandex_desktop", "yandex_mobile"];
  var recLen =
    chromiumLike.indexOf(getBrowserFpProfile()) !== -1
      ? alignTo128(baseLen)
      : baseLen;
  var hsLen = recLen - rnd(4, 9);

  var mtu = getUserMTU();
  var rLen = Math.min(rnd(20, 60) * iv, 300, Math.max(0, mtu - 44 - sniRc));

  var hex = assertEvenHex(
    "160301" + // 3B  record type (0x16) + legacy version (0x0301)
      hexPad(recLen, 2) + // 2B  record length
      "01" + // 1B  handshake type = ClientHello
      hexPad(hsLen, 3) + // 3B  handshake length
      "0303" + // 2B  client_version (TLS 1.2 legacy)
      rh(32), // 32B client random
    "mkTLS",
  );

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagRC") ? "<rc " + sniRc + ">" : "") +
    (getT("useTagR") ? splitPad(rLen) : "") +
    (getT("useTagC") ? "<c>" : "") +
    (getT("useTagT") ? "<t>" : "")
  );
}

/**
 * mkNoise — WireGuard Noise_IK Handshake Initiation
 *
 * Структура пакета (строго 148 байт без padding):
 *   4B  message_type + reserved   0x01000000
 *   4B  sender_index              (random)
 *  32B  ephemeral public key      (random)
 *  48B  encrypted static key      (random, Poly1305-тег включён)
 *  28B  encrypted timestamp       (random, Poly1305-тег включён)
 *  16B  MAC1
 *  16B  MAC2
 *   = 148 байт
 *
 * DPI легко идентифицирует Noise по фиксированному размеру 148 байт.
 * При включённом браузерном fp добиваем до 1200–1250 байт через splitPad(<r>),
 * имитируя QUIC-обёртку.
 */
function mkNoise(iv) {
  var rcLen = rnd(4, 12);

  // Noise_IK Initiation: итого 4+4+32+48+28+16+16 = 148 байт
  var headerB = 148;

  var mtu = getUserMTU();
  var extraB = getT("useTagRC") ? rcLen : 0;
  var range = getFpRange("nx");
  var pad = range
    ? calcPadding(headerB, extraB, range, iv, mtu)
    : Math.min(rnd(10, 40) * iv, 200, Math.max(0, mtu - headerB - extraB));

  return (
    "<b 0x01000000" +
    rh(4) +
    ">" + // 4B type=1 + 3B reserved + 4B sender_index
    "<b 0x" +
    rh(32) +
    ">" + // 32B ephemeral public key
    "<b 0x" +
    rh(48) +
    ">" + // 48B encrypted static  (32B key + 16B tag)
    "<b 0x" +
    rh(28) +
    ">" + // 28B encrypted timestamp (12B ts + 16B tag)
    "<b 0x" +
    rh(32) +
    ">" + // 32B MAC1 + MAC2
    (getT("useTagR") ? splitPad(pad) : "") +
    (getT("useTagT") ? "<t>" : "") +
    (getT("useTagRC") ? "<rc " + rcLen + ">" : "")
  );
}

/**
 * mkDTLS — DTLS 1.2 Client Hello (WebRTC)
 *
 * DTLS Record layout:
 *   1B  content_type   0x16 (Handshake)
 *   2B  version        0xFEFD (DTLS 1.2)
 *   2B  epoch          (0–255, hexPad гарантирует 4 символа)
 *   6B  sequence_number
 *   2B  fragment_length
 *   1B  hs_type        0x01 (ClientHello)
 *   3B  hs_length + 2B msg_seq + 1B pad
 *   2B  dtls_version   0xFEFD
 *   2B  cookie_length  0x0000
 *   4B  random prefix
 *  32B  random
 *
 * Браузеры держат ClientHello < 1200 байт чтобы исключить IP-фрагментацию:
 * DTLS не умеет пересобирать фрагменты на этапе хендшейка.
 * BFP-диапазон "dtls": 1050–1200 байт.
 */
function mkDTLS(iv) {
  var host = getHost("dtls");
  var fragLen = rnd(100, 300);
  var sniRc = Math.min(host.length + rnd(2, 8), 60);
  var epoch = rnd(0, 255);

  var hex = assertEvenHex(
    "16" + // 1B  content_type = Handshake
      "fefd" + // 2B  version = DTLS 1.2
      hexPad(epoch, 2) + // 2B  epoch (hexPad → ровно 4 hex-символа)
      rh(6) + // 6B  sequence number
      hexPad(fragLen, 2) + // 2B  fragment length
      "01" + // 1B  hs_type = ClientHello
      rh(6) + // 3B hs_len + 2B msg_seq + 1B pad
      "fefd0000" + // 2B dtls_version + 2B cookie_len
      rh(4) + // 4B  random prefix
      rh(32), // 32B random
    "mkDTLS",
  );

  var mtu = getUserMTU();
  var headerB = hex.length / 2;
  var extraB = getT("useTagRC") ? sniRc : 0;
  var pad = calcPadding(headerB, extraB, getFpRange("dtls"), iv, mtu);

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagRC") ? "<rc " + sniRc + ">" : "") +
    (getT("useTagC") ? "<c>" : "") +
    (getT("useTagT") ? "<t>" : "") +
    (getT("useTagR") ? splitPad(pad) : "")
  );
}

/**
 * mkHTTP3 — HTTP/3 Host Mimicry (QUIC Long Header, расширенный набор типов)
 *
 * Стратегия: копируем поведение Chrome QUIC.
 *   - Хендшейк (Initial/0-RTT): 1250 байт
 *   - DATA пакеты после хендшейка: до MTU ~1350 байт
 *
 * Используем расширенный набор type-байт (0xC0-0xC3, 0xE0-0xE2) для большего
 * разнообразия — часть из них соответствует QUIC v2 и черновым расширениям.
 */
function mkHTTP3(iv) {
  var host = getHost("quic_initial");
  var ptypes = [0xc0, 0xc1, 0xc2, 0xc3, 0xe0, 0xe1, 0xe2];
  var dcid = rnd(8, 20);
  var scid = rnd(0, 20);
  var sniLen = Math.min(host.length + 9 + rnd(0, 6), 64);

  var hex = assertEvenHex(
    hexPad(ptypes[rnd(0, ptypes.length - 1)], 1) + // 1B  flags (QUIC Long Header variant)
      "00000001" + // 4B  version = 1
      hexPad(dcid, 1) + // 1B  DCID length
      rh(dcid) + // N   DCID
      hexPad(scid, 1) + // 1B  SCID length
      rh(scid) + // M   SCID
      rh(4), // 4B  reserved / Packet Number
    "mkHTTP3",
  );

  var mtu = getUserMTU();
  var headerB = hex.length / 2;
  var extraB = getT("useTagRC") ? sniLen : 0;
  // HTTP/3 DATA после хендшейка стремится к MTU: используем слот h3 (1250–1350)
  var pad = calcPadding(headerB, extraB, getFpRange("h3"), iv, mtu);

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagRC") ? "<rc " + sniLen + ">" : "") +
    (getT("useTagR") ? splitPad(pad) : "") +
    (getT("useTagC") ? "<c>" : "") +
    (getT("useTagT") ? "<t>" : "")
  );
}

/**
 * mkSIP — SIP REGISTER request (VoIP Signaling)
 *
 * "REGISTER sip:<host> " в hex-форме:
 *   "REGISTER sip:" = 13 ASCII-байт = 26 hex (чётное)
 *   hostHex         = host.length * 2 hex (чётное — каждый ASCII → 2 hex)
 *   " " (0x20)      = 2 hex
 *   rh(4)           = 8 hex
 *   Итого: гарантированно чётное.
 *
 * SIP — специфичный VoIP-протокол, не браузерный.
 * BFP не применяется; используем умеренный энтропийный размер.
 */
function mkSIP(iv) {
  var host = getHost("sip");
  var hostHex = "";
  for (var i = 0; i < host.length; i++)
    hostHex += ("0" + host.charCodeAt(i).toString(16)).slice(-2);

  var hex = assertEvenHex(
    "524547495354455220736970" + // "REGISTER sip"
      "3a" + // ":"
      hostHex + // host as ASCII hex
      "20" + // " " (SP)
      rh(4), // 4B random suffix
    "mkSIP",
  );

  var mtu = getUserMTU();
  var headerB = hex.length / 2;
  var rcVal = Math.min(host.length + rnd(8, 24) * iv, 150);
  var rLen = Math.min(rnd(5, 30) * iv, 120, Math.max(0, mtu - headerB - rcVal));

  return (
    "<b 0x" +
    hex +
    ">" +
    (getT("useTagRC") ? "<rc " + rcVal + ">" : "") +
    (getT("useTagC") ? "<c>" : "") +
    (getT("useTagT") ? "<t>" : "") +
    (getT("useTagR") ? splitPad(rLen) : "")
  );
}

/**
 * mkEntropy — генерирует пакеты энтропии (I2-I5).
 *
 * Создаёт смесь из случайных данных, времени и счётчиков для обхода
 * статистического анализа DPI.
 */
function mkEntropy(idx, iv) {
  var mtu = getUserMTU();
  var rLen = Math.min(rnd(10, 40) * iv, 300, Math.max(0, mtu - 20)),
    rcLen = rnd(4, 12),
    rdLen = rnd(4, 8);

  var tags = {
    c: getT("useTagC") ? "<c>" : "",
    t: getT("useTagT") ? "<t>" : "",
    r: getT("useTagR") ? splitPad(rLen) : "",
    rc: getT("useTagRC") ? "<rc " + rcLen + ">" : "",
    rd: getT("useTagRD") ? "<rd " + rdLen + ">" : "",
    b: "",
  };

  if (iv >= 2) {
    tags.b = "<b 0x" + rh(rnd(4, 8 * iv)) + ">";
  }

  // Набор шаблонов для перемешивания тегов
  var p = [
    tags.b + tags.r + tags.t + tags.rc + tags.c + tags.rd,
    tags.c + tags.t + tags.b + tags.r + tags.rc + tags.rd,
    tags.rc + tags.b + tags.r + tags.c + tags.t + tags.rd,
    tags.t + tags.r + tags.c + tags.rc + tags.b + tags.rd,
    tags.r + tags.rc + tags.b + tags.t + tags.c + tags.rd,
  ];

  var res = p[(idx + rnd(0, 4)) % p.length];
  // Если все теги выключены, гарантируем хотя бы минимальный шум
  return res || "<r 10>";
}

/**
 * genI1 — главный распределитель для генерации первого пакета (I1).
 * Вызывает специализированную функцию в зависимости от выбранного протокола мимикрии.
 */
function genI1(profile, iv) {
  var m = {
    quic_initial: function () {
      return mkQUICi(iv);
    },
    quic_0rtt: function () {
      return mkQUIC0(iv);
    },
    tls_client_hello: function () {
      return mkTLS(iv);
    },
    wireguard_noise: function () {
      return mkNoise(iv);
    },
    dtls: function () {
      return mkDTLS(iv);
    },
    http3: function () {
      return mkHTTP3(iv);
    },
    sip: function () {
      return mkSIP(iv);
    },
  };
  if (profile === "random") {
    var k = Object.keys(m);
    return genI1(k[rnd(0, k.length - 1)], iv);
  }
  return (m[profile] || m.quic_initial)();
}

/**
 * genCfg — основная функция сборки конфигурации.
 *
 * Рассчитывает все параметры (H1-H4, S1-S4, Junk, I1-I5) на основе
 * выбранной версии протокола, интенсивности и истории неудачных попыток (iter).
 * Читает DOM для получения текущих настроек UI.
 */
function genCfg() {
  var profile = document.getElementById("quicProfile").value;
  var jc = parseInt(document.getElementById("junkLevel").value);
  var mimicAllElem = document.getElementById("mimicAll");
  var doMimicAll = mimicAllElem && mimicAllElem.checked;
  var imap = { low: 1, medium: 2, high: 3 };
  var boost = iter * 5;
  var iv = imap[inten] + (iter > 3 ? 1 : 0);

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
  var s3 = Math.min(64, rnd(8, 24) + boost);
  var s4 = Math.min(32, rnd(6, 18) + boost);

  // Оптимизация Junk-параметров на основе фидбэка разработчиков AmneziaWG
  // Для AWG 1.0 (и в целом для стабильности) Jc должен быть >= 4, а Jmax > 81
  var minJc = ver === "1.0" ? 4 : 3;
  var jcv = Math.max(minJc, Math.min(10, jc + (inten === "high" ? 2 : 0)));

  var jmin = 64 + boost * 2;
  var baseJmax = ver === "1.0" ? 128 : 256; // Гарантируем Jmax > 81 для v1.0
  var jmax = Math.min(1280, baseJmax + iv * 150 + boost * 10);

  return {
    h1,
    h2,
    h3,
    h4,
    h1s,
    h2s,
    h3s,
    h4s,
    s1,
    s2,
    s3,
    s4,
    jc: jcv,
    jmin,
    jmax,
    i1: genI1(profile, iv),
    i2: doMimicAll ? genI1(profile, iv) : mkEntropy(1, iv),
    i3: doMimicAll ? genI1(profile, iv) : mkEntropy(2, iv),
    i4: doMimicAll ? genI1(profile, iv) : mkEntropy(3, iv),
    i5: doMimicAll ? genI1(profile, iv) : mkEntropy(4, iv),
    profile,
  };
}
