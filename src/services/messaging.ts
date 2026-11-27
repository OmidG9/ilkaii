import type { NotificationChannel } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { getServerEnv, isProduction } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getSecret } from "@/lib/secrets";
import { formatToman, toToman } from "@/lib/money";

export interface Message {
  to: string;
  subject?: string;
  text: string;
  from?: string;
}

export interface MessagingProvider {
  readonly name: string;
  send(message: Message): Promise<void>;
}

/** Development provider. It never performs network calls and is blocked in production. */
const mockProvider: MessagingProvider = {
  name: "MOCK",
  async send(message) {
    if (isProduction()) throw Errors.unavailable("ارسال‌کننده آزمایشی در محیط تولید غیرفعال است");
    console.info(JSON.stringify({ level: "info", message: "mock_transactional_message", to: message.to.slice(0, 6) + "…" }));
  },
};

export async function getMessagingProvider(channel: NotificationChannel): Promise<MessagingProvider> {
  const env = getServerEnv();
  const [storedSmsUrl, storedSmsToken, storedEmailKey, storedFrom] = await Promise.all([
    channel === "SMS" ? getSecret("sms.api_url").catch(() => null) : Promise.resolve(null),
    channel === "SMS" ? getSecret("sms.api_token").catch(() => null) : Promise.resolve(null),
    channel === "EMAIL" ? getSecret("email.api_key").catch(() => null) : Promise.resolve(null),
    channel === "EMAIL" ? getSecret("email.from_address").catch(() => null) : Promise.resolve(null),
  ]);
  const url = channel === "SMS" ? (storedSmsUrl || env.SMS_API_URL) : process.env.EMAIL_API_URL;
  const token = channel === "SMS" ? (storedSmsToken || env.SMS_API_TOKEN) : storedEmailKey;
  if (!url || !token) {
    if (isProduction()) throw Errors.unavailable(`سرویس ${channel === "SMS" ? "پیامک" : "ایمیل"} پیکربندی نشده است`);
    return mockProvider;
  }
  return {
    name: channel === "SMS" ? "SMS_HTTP" : "EMAIL_HTTP",
    async send(message) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to: message.to,
          from: message.from ?? storedFrom ?? undefined,
          subject: message.subject,
          text: message.text,
        }),
        signal: AbortSignal.timeout(7000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Provider rejected message (${response.status})`);
    },
  };
}

/**
 * Best-effort transactional delivery. It always writes a NotificationLog row
 * and never throws, so an SMS outage can never break checkout or refunds.
 */
export async function sendTransactional(input: {
  channel: NotificationChannel;
  to: string;
  template: string;
  subject?: string;
  text: string;
}): Promise<{ sent: boolean; provider: string }> {
  let providerName = "unconfigured";
  try {
    const provider = await getMessagingProvider(input.channel);
    providerName = provider.name;
    await provider.send({ to: input.to, subject: input.subject, text: input.text });
    await prisma.notificationLog.create({
      data: {
        channel: input.channel,
        recipient: input.to.slice(0, 320),
        template: input.template.slice(0, 120),
        subject: input.subject?.slice(0, 250) ?? null,
        status: "SENT",
        provider: provider.name,
        sentAt: new Date(),
      },
    }).catch(() => undefined);
    return { sent: true, provider: providerName };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "unknown";
    logger.error("transactional_message_failed", { channel: input.channel, template: input.template, error: message });
    await prisma.notificationLog.create({
      data: {
        channel: input.channel,
        recipient: input.to.slice(0, 320),
        template: input.template.slice(0, 120),
        subject: input.subject?.slice(0, 250) ?? null,
        status: "FAILED",
        provider: providerName,
        error: message,
      },
    }).catch(() => undefined);
    return { sent: false, provider: providerName };
  }
}

export type OrderNotificationEvent = "CREATED" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

function orderNotification(event: OrderNotificationEvent, order: {
  orderNumber: string;
  totalAmount: Decimal;
  trackingNumber: string | null;
  recipientPhone: string;
}, amount?: number) {
  const total = formatToman(amount ?? toToman(order.totalAmount));
  switch (event) {
    case "CREATED":
      return { title: "سفارش ثبت شد", text: `سفارش ${order.orderNumber} با مبلغ ${total} ثبت شد. وضعیت سفارش را از حساب کاربری پیگیری کنید.` };
    case "PAID":
      return { title: "پرداخت تأیید شد", text: `پرداخت سفارش ${order.orderNumber} به مبلغ ${total} با موفقیت تأیید شد.` };
    case "SHIPPED":
      return { title: "سفارش ارسال شد", text: `سفارش ${order.orderNumber} ارسال شد.${order.trackingNumber ? ` کد پیگیری: ${order.trackingNumber}` : ""}` };
    case "DELIVERED":
      return { title: "سفارش تحویل شد", text: `سفارش ${order.orderNumber} تحویل داده شد. از خرید شما سپاسگزاریم.` };
    case "CANCELLED":
      return { title: "سفارش لغو شد", text: `سفارش ${order.orderNumber} لغو شد. در صورت کسر مبلغ، با پشتیبانی تماس بگیرید.` };
    case "REFUNDED":
      return { title: "بازپرداخت ثبت شد", text: `بازپرداخت ${total} برای سفارش ${order.orderNumber} ثبت شد.` };
  }
}

/** Sends a transactional SMS and (when available) email for an order event. */
export async function notifyOrder(orderId: string, event: OrderNotificationEvent, options: { amount?: number } = {}) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        totalAmount: true,
        trackingNumber: true,
        recipientPhone: true,
        user: { select: { email: true } },
      },
    });
    if (!order) return;
    const content = orderNotification(event, order, options.amount);
    const template = `order.${event.toLowerCase()}`;
    const tasks: Array<Promise<unknown>> = [
      sendTransactional({ channel: "SMS", to: order.recipientPhone, template, text: `${content.title}\n${content.text}` }),
    ];
    if (order.user?.email) {
      tasks.push(sendTransactional({
        channel: "EMAIL", to: order.user.email, template, subject: `ilkaii — ${content.title}`, text: content.text,
      }));
    }
    await Promise.allSettled(tasks);
  } catch (error) {
    logger.error("order_notification_failed", { orderId, event, error: error instanceof Error ? error.message : String(error) });
  }
}

export type ReturnNotificationStatus = "APPROVED" | "REJECTED" | "COMPLETED";

export async function notifyReturn(returnRequestId: string, status: ReturnNotificationStatus) {
  try {
    const request = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      select: {
        order: { select: { orderNumber: true } },
        user: { select: { phone: true, email: true } },
      },
    });
    if (!request) return;
    const title = status === "APPROVED" ? "درخواست بازگشت تأیید شد" : status === "REJECTED" ? "درخواست بازگشت رد شد" : "بازگشت کالا تکمیل شد";
    const text = `درخواست بازگشت شما برای سفارش ${request.order.orderNumber} ${
      status === "APPROVED" ? "تأیید شد" : status === "REJECTED" ? "رد شد" : "تکمیل و موجودی آن بازگردانده شد"
    }. برای جزئیات به حساب کاربری مراجعه کنید.`;
    const tasks: Array<Promise<unknown>> = [
      sendTransactional({ channel: "SMS", to: request.user.phone, template: `return.${status.toLowerCase()}`, text: `${title}\n${text}` }),
    ];
    if (request.user.email) {
      tasks.push(sendTransactional({ channel: "EMAIL", to: request.user.email, template: `return.${status.toLowerCase()}`, subject: `ilkaii — ${title}`, text }));
    }
    await Promise.allSettled(tasks);
  } catch (error) {
    logger.error("return_notification_failed", { returnRequestId, status, error: error instanceof Error ? error.message : String(error) });
  }
}
