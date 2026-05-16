import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";

/**
 * Generate CSRF token for forms
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Verify CSRF token
 */
export function verifyCsrfToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}

/**
 * Hash sensitive data (like passwords, API keys)
 */
export function hashSensitiveData(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Validate request body for common injection attacks
 */
export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    return input
      .replace(/[<>]/g, "") // Remove angle brackets
      .trim()
      .substring(0, 1000); // Limit length
  }

  if (typeof input === "object" && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Validate keys
      if (!/^[a-zA-Z0-9_-]*$/.test(key)) {
        continue;
      }
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  // Iran phone number: +98, 0098, or 0 prefix with 10 digits
  const phoneRegex = /^(\+98|0098|0)?9\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
}

/**
 * Validate email format
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check for SQL injection patterns
 */
export function hasSqlInjectionPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /(\bselect\b|\bunion\b|\bfrom\b|\bwhere\b|\bor\b|\band\b|\b1\s*=\s*1\b)/i,
    /(-{2}|\/\*|\*\/|;)/,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Secure API endpoint
 */
export function createSecureApiHandler<T, R>(
  handler: (data: T) => Promise<R>,
  validateData: (data: any) => T,
) {
  return async (data: any): Promise<R> => {
    // Sanitize input
    const sanitized = sanitizeInput(data);

    // Validate
    const validated = validateData(sanitized);

    // Execute
    return handler(validated);
  };
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  type: string,
  details: Record<string, any>,
  severity: "low" | "medium" | "high" = "medium",
) {
  const timestamp = new Date();
  const event = {
    type,
    details,
    severity,
    timestamp,
  };

  // In production, send to security monitoring service
  console.warn(`[SECURITY EVENT] ${JSON.stringify(event)}`);

  // TODO: Store in database or send to monitoring service
}

/**
 * Validate user permissions
 */
export async function checkUserPermission(
  userId: string,
  resource: string,
  action: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    logSecurityEvent("permission_check_failed", { userId, resource, action });
    return false;
  }

  // Simple role-based access control
  const adminActions = [
    "delete_product",
    "update_product",
    "view_all_orders",
    "update_user",
  ];

  if (adminActions.includes(action) && user.role !== "ADMIN") {
    logSecurityEvent("unauthorized_action", {
      userId,
      resource,
      action,
      role: user.role,
    });
    return false;
  }

  return true;
}

/**
 * Check if user is owner of resource
 */
export async function isResourceOwner(
  userId: string,
  resourceType: string,
  resourceId: string,
): Promise<boolean> {
  switch (resourceType) {
    case "cart":
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: resourceId },
      });
      return cartItem?.userId === userId;

    case "order":
      const order = await prisma.order.findUnique({
        where: { id: resourceId },
      });
      return order?.userId === userId;

    case "address":
      const address = await prisma.address.findUnique({
        where: { id: resourceId },
      });
      return address?.userId === userId;

    default:
      return false;
  }
}
