import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { isProduction } from "@/lib/env";
import { getServerEnv } from "@/lib/env";
import { getSecret } from "@/lib/secrets";
import type { CampaignChannel, CampaignStatus, SubscriberStatus } from "@prisma/client";
import { toToman } from "@/lib/money";

const num = (value: unknown): number => Number(value ?? 0);

export interface CampaignInput {
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  subject?: string;
  content: string;
  audience?: string;
  couponId?: string;
  startsAt?: Date;
  endsAt?: Date;
  scheduledAt?: Date;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function listCampaigns() {
  return prisma.marketingCampaign.findMany({ orderBy: { createdAt: "desc" }, include: { coupon: { select: { code: true } } } });
}

export async function createCampaign(input: CampaignInput, actorId: string) {
  const campaign = await prisma.marketingCampaign.create({
    data: {
      ...input,
      subject: input.subject ?? null,
      audience: input.audience ?? null,
      couponId: input.couponId ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      scheduledAt: input.scheduledAt ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      createdById: actorId,
    },
  });
  await audit({ actorId, action: "marketing.campaign_created", entity: "MarketingCampaign", entityId: campaign.id, after: { name: campaign.name, channel: campaign.channel } });
  return campaign;
}

export async function updateCampaign(id: string, input: Partial<CampaignInput>, actorId: string) {
  const before = await prisma.marketingCampaign.findUnique({ where: { id } });
  if (!before) throw Errors.notFound("کمپین یافت نشد");
  if (before.status === "COMPLETED" && input.status && input.status !== "COMPLETED") {
    throw Errors.conflict("کمپین تکمیل‌شده را نمی‌توان مجدداً فعال کرد");
  }
  const campaign = await prisma.marketingCampaign.update({ where: { id }, data: input });
  await audit({ actorId, action: "marketing.campaign_updated", entity: "MarketingCampaign", entityId: id, before: { name: before.name, status: before.status }, after: { name: campaign.name, status: campaign.status } });
  return campaign;
}

export async function deleteCampaign(id: string, actorId: string) {
  const campaign = await prisma.marketingCampaign.delete({ where: { id } });
  await audit({ actorId, action: "marketing.campaign_deleted", entity: "MarketingCampaign", entityId: id, before: { name: campaign.name } });
}

export async function listSubscribers(q?: string) {
  return prisma.newsletterSubscriber.findMany({
    where: q ? { OR: [{ email: { contains: q } }, { phone: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function createSubscriber(input: { email?: string; phone?: string; status: SubscriberStatus; source?: string }, actorId: string) {
  if (input.email && await prisma.newsletterSubscriber.findUnique({ where: { email: input.email } })) throw Errors.conflict("این ایمیل قبلاً ثبت شده است");
  if (input.phone && await prisma.newsletterSubscriber.findUnique({ where: { phone: input.phone } })) throw Errors.conflict("این موبایل قبلاً ثبت شده است");
  const subscriber = await prisma.newsletterSubscriber.create({
    data: {
      email: input.email ?? null,
      phone: input.phone ?? null,
      status: input.status,
      source: input.source ?? "admin",
      consentAt: input.status === "ACTIVE" ? new Date() : null,
      unsubscribeToken: randomBytes(24).toString("hex"),
    },
  });
  await audit({ actorId, action: "marketing.subscriber_created", entity: "NewsletterSubscriber", entityId: subscriber.id, after: { status: subscriber.status } });
  return subscriber;
}

export async function updateSubscriber(id: string, input: { status?: SubscriberStatus }, actorId: string) {
  const before = await prisma.newsletterSubscriber.findUnique({ where: { id } });
  if (!before) throw Errors.notFound("مشترک یافت نشد");
  const subscriber = await prisma.newsletterSubscriber.update({
    where: { id },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.status === "ACTIVE" ? { consentAt: new Date(), unsubscribedAt: null } : {}),
      ...(input.status === "UNSUBSCRIBED" ? { unsubscribedAt: new Date() } : {}),
    },
  });
  await audit({ actorId, action: "marketing.subscriber_updated", entity: "NewsletterSubscriber", entityId: id, before: { status: before.status }, after: { status: subscriber.status } });
  return subscriber;
}

export async function deleteSubscriber(id: string, actorId: string) {
  const subscriber = await prisma.newsletterSubscriber.delete({ where: { id } });
  await audit({ actorId, action: "marketing.subscriber_deleted", entity: "NewsletterSubscriber", entityId: id, before: { email: subscriber.email, phone: subscriber.phone } });
}

/** Public, consent-aware signup. Address is PENDING until an operator/email double opt-in. */
export async function subscribeNewsletter(input: { email?: string; phone?: string; source?: string }) {
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();
  const existing = email
    ? await prisma.newsletterSubscriber.findUnique({ where: { email } })
    : phone ? await prisma.newsletterSubscriber.findUnique({ where: { phone } }) : null;
  if (existing) {
    if (existing.status === "UNSUBSCRIBED") {
      const updated = await prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: { status: "PENDING", unsubscribeToken: existing.unsubscribeToken ?? randomBytes(24).toString("hex") },
      });
      return { status: updated.status };
    }
    return { status: existing.status };
  }
  const created = await prisma.newsletterSubscriber.create({
    data: {
      email: email ?? null,
      phone: phone ?? null,
      status: "PENDING",
      source: input.source?.slice(0, 120) ?? "website",
      consentAt: new Date(),
      unsubscribeToken: randomBytes(24).toString("hex"),
    },
  });
  return { status: created.status };
}

export async function unsubscribeNewsletter(token: string) {
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token } });
  if (!subscriber) throw Errors.notFound("لینک لغو عضویت معتبر نیست");
  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
  });
  return { unsubscribed: true };
}

