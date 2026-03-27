import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";
import { consumeRateLimit, getClientIp, shouldAllowMutationFromOrigin } from "@/lib/security";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function applySecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");
  const isMutating = MUTATING_METHODS.has(req.method);

  if (isApiRoute) {
    const ip = getClientIp(req);
    const routeKey = pathname.split("/").slice(0, 4).join("/");
    const limit = consumeRateLimit({
      key: `api:${routeKey}:${ip}`,
      limit: pathname.startsWith("/api/auth/") ? 60 : 120,
      windowMs: 60 * 1000,
    });
    if (!limit.ok) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Demasiados pedidos. Tente novamente dentro de instantes." },
          { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
        )
      );
    }

    if (isMutating && !pathname.startsWith("/api/cron/")) {
      if (!shouldAllowMutationFromOrigin(req)) {
        return applySecurityHeaders(
          NextResponse.json({ error: "Origem inválida." }, { status: 403 })
        );
      }
    }
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminRoute && !isAdminApi) {
    return applySecurityHeaders(NextResponse.next());
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    if (isAdminApi) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Não autenticado." }, { status: 401 })
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  // Role vem sempre da base de dados (via /api/auth/me), não do JWT — assim promoções/despromoções aplicam logo.
  const meUrl = new URL("/api/auth/me", req.url);
  let user: { role: string } | null = null;
  try {
    const meRes = await fetch(meUrl, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    const data = (await meRes.json()) as { user: { role: string } | null };
    user = data?.user ?? null;
  } catch {
    user = null;
  }

  if (!user) {
    if (isAdminApi) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Não autenticado." }, { status: 401 })
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    if (isAdminApi) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Sem permissões." }, { status: 403 })
      );
    }
    return applySecurityHeaders(NextResponse.redirect(new URL("/perfil", req.url)));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/:path*"],
};
