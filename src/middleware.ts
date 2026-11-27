import { NextResponse, type NextRequest } from "next/server";
import { ANALYTICS_COOKIE, CART_COOKIE } from "@/lib/constants";

function securityHeaders(): Record<string, string> {
  const isDev = process.env.NODE_ENV !== "production";
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    // In development Next's HMR/overlay needs inline+evel. Production uses a
    // per-request nonce (below) and never allows arbitrary inline scripts.
    "Content-Security-Policy": isDev
      ? [
          "default-src 'self'",
          "base-uri 'self'",
          "form-action 'self' https://bpm.shaparak.ir",
          "frame-ancestors 'self'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data: https://fonts.gstatic.com",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "connect-src 'self' ws: wss:",
          "worker-src 'self' blob:",
          "object-src 'none'",
        ].join("; ")
      : "",
  };
}

function productionCsp(nonce: string) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    // Behpardakht's landing page posts the RefId directly to the bank.
    "form-action 'self' https://bpm.shaparak.ir",
    "frame-ancestors 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    // Next.js reads this from the request headers and applies the nonce to its
    // own bootstrap scripts. Our inline theme/JSON-LD scripts read x-nonce.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = isDev ? securityHeaders()["Content-Security-Policy"] : productionCsp(nonce);

  // Expose the current path to server components so login redirects can return
  // the visitor to the page they were trying to reach (e.g. /checkout).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  requestHeaders.set("x-nonce", nonce);
  if (!isDev) requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const [key, value] of Object.entries(securityHeaders())) {
    if (key === "Content-Security-Policy") continue;
    response.headers.set(key, value);
  }
  response.headers.set("Content-Security-Policy", csp);
  if (!isDev) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Anonymous visitors receive an opaque, HttpOnly cart token. Identity is
  // never inferred from client-supplied headers in middleware or route handlers.
  if (!request.cookies.has(CART_COOKIE)) {
    response.cookies.set(CART_COOKIE, crypto.randomUUID().replace(/-/g, ""), {
      httpOnly: true,
      sameSite: "lax",
      secure: !isDev,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  // Anonymous analytics session: random, server-issued, never a fingerprint.
  if (!request.cookies.has(ANALYTICS_COOKIE)) {
    response.cookies.set(ANALYTICS_COOKIE, crypto.randomUUID().replace(/-/g, ""), {
      httpOnly: true,
      sameSite: "lax",
      secure: !isDev,
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
