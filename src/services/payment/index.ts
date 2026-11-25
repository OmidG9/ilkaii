import { getServerEnv, isProduction } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { ZarinpalProvider } from "@/services/payment/zarinpal";

export interface PaymentProvider {
  readonly name: "MOCK" | "ZARINPAL";
  initiate(params: {
    orderId: string;
    orderNumber: string;
    amountToman: number;
    callbackUrl: string;
  }): Promise<{ authority: string; redirectUrl: string; message?: string }>;
  verify(params: { authority: string; amountToman: number }): Promise<{
    ok: boolean;
    reference?: string;
    message?: string;
  }>;
}

/** Local-only provider; it can never be selected in production. */
export const mockProvider: PaymentProvider = {
  name: "MOCK",
  async initiate({ orderId, amountToman }) {
    if (isProduction()) throw Errors.unavailable("پرداخت آزمایشی در محیط تولید غیرفعال است");
    return {
      authority: `MOCK-${orderId.slice(0, 8)}-${Date.now().toString(36)}`,
      redirectUrl: `/api/payments/mock?order=${encodeURIComponent(orderId)}&amount=${amountToman}`,
      message: "پرداخت آزمایشی (فقط محیط توسعه)",
    };
  },
  async verify({ authority }) {
    if (isProduction()) throw Errors.unavailable("پرداخت آزمایشی در محیط تولید غیرفعال است");
    return { ok: authority.startsWith("MOCK-"), reference: `MOCK-REF-${authority.slice(-6)}` };
  },
};

export function getPaymentProvider(): PaymentProvider {
  const configured = getServerEnv().PAYMENT_PROVIDER;
  if (configured === "ZARINPAL") return new ZarinpalProvider();
  if (isProduction()) {
    throw Errors.unavailable("پروایدر پرداخت معتبری پیکربندی نشده است");
  }
  return mockProvider;
}
