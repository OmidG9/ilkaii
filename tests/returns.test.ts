import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeReturnableLines,
  hasOpenReturnWindow,
  latestDeliveredAt,
  RETURN_WINDOW_DAYS,
} from "../src/lib/returns";

const day = 24 * 60 * 60 * 1000;

test("return window only opens after shipping and closes after the delivery window", () => {
  assert.equal(hasOpenReturnWindow("PROCESSING", null), false);
  assert.equal(hasOpenReturnWindow("SHIPPED", null), true);
  assert.equal(hasOpenReturnWindow("DELIVERED", null), true);
  assert.equal(hasOpenReturnWindow("DELIVERED", new Date(Date.now() - (RETURN_WINDOW_DAYS - 1) * day)), true);
  assert.equal(hasOpenReturnWindow("DELIVERED", new Date(Date.now() - (RETURN_WINDOW_DAYS + 1) * day)), false);
  assert.equal(hasOpenReturnWindow("CANCELLED", null), false);
});

test("latestDeliveredAt picks the newest delivery event", () => {
  const older = new Date("2026-11-01T10:00:00Z");
  const newer = new Date("2026-11-10T10:00:00Z");
  assert.equal(latestDeliveredAt([]), null);
  assert.deepEqual(
    latestDeliveredAt([
      { toStatus: "SHIPPED", createdAt: newer },
      { toStatus: "DELIVERED", createdAt: older },
      { toStatus: "DELIVERED", createdAt: newer },
    ]),
    newer,
  );
});

test("computeReturnableLines subtracts every non-rejected request", () => {
  const lines = computeReturnableLines(
    [
      { id: "line-1", quantity: 3 },
      { id: "line-2", quantity: 1 },
      { id: "line-3", quantity: 2 },
    ],
    [
      { items: [{ orderItemId: "line-1", quantity: 1 }, { orderItemId: "line-2", quantity: 1 }] },
      { items: [{ orderItemId: "line-1", quantity: 1 }] },
    ],
  );
  assert.deepEqual(lines.map((line) => line.returnable), [1, 0, 2]);
  assert.equal(lines[0].quantity, 3);
});
