import { getServerEnv } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getSecret } from "@/lib/secrets";
import type { PaymentProvider } from "@/services/payment";

type GatewayError = { code?: number; message?: string } | Array<{ code?: number; message?: string }> | undefined;
type GatewayData = { authority?: string; ref_id?: number; code?: number; message?: string };

function errorMessage(errors: GatewayError, fallback?: string): string | undefined {
  if (Array.isArray(errors)) return errors.find((item) => item?.message)?.message ?? fallback;
  return errors?.message ?? fallback;
}

function errorCode(errors: GatewayError): number | undefined {
  if (Array.isArray(errors)) return errors.find((item) => typeof item?.code === "number")?.code;
  return errors?.code;
}

function gatewayData(value: unknown): GatewayData | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as GatewayData : undefined;
}

/** Sandbox authorities only work on the sandbox StartPay host. */
export function zarinpalStartPayUrl(authority: string): string {
  const sandbox = process.env.ZARINPAL_SANDBOX === "true";
  return `https://${sandbox ? "sandbox." : "www."}zarinpal.com/pg/StartPay/${encodeURIComponent(authority)}`;
}

/** Zarinpal REST v4 adapter. All amounts sent to the gateway are in Rials. */
export class ZarinpalProvider implements PaymentProvider {
  readonly name = "ZARINPAL" as const;

  private get base() {
    return getServerEnv().ZARINPAL_SANDBOX === "true"
      ? "https://sandbox.zarinpal.com/pg/v4/payment"
      : "https://api.zarinpal.com/pg/v4/payment";
  }

  /** Dashboard-managed secret takes precedence over the deployment env var. */
  private async merchantId(): Promise<string> {
    const stored = await getSecret("payment.zarinpal_merchant_id").catch(() => null);
    const merchantId = stored || getServerEnv().ZARINPAL_MERCHANT_ID;
    if (!merchantId) throw Errors.unavailable("شناسه پذیرنده زرین‌پال پیکربندی نشده است");
    return merchantId;
  }

  async available(): Promise<boolean> {
    try {
      await this.merchantId();
      return true;
    } catch {
      return false;
    }
  }

  async initiate({ amountToman, orderNumber, callbackUrl }: {
    orderId: string; orderNumber: string; amountToman: number; callbackUrl: string;
  }) {
    const merchantId = await this.merchantId();
    const response = await fetch(`${this.base}/request.json`, {
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
    const body = (await response.json()) as { errors?: GatewayError; data?: unknown };
    const data = gatewayData(body.data);
    if (!data?.authority) {
      throw Errors.badRequest(errorMessage(body.errors, data?.message) ?? "آغاز پرداخت ناموفق بود");
    }
    return {
      authority: data.authority,
      redirectUrl: zarinpalStartPayUrl(data.authority),
      message: data.message,
    };
  }

  async verify({ authority, amountToman }: { authority: string; amountToman: number }) {
    const merchantId = await this.merchantId();
    const response = await fetch(`${this.base}/verify.json`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ merchant_id: merchantId, authority, amount: amountToman * 10 }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) throw Errors.unavailable("تأیید پرداخت ممکن نشد");
    const body = (await response.json()) as { errors?: GatewayError; data?: unknown };
    const data = gatewayData(body.data);
    const code = data?.code ?? errorCode(body.errors);
    const ok = code === 100 || code === 101;
    return {
      ok,
      reference: data?.ref_id ? String(data.ref_id) : undefined,
      message: errorMessage(body.errors, data?.message),
    };
  }
}
