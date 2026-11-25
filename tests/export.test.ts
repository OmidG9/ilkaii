import { test } from "node:test";
import assert from "node:assert/strict";
import { customersToCsv } from "../src/services/crm";
import { reportToCsv, type ReportResult } from "../src/services/reports";

test("CSV output escapes commas, quotes and new lines", () => {
  const csv = reportToCsv({
    title: "test",
    description: "",
    columns: [{ key: "name", label: "name" }, { key: "value", label: "value" }],
    rows: [{ name: 'a,"b"', value: 10 }, { name: "line\nbreak", value: 20 }],
    summary: [],
  } as ReportResult);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /"a,""b"""/);
  assert.match(csv, /"line\nbreak"/);
});

test("customer CSV contains an Excel BOM and expected columns", () => {
  const csv = customersToCsv([
    {
      id: "u1", phone: "09123456789", firstName: "سارا", lastName: null, email: null,
      isActive: true, role: "CUSTOMER", createdAt: new Date("2026-01-01T00:00:00Z"),
      lastActivity: null, orders: 2, paidOrders: 1, cancelledOrders: 0, spent: 500000,
      lastPurchase: new Date("2026-01-02T00:00:00Z"), cartItems: 0, segments: ["returning"],
    },
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /spent_toman/);
  assert.match(csv, /09123456789/);
  assert.match(csv, /returning/);
});
