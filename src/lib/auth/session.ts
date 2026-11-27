import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { getServerEnv, isProduction } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { roleCanAccessAdmin, type PermissionKey } from "@/lib/permissions";
import { SESSION_COOKIE } from "@/lib/constants";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface SessionUser {
  id: string;
  phone: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  sessionId: string;
}

function key() {
  return new TextEncoder().encode(getServerEnv().SESSION_SECRET);
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createSession(userId: string, meta: { ip?: string | null; userAgent?: string | null } = {}): Promise<string> {
  const sessionId = randomBytes(16).toString("hex");
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(sessionId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key());
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
      ip: meta.ip?.slice(0, 64) ?? null,
      userAgent: meta.userAgent?.slice(0, 512) ?? null,
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SECONDS));
  return token;
}

/** Rotate on privilege change/login: old token becomes immediately invalid. */
export async function rotateSession(userId: string): Promise<string> {
  await revokeSession();
  return createSession(userId);
}

export async function revokeSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return;
  try {
    const { payload } = await jwtVerify(token, key());
    if (payload.jti) {
      await prisma.session.updateMany({
        where: { id: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  } catch {
    // Malformed tokens are cleared below regardless.
  }
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Cookie token + signature + DB session + active user are all checked. Roles are
 * read from the database on every request, never trusted from the JWT.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  let sessionId: string | undefined;
  let userId: string | undefined;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    sessionId = payload.jti;
    userId = payload.sub;
  } catch {
    return null;
  }
  if (!sessionId || !userId) return null;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { userId: true, tokenHash: true, expiresAt: true, revokedAt: true },
  });
  if (!session || session.userId !== userId || session.tokenHash !== tokenHash ||
      session.revokedAt || session.expiresAt < new Date()) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, role: true, firstName: true, lastName: true, isActive: true },
  });
  if (!user?.isActive) return null;
  return { ...user, sessionId };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw Errors.unauthorized();
  return user;
}

export async function requireRole(...roles: string[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw Errors.forbidden();
  return user;
}

export async function permissionKeysForRole(role: string): Promise<PermissionKey[]> {
  const row = await prisma.role.findUnique({
    where: { code: role },
    select: { permissions: { select: { permission: { select: { key: true } } } } },
  });
  return (row?.permissions.map((entry) => entry.permission.key) ?? []) as PermissionKey[];
}

export async function requirePermission(permission: PermissionKey): Promise<SessionUser> {
  const user = await requireUser();
  if (!roleCanAccessAdmin(user.role)) throw Errors.forbidden();
  const role = await prisma.role.findUnique({
    where: { code: user.role },
    select: { permissions: { where: { permission: { key: permission } }, select: { permissionId: true } } },
  });
  if (!role?.permissions.length) throw Errors.forbidden();
  return user;
}

/** Server Component guard for a specific permission; redirects to /admin. */
export async function requirePagePermission(permission: PermissionKey): Promise<SessionUser> {
  return requirePageAnyPermission(permission);
}

export async function requireAnyPermission(...permissions: PermissionKey[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roleCanAccessAdmin(user.role)) throw Errors.forbidden();
  const role = await prisma.role.findUnique({
    where: { code: user.role },
    select: { permissions: { where: { permission: { key: { in: permissions } } }, select: { permissionId: true } } },
  });
  if (!role?.permissions.length) throw Errors.forbidden();
  return user;
}

export async function requirePageAnyPermission(...permissions: PermissionKey[]): Promise<SessionUser> {
  const user = await requirePageAdmin();
  const keys = await permissionKeysForRole(user.role);
  if (!permissions.some((permission) => keys.includes(permission))) redirect("/admin/dashboard?denied=1");
  return user;
}

/** Only same-origin paths are accepted as post-login destinations. */
export function safeNextPath(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return undefined;
  if (value.startsWith("/auth/")) return undefined;
  return value.slice(0, 512);
}

async function requestPath(): Promise<string | undefined> {
  try {
    const requestHeaders = await headers();
    return safeNextPath(requestHeaders.get("x-pathname"));
  } catch {
    return undefined;
  }
}

function loginUrl(nextPath: string | undefined) {
  return nextPath ? `/auth/login?next=${encodeURIComponent(nextPath)}` : "/auth/login";
}

/** Server Component guard: redirects instead of returning a JSON error. */
export async function requirePageUser(nextPath?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(loginUrl(nextPath ?? (await requestPath())));
  return user;
}

export async function requirePageAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(loginUrl(await requestPath()));
  if (!roleCanAccessAdmin(user.role)) redirect("/");
  return user;
}
