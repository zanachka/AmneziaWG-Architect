/**
 * Проверка доступности доменов для мимикрии.
 *
 * Стратегия:
 * 1. Быстрая проверка по курированному списку заблокированных доменов (синхронная)
 * 2. Опциональная сетевая проверка через HEAD-запрос с 3с таймаутом
 *    - CORS-ошибка = домен жив (DNS resolved, сервер ответил)
 *    - TypeError = домен недоступен (DNS fail или connection refused)
 */

export interface DomainCheckResult {
    domain: string;
    accessible: boolean;
    method: "blocklist" | "fetch" | "offline";
    error?: string;
}

/** Домены, заблокированные в РФ по состоянию на Q1 2026 */
export const KNOWN_BLOCKED: ReadonlySet<string> = new Set([
    "youtube.com",
    "youtu.be",
    "googlevideo.com",
    "cloudflare.com",
    "cdnjs.cloudflare.com",
    "discord.com",
    "discord.gg",
    "discordapp.com",
    "facebook.com",
    "fb.com",
    "instagram.com",
    "whatsapp.com",
    "whatsapp.net",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "t.co",
    "stun.l.google.com",
    "stun1.l.google.com",
    "t.me",
    "cdn.telegram.org",
]);

/** Синхронная проверка по списку */
export function isKnownBlocked(domain: string): boolean {
    const d = domain.toLowerCase().trim();
    for (const blocked of KNOWN_BLOCKED) {
        if (d === blocked || d.endsWith("." + blocked)) return true;
    }
    return false;
}

/** Асинхронная сетевая проверка */
export async function checkDomain(domain: string): Promise<DomainCheckResult> {
    if (isKnownBlocked(domain)) {
        return { domain, accessible: false, method: "blocklist" };
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
        return { domain, accessible: true, method: "offline" };
    }

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);

        await fetch(`https://${domain}`, {
            method: "HEAD",
            mode: "no-cors",
            signal: controller.signal,
        });

        clearTimeout(timer);
        return { domain, accessible: true, method: "fetch" };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("abort")) {
            return { domain, accessible: false, method: "fetch", error: "timeout" };
        }
        return { domain, accessible: false, method: "fetch", error: msg };
    }
}
