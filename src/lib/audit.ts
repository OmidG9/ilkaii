import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface AuditInput {
  actorId?: string | null;
  actorPhone?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  before?: unknown;
  after?: unknown;
  requestId?: string | null;
  severity?: "info" | "warn" | "critical";
  ip?: string | null;
}

const SENSITIVE_KEY = /(secret|token|password|otp|authorization|cookie|api[_-]?key|card|cvv|merchant)/i;

/** Audit snapshots must never contain credentials or payment card data. */
function safeSnapshot(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => safeSnapshot(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 80)
        .map(([key, val]) => [key, SENSITIVE_KEY.test(key) ? "[redacted]" : safeSnapshot(val, depth + 1)]),
    );
  }
  if (typeof value === "string" && value.length > 2000) return `${value.slice(0, 2000)}…`;
  return value;
}

function serialize(value: unknown): string | null {
  if (value === undefined) return null;
  try {
    const text = JSON.stringify(safeSnapshot(value));
    return text.length > 16_000 ? `${text.slice(0, 16_000)}…` : text;
  } catch {
    return null;
  }
}

/** Best-effort audit trail; auditing must never break the business operation. */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorPhone: input.actorPhone ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: input.metadata ? serialize(input.metadata) : null,
        beforeJson: serialize(input.before),
        afterJson: serialize(input.after),
        requestId: input.requestId?.slice(0, 64) ?? randomUUID(),
        severity: input.severity ?? "info",
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    logger.error("audit_write_failed", { action: input.action, error: String(error) });
  }
}
