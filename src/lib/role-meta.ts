import { BUILT_IN_ROLES, ROLE_DESCRIPTIONS } from "@/lib/permissions";

export const ADMIN_ROLE_META: Record<string, string> = Object.fromEntries(
  BUILT_IN_ROLES.filter((code) => code !== "CUSTOMER").map((code) => [code, ROLE_DESCRIPTIONS[code]]),
);