export async function campaignPerformance() {
  const rows = await prisma.$queryRaw<Array<{ campaign: string; source: string; sessions: unknown; purchases: unknown; revenue: unknown }>>(Prisma.sql`
    SELECT COALESCE(NULLIF(s.utmCampaign,''),'—') AS campaign,
           COALESCE(NULLIF(s.utmSource,''),'direct') AS source,
           COUNT(DISTINCT s.id) AS sessions,
           COUNT(DISTINCT CASE WHEN e.name='purchase' THEN e.id END) AS purchases,
           CAST(COALESCE(SUM(CASE WHEN e.name='purchase' THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(e.metadata,'$.revenue')) AS DECIMAL(14,2)) WHEN e.name='refund' THEN -CAST(JSON_UNQUOTE(JSON_EXTRACT(e.metadata,'$.revenue')) AS DECIMAL(14,2)) ELSE 0 END),0) AS SIGNED) AS revenue
    FROM AnalyticsSession s LEFT JOIN AnalyticsEvent e ON e.sessionId=s.id
    GROUP BY campaign, source ORDER BY sessions DESC LIMIT 100`);
  return rows.map((row) => ({
    campaign: row.campaign,
    source: row.source,
    sessions: num(row.sessions),
    purchases: num(row.purchases),
    revenue: toToman(num(row.revenue)),
    conversion: num(row.sessions) ? (num(row.purchases) / num(row.sessions)) * 100 : null,
  }));
}

export async function abandonedCarts() {
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const carts = await prisma.cart.findMany({
    where: { userId: { not: null }, updatedAt: { lt: cutoff }, items: { some: {} } },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, phone: true, firstName: true, lastName: true, marketingOptIn: true } },
      items: { select: { quantity: true, product: { select: { name: true, basePrice: true, salePrice: true } } } },
    },
  });
  return carts.map((cart) => ({
    id: cart.id,
    user: cart.user,
    updatedAt: cart.updatedAt,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    value: cart.items.reduce((sum, item) => sum + item.quantity * toToman(item.product.salePrice ?? item.product.basePrice), 0),
    products: cart.items.map((item) => item.product.name).slice(0, 4),
  }));
}

export async function marketingStats() {
  const [campaigns, active, subscribers, activeSubscribers, carts] = await Promise.all([
    prisma.marketingCampaign.count(),
    prisma.marketingCampaign.count({ where: { status: "ACTIVE" } }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    abandonedCarts(),
  ]);
  return { campaigns, active, subscribers, activeSubscribers, abandonedCarts: carts.length, abandonedCartValue: carts.reduce((sum, cart) => sum + cart.value, 0) };
}

// ---------------------------------------------------------------------------
// Notification adapters
// ---------------------------------------------------------------------------

export interface NotificationMessage {
  to: string;
  subject?: string;
  text: string;
}

export interface NotificationProvider {
  readonly name: string;
  send(message: NotificationMessage): Promise<void>;
}

/** Development provider. It never performs network calls and is blocked in production. */
const mockProvider: NotificationProvider = {
  name: "MOCK",
  async send(message) {
    if (isProduction()) throw Errors.unavailable("ارسال‌کننده آزمایشی در محیط تولید غیرفعال است");
    console.info(JSON.stringify({ level: "info", message: "mock_notification", to: message.to.slice(0, 6) + "…" }));
  },
};

async function httpProvider(channel: CampaignChannel): Promise<NotificationProvider> {
  const env = getServerEnv();
  const [storedSmsUrl, storedSmsToken, storedEmailKey] = await Promise.all([
    channel === "SMS" ? getSecret("sms.api_url").catch(() => null) : Promise.resolve(null),
    channel === "SMS" ? getSecret("sms.api_token").catch(() => null) : Promise.resolve(null),
    channel === "EMAIL" ? getSecret("email.api_key").catch(() => null) : Promise.resolve(null),
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
        body: JSON.stringify({ to: message.to, subject: message.subject, text: message.text }),
      });
      if (!response.ok) throw new Error(`Provider rejected message (${response.status})`);
    },
  };
}

