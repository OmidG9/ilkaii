import { NextResponse, type NextRequest } from "next/server";
import { CART_COOKIE } from "@/lib/constants";

function securityHeaders(): Record<string, string> {
  const isDev = process.env.NODE_ENV !== "production";
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Content-Security-Policy": [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      // Tailwind injects the theme as an inline <style>; Next injects inline bootstrap scripts.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
      "worker-src 'self' blob:",
      "object-src 'none'",
    ].join("; "),
  };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(securityHeaders())) {
    response.headers.set(key, value);
  }
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Anonymous visitors receive an opaque, HttpOnly cart token. Identity is
  // never inferred from client-supplied headers in middleware or route handlers.
  if (!request.cookies.has(CART_COOKIE)) {
    response.cookies.set(CART_COOKIE, crypto.randomUUID().replace(/-/g, ""), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
