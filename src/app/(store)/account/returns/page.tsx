import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { listMyReturns } from "@/services/account";
import { Card, SectionTitle } from "@/components/ui/display";
import { formatJalali } from "@/lib/persian";
import { returnStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "درخواستهای بازگشت", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const user = await requirePageUser();
  const returns = await listMyReturns(user.id);
  return (
    <section>
      <SectionTitle title="درخواستهای بازگشت" />
      {returns.length ? (
        <div className="space-y-4">
          {returns.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p dir="ltr" className="text-sm font-semibold text-primary">{item.order.orderNumber}</p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{returnStatusLabels[item.status]}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/65">{item.reason}</p>
              {item.note ? <p className="mt-2 rounded-xl bg-canvas p-3 text-xs text-ink/60">پاسخ مدیر: {item.note}</p> : null}
              <p className="mt-3 text-xs text-ink/45">{formatJalali(item.createdAt)}</p>
            </Card>
          ))}
        </div>
      ) : <Card className="p-8 text-center text-sm text-ink/55">درخواست بازگشتی ثبت نکردهاید.</Card>}
    </section>
  );
}
