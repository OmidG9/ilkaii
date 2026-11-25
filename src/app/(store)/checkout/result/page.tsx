import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Breadcrumbs, Card } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { normalizeSearchParams } from "@/lib/search-params";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "نتیجه سفارش", robots: { index: false } };

export default async function CheckoutResultPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = normalizeSearchParams(await searchParams);
  const success = params.status === "success";
  const order = params.order ?? "";
  return (
    <div className="container-luxury max-w-3xl py-16">
      <Breadcrumbs items={[{ label: "نتیجه سفارش" }]} />
      <Card className="p-8 text-center sm:p-12">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-2xl ${success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
          {success ? "✓" : "!"}
        </div>
        <h1 className="text-2xl font-semibold">{success ? "سفارش شما ثبت شد" : "پرداخت ناموفق بود"}</h1>
        <p className="mt-3 text-sm leading-7 text-ink/65">
          {success
            ? "سفارش شما با موفقیت ثبت و پرداخت آن تأیید شد. جزئیات سفارش را در حساب خود مشاهده کنید."
            : "پرداخت تکمیل نشد و موجودی محصولات دوباره تنظیم شد. میتوانید مجدداً تلاش کنید."}
        </p>
        {order ? <p dir="ltr" className="mt-4 text-sm font-medium text-primary">{order}</p> : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href={order ? `/account/orders/${encodeURIComponent(order)}` : "/account/orders"}>
            مشاهده سفارش
          </ButtonLink>
          <ButtonLink href="/shop" variant="outline">بازگشت به فروشگاه</ButtonLink>
        </div>
        {!success ? (
          <div className="mt-6"><Alert tone="error">در صورت کسر مبلغ از حساب، با پشتیبانی تماس بگیرید.</Alert></div>
        ) : null}
        <p className="mt-6 text-xs text-ink/45">
          <Link href="/contact" className="underline">ارتباط با پشتیبانی</Link>
        </p>
      </Card>
    </div>
  );
}
