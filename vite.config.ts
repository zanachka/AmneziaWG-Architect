import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import fs from "node:fs";
import type { Plugin } from "vite";
import { fileURLToPath } from "node:url";

interface RouteStub {
  slug: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

const ROUTE_STUBS: RouteStub[] = [
  {
    slug: "mergekeys",
    title: "MergeKeys — AmneziaWG Architect",
    description:
      "Обновите обфускацию AWG-ключа или объедините несколько ключей Amnezia VPN в один.",
    ogTitle: "MergeKeys — AmneziaWG Architect",
    ogDescription:
      "Объединяй ключи Amnezia VPN, обновляй обфускацию — всё локально в браузере.",
    ogImage: "og-mergekeys.png",
  },
  {
    slug: "about",
    title: "О проекте — AmneziaWG Architect",
    description:
      "Что такое AmneziaWG Architect? Это интерактивный инструмент для генерации сложных конфигураций обфускации трафика AmneziaWG. Создан для тех, кто хочет вернуть себе свободный интернет.",
    ogTitle: "О проекте — AmneziaWG Architect",
    ogDescription:
      "Твой протокол — твои правила. Разбор архитектуры, безопасности и принципов работы генератора.",
    ogImage: "og-about.png",
  },
  {
    slug: "iaa",
    title: "IAA — Веб-панель VPN",
    description:
      "Быстрая адаптивная панель для управления Amnezia VPN и другими VPN-решениями.",
    ogTitle: "IAA — Веб-панель VPN",
    ogDescription:
      "Быстрая адаптивная панель для управления VPN-серверами. Amnezia, WireGuard, XRay.",
    ogImage: "og-iaa.png",
  },
];

export type HostPlatform = "github" | "gitlab" | "cloudflare" | "generic";

export function detectHostPlatform(): HostPlatform {
  const platform = (
    process.env.VITE_DEPLOY_PLATFORM ||
    process.env.DEPLOY_PLATFORM ||
    (process.env.GITHUB_ACTIONS && "github") ||
    (process.env.GITLAB_CI && "gitlab") ||
    (process.env.CF_PAGES && "cloudflare") ||
    "generic"
  )
    .toString()
    .toLowerCase();

  if (platform.includes("gitlab")) return "gitlab";
  if (platform.includes("cloudflare") || platform.includes("cf"))
    return "cloudflare";
  if (platform.includes("github")) return "github";
  return "generic";
}

export function normalizeBase(input?: string | null): string {
  if (!input) return "/";
  let base = input.trim();

  if (base === "." || base === "./") return "./";

  if (base === "/") return "/";

  base = base.replace(/\\/g, "/");
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base += "/";

  return base;
}

export function inferBase(): string {
  const explicit =
    process.env.VITE_BASE ||
    process.env.BASE_URL ||
    process.env.ASSET_BASE ||
    process.env.PUBLIC_URL;

  if (explicit) return normalizeBase(explicit);

  const platform = detectHostPlatform();

  if (platform === "cloudflare") {
    return "/";
  }

  if (platform === "github") {
    const repo = process.env.GITHUB_REPOSITORY;
    if (repo) {
      const [, name] = repo.split("/");
      if (name) {
        return `/${name}/`;
      }
    }
    return "/";
  }

  if (platform === "gitlab") {
    const pagesUrl = process.env.CI_PAGES_URL;
    if (pagesUrl) {
      try {
        const urlObj = new URL(pagesUrl);
        return normalizeBase(urlObj.pathname);
      } catch (e) {}
    }
    return "/";
  }

  return "./";
}

export function inferSiteOrigin(): string {
  const explicit =
    process.env.VITE_SITE_ORIGIN ||
    process.env.SITE_ORIGIN ||
    process.env.VITE_PUBLIC_SITE_URL ||
    process.env.PUBLIC_SITE_URL;

  if (explicit) return explicit.replace(/\/+$/, "");

  const repo = process.env.GITHUB_REPOSITORY;
  if (repo && process.env.GITHUB_ACTIONS) {
    const [owner, name] = repo.split("/");
    if (owner && name) {
      return `https://${owner.toLowerCase()}.github.io/${name}`;
    }
  }

  const gitlabProject = process.env.CI_PROJECT_PATH;
  const gitlabUrl = process.env.CI_PAGES_URL || process.env.PAGES_URL;
  if (gitlabUrl) return gitlabUrl.replace(/\/+$/, "");
  if (gitlabProject && process.env.CI_SERVER_HOST) {
    return `https://${process.env.CI_SERVER_HOST}/${gitlabProject}`;
  }

  const cfUrl =
    process.env.CF_PAGES_URL ||
    process.env.CLOUDFLARE_PAGES_URL ||
    process.env.PAGES_URL;
  if (cfUrl) return cfUrl.replace(/\/+$/, "");

  return "";
}

export function makeAbsoluteUrl(
  siteOrigin: string,
  base: string,
  assetPath: string,
): string {
  const cleanAsset = assetPath.replace(/^\.?\//, "");
  if (!siteOrigin) {
    return `${base}${cleanAsset}`.replace(/\/{2,}/g, "/").replace(":/", "://");
  }
  return new URL(
    cleanAsset,
    siteOrigin.endsWith("/") ? siteOrigin : `${siteOrigin}/`,
  ).toString();
}

export function buildStubHtml(
  template: string,
  route: RouteStub,
  siteOrigin: string,
  base: string,
): string {
  const absImage = makeAbsoluteUrl(siteOrigin, base, `assets/${route.ogImage}`);

  let html = template;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`,
  );

  if (html.includes('property="og:title"')) {
    html = html.replace(
      /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
      `$1${route.ogTitle}$2`,
    );
  }

  if (html.includes('property="og:description"')) {
    html = html.replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
      `$1${route.ogDescription}$2`,
    );
  }

  if (html.includes('property="og:image"')) {
    html = html.replace(
      /(<meta\s+property="og:image"\s+content=")[^"]*(")/,
      `$1${absImage}$2`,
    );
  }

  if (html.includes('name="robots"')) {
    html = html.replace(
      /(<meta\s+name="robots"\s+content=")[^"]*(")/,
      `$1index,follow$2`,
    );
  } else {
    html = html.replace(
      /<\/title>/,
      `</title>\n    <meta name="robots" content="index,follow" />`,
    );
  }

  return html;
}

function createSpaFallbackPlugin(): Plugin {
  return {
    name: "amneziawg-architect-spa-fallback",
    enforce: "post",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const indexPath = path.join(outDir, "index.html");
      const fallback404 = path.join(outDir, "404.html");

      if (!fs.existsSync(indexPath)) return;

      const rawIndex = fs.readFileSync(indexPath, "utf-8");
      const base = inferBase();
      const siteOrigin = inferSiteOrigin();
      const isRelativeBase = base === "./";
      const effectiveBase = isRelativeBase ? "/" : base;

      const restoreScript = `
    <script>
      (function () {
        var key = "awg_spa_path";
        try {
          var saved = sessionStorage.getItem(key);
          if (saved) {
            sessionStorage.removeItem(key);
            var current = location.pathname + location.search + location.hash;
            if (saved !== current) {
              history.replaceState(null, "", saved);
            }
          }
        } catch (e) {}
      })();
    </script>`;

      const indexWithRestore = rawIndex.includes("awg_spa_path")
        ? rawIndex
        : rawIndex.replace("<head>", `<head>${restoreScript}`);

      fs.writeFileSync(indexPath, indexWithRestore, "utf-8");

      const redirectHtml = `<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex,nofollow" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Маршрутизация — AmneziaWG Architect</title>
    <style>
      :root {
        --bg: #0a0806;
        --card: rgba(232, 168, 64, 0.06);
        --border: rgba(232, 168, 64, 0.22);
        --text: #e0d4b8;
        --muted: #b6a37b;
        --accent: #f5c060;
        --accent-2: #e8a840;
      }

      * { box-sizing: border-box; }

      html, body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background: radial-gradient(circle at 50% 0%, rgba(232, 168, 64, 0.08), transparent 50%), var(--bg);
        color: var(--text);
        font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        display: flex;
        flex-direction: column;
      }

      .site-header {
        padding: 16px 24px;
        border-bottom: 1px solid rgba(232, 168, 64, 0.1);
        background: rgba(10, 8, 6, 0.6);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        text-align: center;
      }

      .site-header h2 {
        margin: 0;
        font-family: "Unbounded", "Manrope", sans-serif;
        font-size: 18px;
        color: var(--accent);
        letter-spacing: 0.5px;
      }

      .main-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .wrap {
        width: 100%;
        max-width: 540px;
        border: 1px solid var(--border);
        background: linear-gradient(180deg, rgba(232,168,64,0.06), rgba(232,168,64,0.02));
        border-radius: 20px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
        padding: 40px 32px;
        text-align: center;
      }

      h1 {
        margin: 0 0 12px;
        font-family: "Unbounded", "Manrope", sans-serif;
        font-size: clamp(22px, 4vw, 26px);
        line-height: 1.3;
      }

      p {
        margin: 0 0 20px;
        color: var(--muted);
        line-height: 1.6;
      }

      .meta {
        font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 13px;
        color: #d2be92;
        opacity: 0.9;
        word-break: break-all;
        margin: 12px 0 24px;
        padding: 12px;
        border-radius: 8px;
        border: 1px dashed rgba(232,168,64,0.3);
        background: rgba(0,0,0,0.25);
        display: inline-block;
      }

      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .btn {
        appearance: none;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 12px 20px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.15s ease;
      }

      .btn-primary {
        color: #241a0b;
        background: linear-gradient(180deg, var(--accent), var(--accent-2));
        border-color: rgba(255, 220, 140, 0.65);
        box-shadow: 0 6px 20px rgba(232, 168, 64, 0.2);
      }

      .btn-secondary {
        color: var(--text);
        background: rgba(232,168,64,0.08);
      }

      .btn:hover { transform: translateY(-2px); }
      .btn:active { transform: translateY(0); }

      .hint {
        margin-top: 24px;
        font-size: 13px;
        color: #c7b284;
        opacity: 0.8;
      }

      .site-footer {
        padding: 24px;
        text-align: center;
        font-size: 13px;
        color: var(--muted);
        border-top: 1px solid rgba(232, 168, 64, 0.08);
        background: rgba(10, 8, 6, 0.4);
      }

      @media (max-width: 480px) {
        .wrap { padding: 28px 20px; }
        .actions { flex-direction: column; width: 100%; }
        .btn { width: 100%; }
      }
    </style>
    <script>
      (function () {
        var BASE = ${JSON.stringify(effectiveBase)};
        var KEY = "awg_spa_path";
        var path = location.pathname + location.search + location.hash;

        function normalizeBase(base) {
          if (!base || base === "./") return "/";
          return base;
        }

        function goHome() {
          var target = normalizeBase(BASE);
          location.replace(target);
        }

        function ensureStoredPath() {
          try {
            sessionStorage.setItem(KEY, path);
          } catch (e) {}
        }

        var isKnownRoute = false;
        var knownRoutes = ${JSON.stringify(ROUTE_STUBS.map((r) => r.slug))};
        var currentSlug = path.split('/')[1];
        if (currentSlug) {
            isKnownRoute = knownRoutes.indexOf(currentSlug.split('?')[0].split('#')[0]) !== -1;
        }

        function bootstrapAutoRedirect() {
          if (!isKnownRoute && location.pathname !== "/404.html" && location.pathname !== "/") {
            // Not a known route, don't auto-redirect, show 404 UI
            document.documentElement.classList.add("show-404");
            return;
          }

          ensureStoredPath();
          try {
            if (normalizeBase(BASE) === "/" && location.pathname === "/404.html") {
              location.replace("/");
              return;
            }
            location.replace(normalizeBase(BASE));
          } catch (e) {
            document.documentElement.classList.add("show-redirect");
          }
        }

        window.__AWG_404__ = {
          base: normalizeBase(BASE),
          path: path,
          goHome: goHome,
        };

        window.onload = bootstrapAutoRedirect;
      })();
    </script>
    <style>
      .ui-redirect, .ui-404 { display: none; }
      html.show-redirect .ui-redirect { display: block; }
      html.show-404 .ui-404 { display: block; }

      /* If JS is disabled or taking too long, fallback to showing redirect UI */
      noscript .ui-redirect { display: block; }
    </style>
</head>
<body>
  <header class="site-header">
    <h2>AmneziaWG Architect</h2>
  </header>

  <div class="main-content">
    <main class="wrap" role="main" aria-live="polite">
      <!-- UI for failed auto-redirect -->
      <div class="ui-redirect">
        <h1>Упс... Авто-переход не сработал</h1>
        <p>
          Мы попытались загрузить приложение, но ваш браузер заблокировал автоматический редирект.
          Пожалуйста, нажмите на кнопку ниже.
        </p>

        <div class="meta" id="debugPath">Определяем путь...</div>

        <div class="actions">
          <button class="btn btn-primary" id="goBtn" type="button">
            Перейти к странице
          </button>
          <a class="btn btn-secondary" id="rootLink" href="/">
            На главную
          </a>
        </div>

        <div class="hint">
          Если проблема повторяется, обновите страницу с очисткой кэша (Ctrl+F5).
        </div>
      </div>

      <!-- UI for actual 404 (unknown route) -->
      <div class="ui-404">
        <h1>404 — Страница не найдена</h1>
        <p>
          Кажется, вы перешли по неверной ссылке или эта страница была удалена.
        </p>

        <div class="actions">
          <a class="btn btn-primary" id="rootLink404" href="/">
            Вернуться на главную
          </a>
        </div>
      </div>
    </main>
  </div>

  <footer class="site-footer">
    &copy; ${new Date().getFullYear()} AmneziaWG Architect
  </footer>

  <script>
    (function () {
      var state = window.__AWG_404__ || { base: "/", path: location.pathname + location.search + location.hash };
      var debug = document.getElementById("debugPath");
      var goBtn = document.getElementById("goBtn");
      var rootLink = document.getElementById("rootLink");
      var rootLink404 = document.getElementById("rootLink404");

      if (debug) {
        debug.textContent = "Путь: " + state.path + " | Base: " + state.base;
      }

      var baseHref = state.base || "/";

      if (rootLink) rootLink.setAttribute("href", baseHref);
      if (rootLink404) rootLink404.setAttribute("href", baseHref);

      if (goBtn) {
        goBtn.addEventListener("click", function () {
          try {
            sessionStorage.setItem("awg_spa_path", state.path);
          } catch (e) {}
          location.replace(baseHref);
        });
      }

      // Fallback: if body is shown but no classes added by bootstrapAutoRedirect,
      // it means JS executed but logic failed to decide. Show redirect UI just in case.
      setTimeout(function() {
        if (!document.documentElement.classList.contains('show-404') &&
            !document.documentElement.classList.contains('show-redirect')) {
          document.documentElement.classList.add('show-redirect');
        }
      }, 1000);
    })();
  </script>
</body>
</html>`;

      fs.writeFileSync(fallback404, redirectHtml, "utf-8");

      for (const route of ROUTE_STUBS) {
        const stubDir = path.join(outDir, route.slug);
        const stubIndex = path.join(stubDir, "index.html");

        fs.mkdirSync(stubDir, { recursive: true });
        fs.writeFileSync(
          stubIndex,
          buildStubHtml(rawIndex, route, siteOrigin, effectiveBase),
          "utf-8",
        );
      }

      if (base === "./") {
        const cfPages = path.join(outDir, "_redirects");
        const gitlabPages = path.join(outDir, "200.html");

        const rewriteRules = [
          "/*    /index.html   200",
          "/mergekeys    /mergekeys/index.html   200",
          "/about    /about/index.html   200",
          "/iaa    /iaa/index.html   200",
        ].join("\n");

        fs.writeFileSync(cfPages, rewriteRules, "utf-8");
        fs.writeFileSync(gitlabPages, rawIndex, "utf-8");
      }

      if (
        process.env.GITHUB_ACTIONS ||
        process.env.GITLAB_CI ||
        process.env.CF_PAGES
      ) {
        console.log(`[spa] base=${base} siteOrigin=${siteOrigin || "(auto)"}`);
      }
    },
  };
}

function createMultiHostBuildPlugin(): Plugin {
  return {
    name: "amneziawg-architect-multi-host-build",
    configResolved(config) {
      if (config.base && config.base !== "./" && config.base !== "/") return;
    },
  };
}

const base = inferBase();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue(), createSpaFallbackPlugin(), createMultiHostBuildPlugin()],
  base,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "esbuild",
    sourcemap: true,
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    open: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
  },
});

export const test = {
  globals: true,
  environment: "node",
  include: ["src/**/__tests__/**/*.test.ts"],
  coverage: {
    provider: "v8",
    reporter: ["text", "json-summary", "html"],
    include: ["src/utils/**/*.ts"],
    exclude: ["src/utils/__tests__/**"],
  },
};
