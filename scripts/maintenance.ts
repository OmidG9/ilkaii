import "dotenv/config";
import { runMaintenanceJob } from "@/services/system";

/**
 * CLI entry point for a system cron/systemd timer. It performs the same job as
 * POST /api/cron/maintenance without needing an HTTP secret.
 *
 * Example:
 *   0 * * * * cd /srv/ilkaii && npm run maintenance >> /var/log/ilkaii-maintenance.log 2>&1
 */
runMaintenanceJob()
  .then((result) => {
    console.log(JSON.stringify({ ok: true, result }));
  })
  .catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    process.exitCode = 1;
  });
