import os from "node:os";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getAnalyticsSettings, applyRetentionPolicy } from "@/services/analytics";
import { promoteScheduledContent, storageUsage } from "@/services/cms";
import { expirePendingOrders } from "@/services/checkout";
import { localUploadDirectory } from "@/services/storage";

export interface HealthResult {
  status: "ok" | "degraded" | "down";
  database: { connected: boolean; latencyMs: number | null };
  app: { uptimeSeconds: number; node: string; platform: string; memoryMb: number };
  checkedAt: string;
}

export async function checkHealth(): Promise<HealthResult> {
  const start = Date.now();
  let connected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    connected = true;
  } catch (error) {
    logger.error("health_database_failed", { error: String(error) });
  }
  const latency = connected ? Date.now() - start : null;
  return {
    status: connected ? (latency !== null && latency > 750 ? "degraded" : "ok") : "down",
    database: { connected, latencyMs: latency },
    app: {
      uptimeSeconds: Math.round(process.uptime()),
      node: process.version,
      platform: process.platform,
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    checkedAt: new Date().toISOString(),
  };
}

export async function recordSystemEvent(level: "info" | "warn" | "error" | "critical", type: string, message: string, context?: unknown) {
  try {
    await prisma.systemEvent.create({
      data: {
        level: level.toUpperCase() as "INFO" | "WARN" | "ERROR" | "CRITICAL",
        type: type.slice(0, 80),
        message: message.slice(0, 512),
        context: context ? JSON.stringify(context).slice(0, 4000) : null,
      },
    });
  } catch {
    // Monitoring must never break the request.
  }
}

async function localUploadsUsage() {
  const directory = localUploadDirectory();
  try {
    const files = await readdir(directory);
    let bytes = 0;
    for (const file of files.slice(0, 5000)) {
      const info = await stat(path.join(directory, file)).catch(() => null);
      if (info?.isFile()) bytes += info.size;
    }
    return { files: files.length, bytes };
  } catch {
    return { files: 0, bytes: 0 };
  }
}

export async function getSystemOverview() {
  const day = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [health, failedPayments, failedJobs, failedNotifications, recentJobs, events, securityEvents, media, local, notificationLogs, counts, backupSetting] = await Promise.all([
    checkHealth(),
    prisma.payment.count({ where: { status: "FAILED", createdAt: { gte: day } } }),
    prisma.backgroundJob.count({ where: { status: "FAILED" } }),
    prisma.notificationLog.count({ where: { status: "FAILED", createdAt: { gte: day } } }),
    prisma.backgroundJob.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.systemEvent.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.auditLog.findMany({ where: { severity: { in: ["warn", "critical"] }, createdAt: { gte: day } }, orderBy: { createdAt: "desc" }, take: 10 }),
    storageUsage(),
    localUploadsUsage(),
    prisma.notificationLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.analyticsEvent.count(),
    ]),
    prisma.siteSetting.findUnique({ where: { key: "backup.lastRunAt" } }),
  ]);
  const backupFrequency = await prisma.siteSetting.findUnique({ where: { key: "backup.frequency" } });
  return {
    health,
    failedPayments,
    failedJobs,
    failedNotifications,
    recentJobs,
    events,
    securityEvents,
    notificationLogs,
    storage: { mediaBytes: media.bytes, mediaFiles: media.files, localBytes: local.bytes, localFiles: local.files },
    counts: { users: counts[0], orders: counts[1], products: counts[2], analyticsEvents: counts[3] },
    backup: { lastRunAt: backupSetting?.value ?? null, frequency: backupFrequency?.value ?? "daily" },
    versions: { next: "15.5.x", prisma: "5.22.x", node: process.version },
    host: { cpus: os.cpus().length, totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024), freeMemoryMb: Math.round(os.freemem() / 1024 / 1024) },
  };
}

/** Maintenance job: scheduled content, analytics retention and operational logs. */
export async function runMaintenanceJob(actorId?: string) {
  const job = await prisma.backgroundJob.create({ data: { name: "maintenance", status: "RUNNING", startedAt: new Date() } });
  try {
    const [content, retention, staleOrders] = await Promise.all([
      promoteScheduledContent(actorId),
      applyRetentionPolicy(),
      expirePendingOrders(),
    ]);
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const prunedEvents = await prisma.systemEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
    const result = { content, retention, staleOrders, prunedSystemEvents: prunedEvents.count };
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: { status: "SUCCESS", finishedAt: new Date(), result: JSON.stringify(result) },
    });
    await recordSystemEvent("info", "maintenance", "Maintenance job completed", result);
    return result;
  } catch (error) {
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: { status: "FAILED", finishedAt: new Date(), error: error instanceof Error ? error.message.slice(0, 1000) : "unknown" },
    });
    await recordSystemEvent("error", "maintenance", "Maintenance job failed", { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function getAnalyticsRetentionStatus() {
  return getAnalyticsSettings();
}
