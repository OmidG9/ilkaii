import type { InventoryReason, Prisma } from "@prisma/client";
import { Errors } from "@/lib/errors";
import { toDecimalString } from "@/lib/money";

export interface InventoryMovementInput {
  variantId: string;
  /** Signed delta already applied to `ProductVariant.stock`. */
  quantity: number;
  reason: InventoryReason;
  note?: string | null;
  userId?: string | null;
  orderId?: string | null;
  unitCost?: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
}

/**
 * Central inventory ledger writer.
 *
 * Callers must apply the stock delta *before* calling this helper so the
 * recorded `balanceAfter` reflects the post-movement stock level. Keeping the
 * balance on every ledger row makes stock reconciliation auditable without
 * replaying the whole history.
 */
export async function recordInventoryMovement(
  tx: Prisma.TransactionClient,
  input: InventoryMovementInput,
) {
  if (!Number.isInteger(input.quantity) || input.quantity === 0) {
    throw Errors.badRequest("تغییر موجودی باید یک عدد صحیح و غیرصفر باشد");
  }
  const variant = await tx.productVariant.findUnique({
    where: { id: input.variantId },
    select: { stock: true },
  });
  if (!variant) throw Errors.notFound("تنوع محصول یافت نشد");

  return tx.inventoryMovement.create({
    data: {
      variantId: input.variantId,
      orderId: input.orderId ?? null,
      quantity: input.quantity,
      balanceAfter: variant.stock,
      reason: input.reason,
      unitCost: input.unitCost === null || input.unitCost === undefined ? null : toDecimalString(input.unitCost),
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      note: input.note ?? null,
      userId: input.userId ?? null,
    },
  });
}
