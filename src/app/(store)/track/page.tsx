import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/display";
import { TrackForm } from "@/components/track-form";

export const metadata: Metadata = { title: "پیگیری سفارش", robots: { index: false } };

export default function TrackPage() {
  return (
    <div className="container-luxury max-w-3xl py-12">
      <Breadcrumbs items={[{ label: "پیگیری سفارش" }]} />
      <h1 className="mb-2 text-3xl font-semibold">پیگیری سفارش</h1>
      <p className="mb-8 text-sm text-ink/60">شماره سفارش و شماره موبایل استفادهشده هنگام خرید را وارد کنید.</p>
      <TrackForm />
    </div>
  );
}
