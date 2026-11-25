import { getServerEnv } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { PaymentProvider } from "@/services/payment";

/** Zarinpal REST v4 adapter. All amounts sent to the gateway are in Rials. */
export class ZarinpalProvider implements PaymentProvider {
  readonly name = "ZARINPAL" as const;

  private get config() {
    const env = getServerEnv();
    if (!env.ZARINPAL_MERCHANT_ID) {
      throw Errors.unavailable("ZARINPAL_MERCHANT_ID پیکربندی نشده است");
    }
    const base = env.ZARINPAL_SANDBOX === "true"
      ? "https://sandbox.zarinpal.com/pg/v4/payment"
      : "https://api.zarinpal.com/pg/v4/payment";
    return { merchantId: env.ZARINPAL_MERCHANT_ID, base };
  }

  async initiate({ amountToman, orderNumber, callbackUrl }: {
    orderId: string; orderNumber: string; amountToman: number; callbackUrl: string;
  }) {
    const { merchantId, base } = this.config;
    const response = await fetch(`${base}/request.json`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: amountToman * 10,
        description: `سفارش ${orderNumber}`,
        callback_url: callbackUrl,
        metadata: { contact: orderNumber },
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) {
      logger.error("zarinpal_request_failed", { status: response.status });
      throw Errors.unavailable("اتصال به درگاه پرداخت ممکن نشد");
    }
    const body = (await response.json()) as {
      errors?: { code?: number; message?: string };
      data?: { authority?: string; message?: string };
    };
    if (!body.data?.authority) {
      throw Errors.badRequest(body.data?.message ?? body.errors?.message ?? "آغاز پرداخت ناموفق بود");
    }
    return {
      authority: body.data.authority,
      redirectUrl: `https://www.zarinpal.com/pg/StartPay/${body.data.authority}`,
      message: body.data.message,
    };
  }

  async verify({ authority, amountToman }: { authority: string; amountToman: number }) {
    const { merchantId, base } = this.config;
    const response = await fetch(`${base}/verify.json`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ merchant_id: merchantId, authority, amount: amountToman * 10 }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) throw Errors.unavailable("تأیید پرداخت ممکن نشد");
    const body = (await response.json()) as {
      errors?: { code?: number; message?: string };
      data?: { ref_id?: number; code?: number; message?: string };
    };
    const code = body.data?.code ?? body.errors?.code;
    const ok = code === 100 || code === 101;
    return {
      ok,
      reference: body.data?.ref_id ? String(body.data.ref_id) : undefined,
      message: body.data?.message ?? body.errors?.message,
    };
  }
}
