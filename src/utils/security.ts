import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const firstIp = xff.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (!email) return null;
  if (email.length > 254) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return null;
  return email;
}

export function consumeRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const current = rateLimitStore.get(opts.key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return {
      ok: true,
      remaining: Math.max(0, opts.limit - 1),
      retryAfterSec: Math.ceil(opts.windowMs / 1000),
    };
  }

  if (current.count >= opts.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  rateLimitStore.set(opts.key, current);
  return {
    ok: true,
    remaining: Math.max(0, opts.limit - current.count),
    retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

/** Compara hosts ignorando diferença www / apex (comum em produção com redirecionamentos). */
function hostsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const stripWww = (h: string) => (h.startsWith("www.") ? h.slice(4) : h);
  return stripWww(a) === stripWww(b);
}

export function shouldAllowMutationFromOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  const originHost = parsedOrigin.hostname.toLowerCase();

  const requestHost = req.nextUrl.hostname.toLowerCase();
  if (hostsMatch(requestHost, originHost)) return true;

  const xfh = req.headers.get("x-forwarded-host");
  const forwardedHost = xfh?.split(",")[0]?.trim();
  const hostHeader = forwardedHost || req.headers.get("host");
  if (hostHeader) {
    const h = hostHeader.split(":")[0]?.toLowerCase();
    if (h && hostsMatch(h, originHost)) return true;
  }

  const appUrl = process.env.APP_URL;
  if (appUrl) {
    try {
      const canonical = new URL(appUrl);
      if (hostsMatch(canonical.hostname.toLowerCase(), originHost)) return true;
    } catch {
      // ignore
    }
  }

  return false;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
