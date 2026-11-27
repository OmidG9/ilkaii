import { getServerEnv, isProduction } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { ZarinpalProvider } from "@/services/payment/zarinpal";
import { ZibalProvider } from "@/services/payment/zibal";
import { BehpardakhtProvider } from "@/services/payment/behpardakht";

export type PaymentProviderName = "MOCK" | "ZARINPAL" | "ZIBAL" | "BEHPARDAKHT";
export type PaymentGatewayName = Exclude<PaymentProviderName, "MOCK">;

export const paymentGatewayNames: PaymentGatewayName[] = ["ZARINPAL", "ZIBAL", "BEHPARDAKHT"];

export interface PaymentVerifyParams {
  authority: string;
  amountToman: number;
  /** Raw callback parameters, used by SOAP gateways such as Behpardakht. */
  callback?: Record<string, string>;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  /** Whether the deployment has enough credentials to start a real payment. */
  available(): Promise<boolean>;
  initiate(params: {
    orderId: string;
    orderNumber: string;
    amountToman: number;
    callbackUrl: string;
  }): Promise<{ authority: string; redirectUrl: string; message?: string }>;
  verify(params: PaymentVerifyParams): Promise<{
    ok: boolean;
    reference?: string;
    message?: string;
  }>;
}

/** Local-only provider; it can never be selected in production. */
export const mockProvider: PaymentProvider = {
  name: "MOCK",
  async available() {
    return !isProduction();
  },
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

function providerInstance(name: PaymentProviderName): PaymentProvider {
  if (name === "MOCK") return mockProvider;
  if (name === "ZARINPAL") return new ZarinpalProvider();
  if (name === "ZIBAL") return new ZibalProvider();
  return new BehpardakhtProvider();
}

/**
 * Resolve a provider for a new checkout. In development an unconfigured
 * gateway deliberately falls back to the local mock adapter so the complete
 * checkout flow remains testable. Production never silently falls back.
 */
export async function getPaymentProvider(gateway?: PaymentGatewayName | "MOCK"): Promise<PaymentProvider> {
  const selected = gateway ?? getServerEnv().PAYMENT_PROVIDER;
  if (selected === "MOCK") {
    if (isProduction()) throw Errors.unavailable("پروایدر پرداخت معتبری پیکربندی نشده است");
    return mockProvider;
  }

  const provider = providerInstance(selected);
  if (await provider.available()) return provider;

  if (isProduction()) {
    throw Errors.unavailable(`درگاه ${selected} هنوز در تنظیمات فروشگاه پیکربندی نشده است`);
  }
  logger.warn("payment_gateway_fallback_to_mock", { gateway: selected, environment: process.env.NODE_ENV });
  return mockProvider;
}

/**
 * Resolve the provider recorded on a payment instead of the current env, so a
 * configuration change between initiation and callback cannot break settlement.
 */
export function getPaymentProviderFor(name: string): PaymentProvider {
  if (name === "MOCK") return mockProvider;
  if (name === "ZARINPAL" || name === "ZIBAL" || name === "BEHPARDAKHT") {
    return providerInstance(name);
  }
  throw Errors.unavailable("پروایدر پرداخت نامعتبر است");
}
