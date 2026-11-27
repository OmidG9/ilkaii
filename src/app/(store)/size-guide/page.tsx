import type { Metadata } from "next";
import { ArrowLeft, Info, MoveHorizontal, Ruler, Scissors, Sparkles } from "lucide-react";
import { getSizeGuides } from "@/services/catalog";
import { getSiteConfig } from "@/config/site";
import { Breadcrumbs, Card } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "راهنمای سایز",
  description: "جدول اندازه‌ها و راهنمای انتخاب سایز برای پوشاک ilkaii.",
  alternates: { canonical: "/size-guide" },
};

const fallback = `| سایز | دور سینه (cm) | دور کمر (cm) | دور باسن (cm) |
| --- | --- | --- | --- |
| XS | 80 | 60 | 86 |
| S | 84 | 64 | 90 |
| M | 88 | 68 | 94 |
| L | 94 | 74 | 100 |
| XL | 100 | 80 | 106 |
| XXL | 106 | 86 | 112 |`;

function renderTable(content: string) {
  const rows = content.split("\n").map((line) => line.trim()).filter(Boolean);
  const cells = rows.map((row) => row.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
  const [header, ...body] = cells;
  return (
    <div className="table-wrap">
      <table className="table-luxury">
        {header ? <thead><tr>{header.map((cell, i) => <th key={i}>{cell}</th>)}</tr></thead> : null}
        <tbody>
          {body.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className={j === 0 ? "font-semibold text-primary" : ""}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default async function SizeGuidePage() {
  const [guides, site] = await Promise.all([getSizeGuides().catch(() => []), getSiteConfig()]);

  return (
    <div className="pb-24">
      <div className="container-luxury pt-6">
        <Breadcrumbs items={[{ label: "راهنمای سایز" }]} />
      </div>

      <section className="container-luxury">
        <div className="relative overflow-hidden rounded-[36px] border border-line bg-surface p-8 sm:p-12">
          <div aria-hidden className="grain absolute inset-0 opacity-60" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="eyebrow">FIT GUIDE / MEASURE ONCE</p>
              <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] sm:text-6xl">
                سایز درست،
                <br />
                <span className="font-display italic text-primary/45">بدون حدس</span>
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-8 text-ink/55">
                اندازه‌ها بر حسب سانتی‌متر هستند. اگر بین دو سایز قرار گرفتید، برای فرم آزادتر سایز بزرگ‌تر را انتخاب کنید. جدول هر محصول، دقیق‌ترین مرجع است.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "۳", label: "نقطهٔ اندازه‌گیری" },
                { value: "cm", label: "واحد جدول" },
                { value: "۷", label: "روز فرصت تعویض" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-line bg-canvas p-4 text-center">
                  <p className="text-2xl font-semibold text-primary">{item.value}</p>
                  <p className="mt-1 text-[10px] text-ink/45">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-luxury mt-10 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-8">
          {site.features.sizeGuide && guides.length ? (
            guides.map((guide, index) => (
              <Card key={guide.id} className="overflow-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-line bg-canvas px-6 py-5">
                  <div>
                    <p className="text-[10px] tracking-[0.24em] text-ink/35">GUIDE / {String(index + 1).padStart(2, "0")}</p>
                    <h2 className="mt-1 text-xl font-semibold">{guide.name}</h2>
                  </div>
                  <Ruler className="h-5 w-5 text-primary/50" />
                </div>
                <div className="p-4 sm:p-6">{renderTable(guide.content)}</div>
              </Card>
            ))
          ) : (
            <Card className="overflow-hidden">
              <div className="border-b border-line bg-canvas px-6 py-5">
                <p className="text-[10px] tracking-[0.24em] text-ink/35">GENERAL GUIDE</p>
                <h2 className="mt-1 text-xl font-semibold">جدول عمومی سایز</h2>
              </div>
              <div className="p-4 sm:p-6">{renderTable(fallback)}</div>
            </Card>
          )}

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-xs leading-7 text-ink/60">
            <p className="flex items-center gap-2 font-semibold text-primary"><Info className="h-4 w-4" /> نکتهٔ مهم</p>
            <p className="mt-2">اندازه‌ها ممکن است بین مدل‌ها کمی متفاوت باشند. جدول داخل صفحهٔ هر محصول، بر اساس همان برش است. در صورت تردید، از پشتیبانی اندازه‌های دقیق‌تر را بپرسید.</p>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="eyebrow">HOW TO MEASURE</p>
            <h2 className="mt-3 text-lg font-semibold">سه اندازه، سه دقیقه</h2>
            <ol className="mt-5 space-y-4 text-xs leading-6 text-ink/55">
              {[
                { icon: MoveHorizontal, title: "دور سینه", text: "متر را از پهن‌ترین نقطهٔ سینه، افقی و بدون فشار دور کنید." },
                { icon: Scissors, title: "دور کمر", text: "باریک‌ترین نقطهٔ کمر را اندازه بگیرید؛ شکم را داخل نکشید." },
                { icon: Sparkles, title: "دور باسن", text: "متر را از پهن‌ترین نقطهٔ باسن، حدود ۲۰ سانتی‌متر پایین‌تر از کمر بگیرید." },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span><strong className="text-ink/75">{title}:</strong> {text}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">بین دو سایز هستید؟</h2>
            <p className="mt-2 text-xs leading-6 text-ink/50">برای هودی و سویشرت، سایز بزرگ‌تر فرم اورسایز می‌دهد. برای لگینگ و تاپ ورزشی، اگر به فیت فشرده علاقه دارید سایز کوچک‌تر را انتخاب کنید.</p>
            <ButtonLink href="/contact" variant="outline" size="sm" className="mt-4 w-full">مشاورهٔ سایز</ButtonLink>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">تعویض سایز</h2>
            <p className="mt-2 text-xs leading-6 text-ink/50">تا ۷ روز پس از تحویل، در صورت موجود بودن سایز دیگر، امکان تعویض وجود دارد.</p>
            <ButtonLink href="/policies/returns" size="sm" className="mt-4 w-full">شرایط بازگشت</ButtonLink>
          </div>
        </aside>
      </section>

      <section className="container-luxury mt-16">
        <div className="flex flex-col gap-5 rounded-[32px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="eyebrow">STILL UNSURE?</p>
            <h2 className="mt-3 text-xl font-semibold">اندازه‌های خود را برای ما بفرستید</h2>
            <p className="mt-1 text-sm text-ink/50">دور سینه، کمر و باسن را بنویسید؛ سایز پیشنهادی را اعلام می‌کنیم.</p>
          </div>
          <ButtonLink href="/contact">تماس با پشتیبانی <ArrowLeft className="h-4 w-4" /></ButtonLink>
        </div>
      </section>
    </div>
  );
}
