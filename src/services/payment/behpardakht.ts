import { createHash } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getSecret } from "@/lib/secrets";
import type { PaymentProvider, PaymentVerifyParams } from "@/services/payment";

const PAY_ENDPOINT = "https://bpm.shaparak.ir/pgwchannel/services/pgw";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function soapEnvelope(action: string, params: Record<string, string | number>) {
  const body = Object.entries(params)
    .map(([key, value]) => `<int:${key}>${xmlEscape(String(value))}</int:${key}>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:int="http://interfaces.core.sw.bps.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <int:${action}>${body}</int:${action}>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function parseReturn(xml: string): string | null {
  const match = xml.match(/<(?:\w+:)?return>([\s\S]*?)<\/(?:\w+:)?return>/i);
  return match?.[1]?.trim() ?? null;
}

function tehranDateAndTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  return {
    localDate: `${pick("year")}${pick("month")}${pick("day")}`,
    localTime: `${pick("hour")}${pick("minute")}${pick("second")}`,
  };
}

/** Deterministic numeric sale order id expected by Behpardakht. */
function numericOrderId(orderId: string): number {
  const digest = createHash("sha256").update(orderId).digest("hex").slice(0, 12);
  return Number(BigInt(`0x${digest}`) % 900_000_000n) + 100_000_000;
}

/**
 * Behpardakht Mellat SOAP adapter.
 *
 * Mellat's gateway only accepts a POST form with the RefId, so `initiate`
 * returns an internal landing page which auto-submits that form. Verification
 * needs the callback's SaleOrderId and SaleReferenceId, which are passed by the
 * shared callback route through `callback`.
 */
export class BehpardakhtProvider implements PaymentProvider {
  readonly name = "BEHPARDAKHT" as const;

  private async credentials(): Promise<{ terminalId: string; username: string; password: string }> {
    const [terminalStored, usernameStored, passwordStored] = await Promise.all([
      getSecret("payment.mellat_terminal_id").catch(() => null),
      getSecret("payment.mellat_username").catch(() => null),
      getSecret("payment.mellat_password").catch(() => null),
    ]);
    const env = getServerEnv();
    const terminalId = terminalStored || env.BEHPARDAKHT_TERMINAL_ID;
    const username = usernameStored || env.BEHPARDAKHT_USERNAME;
    const password = passwordStored || env.BEHPARDAKHT_PASSWORD;
    if (!terminalId || !username || !password) {
      throw Errors.unavailable("اطلاعات درگاه به‌پرداخت ملت پیکربندی نشده است");
    }
    return { terminalId, username, password };
  }

  async available(): Promise<boolean> {
    try {
      await this.credentials();
      return true;
    } catch {
      return false;
    }
  }

  private async call(action: string, params: Record<string, string | number>): Promise<string | null> {
    const response = await fetch(PAY_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "text/xml; charset=utf-8",
        soapaction: action,
      },
      body: soapEnvelope(action, params),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!response.ok) {
      logger.error("behpardakht_request_failed", { action, status: response.status });
      throw Errors.unavailable("اتصال به درگاه به‌پرداخت ملت ممکن نشد");
    }
    return parseReturn(await response.text());
  }

  async initiate({ orderId, orderNumber, amountToman, callbackUrl }: {
    orderId: string;
    orderNumber: string;
    amountToman: number;
    callbackUrl: string;
  }) {
    const credentials = await this.credentials();
    const { localDate, localTime } = tehranDateAndTime();
    const saleOrderId = numericOrderId(orderId);

    const result = await this.call("bpPayRequest", {
      terminalId: credentials.terminalId,
      userName: credentials.username,
      userPassword: credentials.password,
      orderId: saleOrderId,
      amount: amountToman * 10,
      localDate,
      localTime,
      additionalData: `سفارش ${orderNumber}`,
      callBackUrl: callbackUrl,
      payerId: 0,
    });

    if (!result) throw Errors.unavailable("پاسخ نامعتبر از درگاه به‌پرداخت ملت");
    const [code, refId] = result.split(",").map((part) => part.trim());
    if (code !== "0" || !refId) {
      logger.warn("behpardakht_pay_rejected", { code, result });
      throw Errors.badRequest(`آغاز پرداخت در به‌پرداخت ملت ناموفق بود (کد ${code})`);
    }

    return {
      authority: refId,
      redirectUrl: `/api/payments/mellat/redirect?ref=${encodeURIComponent(refId)}`,
      message: "انتقال به درگاه به‌پرداخت ملت",
    };
  }

  async verify({ amountToman, callback = {} }: PaymentVerifyParams) {
    const credentials = await this.credentials();
    const saleReferenceId = callback.SaleReferenceId ?? callback.saleReferenceId ?? "";
    const saleOrderId = callback.SaleOrderId ?? callback.saleOrderId ?? "";
    const resCode = callback.ResCode ?? callback.resCode;

    if (!saleReferenceId || !saleOrderId) {
      return { ok: false, message: "اطلاعات بازگشتی درگاه کامل نیست" };
    }
    if (resCode !== undefined && resCode !== "0") {
      return { ok: false, message: `پرداخت توسط درگاه تأیید نشد (کد ${resCode})` };
    }

    const verifyResult = await this.call("bpVerifyRequest", {
      terminalId: credentials.terminalId,
      userName: credentials.username,
      userPassword: credentials.password,
      orderId: saleOrderId,
      saleOrderId,
      saleReferenceId,
    });
    // 0 = verified, 43 = already verified.
    if (verifyResult !== "0" && verifyResult !== "43") {
      return { ok: false, message: `تأیید پرداخت ناموفق بود (کد ${verifyResult ?? "نامشخص"})` };
    }

    const settleResult = await this.call("bpSettleRequest", {
      terminalId: credentials.terminalId,
      userName: credentials.username,
      userPassword: credentials.password,
      orderId: saleOrderId,
      saleOrderId,
      saleReferenceId,
    });
    // 0 = settled, 45 = already settled; other codes leave it verified + reviewable.
    if (settleResult !== "0" && settleResult !== "45") {
      return {
        ok: true,
        reference: `${saleReferenceId}-UNSETTLED-${settleResult ?? "?"}`,
        message: "پرداخت تأیید شد اما تسویه نهایی به بررسی نیاز دارد",
      };
    }

    return { ok: true, reference: saleReferenceId, message: `مبلغ ${amountToman} تومان تأیید شد` };
  }
}
