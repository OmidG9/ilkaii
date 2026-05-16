import { NextRequest, NextResponse } from "next/server";

// Simple auth middleware - In production use NextAuth
export function withAuth(roles: string[] = ["CUSTOMER", "ADMIN"]) {
  return async (handler: Function) => {
    return async (req: NextRequest) => {
      const userId = req.headers.get("x-user-id");
      const userRole = req.headers.get("x-user-role") || "CUSTOMER";

      if (!userId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }

      if (!roles.includes(userRole)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }

      return handler(req);
    };
  };
}

// Admin only middleware
export function withAdminAuth(handler: Function) {
  return withAuth(["ADMIN"])(handler);
}