export async function dispatchCampaign(id: string, actorId: string) {
  const campaign = await prisma.marketingCampaign.findUnique({ where: { id } });
  if (!campaign) throw Errors.notFound("کمپین یافت نشد");
  if (campaign.channel === "BANNER") throw Errors.badRequest("کمپین بنری از طریق مدیریت بنرها منتشر می‌شود");
  if (campaign.status === "COMPLETED") throw Errors.conflict("این کمپین قبلاً ارسال شده است");

  const audience = campaign.audience ?? "subscribers";
  const recipients: Array<{ to: string; name?: string; customerId?: string; unsubscribeUrl?: string }> = [];
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  if (campaign.channel === "SMS") {
    if (audience === "subscribers") {
      const rows = await prisma.newsletterSubscriber.findMany({ where: { status: "ACTIVE", phone: { not: null } }, select: { phone: true, unsubscribeToken: true }, take: 500 });
      for (const row of rows) if (row.phone) recipients.push({ to: row.phone, unsubscribeUrl: row.unsubscribeToken ? `${baseUrl}/unsubscribe?token=${row.unsubscribeToken}` : undefined });
    } else {
      const rows = await prisma.user.findMany({ where: { isActive: true, marketingOptIn: true, phone: { not: "" } }, select: { phone: true, firstName: true, id: true }, take: 500 });
      for (const row of rows) recipients.push({ to: row.phone, name: row.firstName ?? undefined, customerId: row.id, unsubscribeUrl: `${baseUrl}/account` });
    }
  } else {
    if (audience === "subscribers") {
      const rows = await prisma.newsletterSubscriber.findMany({ where: { status: "ACTIVE", email: { not: null } }, select: { email: true, unsubscribeToken: true }, take: 500 });
      for (const row of rows) if (row.email) recipients.push({ to: row.email, unsubscribeUrl: row.unsubscribeToken ? `${baseUrl}/unsubscribe?token=${row.unsubscribeToken}` : undefined });
    } else {
      const rows = await prisma.user.findMany({ where: { isActive: true, marketingOptIn: true, email: { not: null } }, select: { email: true, firstName: true, id: true }, take: 500 });
      for (const row of rows) if (row.email) recipients.push({ to: row.email, name: row.firstName ?? undefined, customerId: row.id, unsubscribeUrl: `${baseUrl}/account` });
    }
  }

  if (!recipients.length) throw Errors.conflict("گیرنده‌ای با رضایت بازاریابی یافت نشد");

  const provider = await httpProvider(campaign.channel);
  let sent = 0;
  let failed = 0;
  for (const recipient of recipients.slice(0, 500)) {
    const text = campaign.content
      .replace(/\{\{\s*name\s*\}\}/g, recipient.name ?? "مشتری")
      .replace(/\{\{\s*unsubscribe_url\s*\}\}/g, recipient.unsubscribeUrl ?? `${baseUrl}/unsubscribe`);
    try {
      await provider.send({ to: recipient.to, subject: campaign.subject ?? campaign.name, text });
      await prisma.notificationLog.create({
        data: { channel: campaign.channel, recipient: recipient.to, template: campaign.name, subject: campaign.subject, status: "SENT", provider: provider.name, sentAt: new Date() },
      });
      if (recipient.customerId) await prisma.user.update({ where: { id: recipient.customerId }, data: { lastActivityAt: new Date() } }).catch(() => undefined);
      sent += 1;
    } catch (error) {
      await prisma.notificationLog.create({
        data: { channel: campaign.channel, recipient: recipient.to, template: campaign.name, subject: campaign.subject, status: "FAILED", provider: provider.name, error: error instanceof Error ? error.message.slice(0, 500) : "unknown" },
      });
      failed += 1;
    }
  }
  const status = sent > 0 ? "COMPLETED" : "PAUSED";
  await prisma.marketingCampaign.update({ where: { id }, data: { status, sentAt: sent > 0 ? new Date() : null } });
  await audit({ actorId, action: "marketing.campaign_dispatched", entity: "MarketingCampaign", entityId: id, metadata: { sent, failed, provider: provider.name }, severity: "warn" });
  return { sent, failed, provider: provider.name };
}

export async function listNotificationLogs(page = 1, pageSize = 30) {
  const [total, items] = await prisma.$transaction([
    prisma.notificationLog.count(),
    prisma.notificationLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
