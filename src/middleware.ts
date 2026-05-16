import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { jwtDecode, getTokenFromHeader } from "@/lib/jwt";

// Protect routes
const protectedRoutes = [
  /^\/api\/cart/,
  /^\/api\/orders/,
  /^\/api\/users\/profile/,
  /^\/api\/users\/addresses/,
  /^\/api\/users\/orders/,
  /^\/api\/reviews/,
  /^\/api\/admin\//,
];

const adminRoutes = [/^\/api\/admin\//, /^\/admin\//];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) => route.test(pathname));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Try NextAuth session first
  let session = await auth();

  // If no session, try JWT token
  if (!session) {
    const authHeader = request.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (token) {
      const decoded = await jwtDecode(token);
      if (decoded) {
        session = {
          user: {
            id: decoded.userId as string,
            role: (decoded.role || "CUSTOMER") as string,
            phone: decoded.phone as string,
          },
        } as any;
      }
    }
  }

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // Check admin routes
  const isAdminRoute = adminRoutes.some((route) => route.test(pathname));
  if (isAdminRoute && session.user?.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden - Admin only" },
      { status: 403 },
    );
  }

  // Add user info to request for use in route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.user?.id || "");
  requestHeaders.set("x-user-role", (session.user as any)?.role || "CUSTOMER");
  requestHeaders.set("x-user-phone", (session.user as any)?.phone || "");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
