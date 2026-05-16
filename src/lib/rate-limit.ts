import { NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStores = new Map<string, RateLimitStore>();

export function createRateLimiter(
  windowMs: number = 60 * 1000, // 1 minute default
  maxRequests: number = 100,
) {
  return function rateLimiter(
    req: NextRequest,
    namespace: string = "global",
  ): { success: boolean; remaining: number } {
    const key = `${namespace}:${getClientIp(req)}`;
    const now = Date.now();

    let store = rateLimitStores.get(namespace);
    if (!store) {
      store = {};
      rateLimitStores.set(namespace, store);
    }

    // Clean up old entries
    Object.keys(store).forEach((k) => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });

    const current = store[key] || { count: 0, resetTime: now + windowMs };

    if (current.resetTime < now) {
      current.count = 0;
      current.resetTime = now + windowMs;
    }

    current.count++;
    store[key] = current;

    const remaining = Math.max(0, maxRequests - current.count);
    const success = current.count <= maxRequests;

    return { success, remaining };
  };
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip");
  return ip || req.ip || "unknown";
}

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 60 * 1000,
  namespace: string = "api",
) {
  const limiter = createRateLimiter(windowMs, maxRequests);

  return function middleware(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      const { success, remaining } = limiter(req, namespace);

      if (!success) {
        return NextResponse.json(
          { success: false, error: "Rate limit exceeded" },
          {
            status: 429,
            headers: {
              "RateLimit-Remaining": remaining.toString(),
              "Retry-After": Math.ceil(windowMs / 1000).toString(),
            },
          },
        );
      }

      // Add rate limit info to response headers
      const response = await handler(req, ...args);
      if (response instanceof NextResponse) {
        response.headers.set("RateLimit-Remaining", remaining.toString());
      }

      return response;
    };
  };
}

// Specific rate limiters
export const rateLimiters = {
  auth: createRateLimiter(15 * 60 * 1000, 5), // 5 requests per 15 minutes
  api: createRateLimiter(60 * 1000, 100), // 100 requests per minute
  checkout: createRateLimiter(60 * 1000, 10), // 10 requests per minute
};
