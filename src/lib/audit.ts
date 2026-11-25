import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface AuditInput {
  actorId?: string | null;
  actorPhone?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  severity?: "info" | "warn" | "critical";
  ip?: string | null;
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
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        severity: input.severity ?? "info",
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    logger.error("audit_write_failed", { action: input.action, error: String(error) });
  }
}
