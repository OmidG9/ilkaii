import type { z } from "zod";
import type { cartAddSchema, cartUpdateSchema, checkoutSchema, productSchema, variantSchema, categorySchema } from "@/lib/validation";

export type CartAdd = z.infer<typeof cartAddSchema>;
export type CartUpdate = z.infer<typeof cartUpdateSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
