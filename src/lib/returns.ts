export interface ReturnRequestLine {
  orderItemId: string;
  quantity: number;
}

export interface ReturnRequestLines {
  items: ReturnRequestLine[];
}

export const RETURN_WINDOW_DAYS = 7;

export function isReturnEligibleStatus(status: string): boolean {
  return status === "SHIPPED" || status === "DELIVERED";
}

/**
 * The order is returnable while in transit and for a fixed window after the
 * last DELIVERED status change. Legacy orders without history stay permissive.
 */
export function hasOpenReturnWindow(status: string, deliveredAt: Date | null): boolean {
  if (!isReturnEligibleStatus(status)) return false;
  if (status !== "DELIVERED" || !deliveredAt) return true;
  return Date.now() - deliveredAt.getTime() <= RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/** Latest DELIVERED timestamp from order status history, if any. */
export function latestDeliveredAt(
  history: Array<{ toStatus: string; createdAt: Date }>,
): Date | null {
  let latest: Date | null = null;
  for (const entry of history) {
    if (entry.toStatus === "DELIVERED" && (!latest || entry.createdAt > latest)) {
      latest = entry.createdAt;
    }
  }
  return latest;
}

/**
 * Remaining returnable quantity per order line. Callers should pass only
 * non-rejected requests so a rejected request frees the quantity again.
 */
export function computeReturnableLines<T extends { id: string; quantity: number }>(
  items: T[],
  requests: ReturnRequestLines[],
): Array<T & { returnable: number }> {
  const requested = new Map<string, number>();
  for (const request of requests) {
    for (const line of request.items) {
      requested.set(line.orderItemId, (requested.get(line.orderItemId) ?? 0) + line.quantity);
    }
  }
  return items.map((item) => ({
    ...item,
    returnable: Math.max(0, item.quantity - (requested.get(item.id) ?? 0)),
  }));
}
