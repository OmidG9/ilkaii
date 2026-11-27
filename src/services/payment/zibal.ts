import { getServerEnv } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getSecret } from "@/lib/secrets";
import type { PaymentProvider } from "@/services/payment";

interface ZibalResponse {
  result?: number;
  trackId?: number;
  message?: string;
  amount?: number;
  refNumber?: number | string;
  cardNumber?: string;
}

/** Zibal REST API. Amounts are in Rials, like the other Iranian gateways. */
export class ZibalProvider implements PaymentProvider {
  readonly name = "ZIBAL" as const;

  private async merchant(): Promise<string> {
    const stored = await getSecret("payment.zibal_merchant").catch(() => null);
    const merchant = stored || getServerEnv().ZIBAL_MERCHANT;
    if (!merchant) throw Errors.unavailable("شناسه پذیرنده زیبال پیکربندی نشده است");
    return merchant;
  }

  async available(): Promise<boolean> {
    try {
      await this.merchant();
      return true;
    } catch {
      return false;
    }
  }

  async initiate({ amountToman, orderId, orderNumber, callbackUrl }: {
    orderId: string;
    orderNumber: string;
    amountToman: number;
    callbackUrl: string;
  }) {
    const merchant = await this.merchant();
    const response = await fetch("https://gateway.zibal.ir/v1/request", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        merchant,
        amount: amountToman * 10,
        callbackUrl,
        orderId,
        description: `سفارش ${orderNumber}`,
      }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!response.ok) {
      logger.error("zibal_request_failed", { status: response.status });
      throw Errors.unavailable("اتصال به درگاه زیبال ممکن نشد");
    }
    const body = (await response.json()) as ZibalResponse;
    if (body.result !== 100 || !body.trackId) {
      logger.warn("zibal_request_rejected", { result: body.result, message: body.message });
      throw Errors.badRequest(body.message ?? "آغاز پرداخت در زیبال ناموفق بود");
    }
    return {
      authority: String(body.trackId),
      redirectUrl: `https://gateway.zibal.ir/start/${encodeURIComponent(String(body.trackId))}`,
      message: body.message,
    };
  }

  async verify({ authority, amountToman }: { authority: string; amountToman: number }) {
    const merchant = await this.merchant();
    const response = await fetch("https://gateway.zibal.ir/v1/verify", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ merchant, trackId: Number(authority) }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!response.ok) throw Errors.unavailable("تأیید پرداخت زیبال ممکن نشد");
    const body = (await response.json()) as ZibalResponse;
    // 100 = verified, 201 = already verified by a previous callback.
    const verified = body.result === 100 || body.result === 201;
    const amountMatches = typeof body.amount !== "number" || body.amount === amountToman * 10;
    return {
      ok: verified && amountMatches,
      reference: body.refNumber !== undefined ? String(body.refNumber) : body.cardNumber,
      message: body.message,
    };
  }
}
