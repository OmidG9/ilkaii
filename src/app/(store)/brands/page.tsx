import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, Handshake, Sparkles } from "lucide-react";
import { getPublicBrands } from "@/services/storefront";
import { ButtonLink } from "@/components/ui/button";
import { Marquee } from "@/components/editorial";
import { SafeImage } from "@/components/safe-image";
import { formatNumber } from "@/lib/persian";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "برندها",
  description: "برندها و همکاران طراحی ilkaii؛ انتخاب‌هایی با کیفیت و داستان مشخص.",
  alternates: { canonical: "/brands" },
};

const gradients = [
  "linear-gradient(135deg, #E9DFD2, #B9A38F)",
  "linear-gradient(135deg, #B7B0A6, #4A453F)",
  "linear-gradient(135deg, #C9CCBD, #5D6454)",
  "linear-gradient(135deg, #D8C8B9, #8A6F5C)",
  "linear-gradient(135deg, #B9C2CA, #4D5864)",
  "linear-gradient(135deg, #E4D5CB, #A88472)",
];

export default async function BrandsPage() {
  const brands = await getPublicBrands();

  return (
    <div className="pb-24">
      <section className="container-luxury pt-8 sm:pt-14">
        <div className="grid gap-10 border-b border-line pb-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="eyebrow">THE MAKERS / BRANDS</p>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] sm:text-7xl">
              نام‌هایی که
              <br />
              <span className="font-display italic text-primary/45">انتخاب می‌کنیم</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-8 text-ink/55">
              هر برند در ilkaii یک دلیل مشخص دارد: یک پارچهٔ خاص، یک دوخت متفاوت یا یک نگاه تازه به لباس روزمره. ما نام‌ها را بر اساس کیفیت انتخاب می‌کنیم، نه تبلیغات.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { value: brands.length, label: "برند فعال" },
              { value: "۱۰۰٪", label: "انتخاب حضوری" },
              { value: "۰", label: "تولید انبوه" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-2xl font-semibold">{typeof item.value === "number" ? formatNumber(item.value) : item.value}</p>
                <p className="mt-2 text-[10px] text-ink/45">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Marquee
        className="mt-8"
        items={["SELECTED MAKERS", "QUALITY OVER NOISE", "هر نام، یک دلیل", "ILKAII BRANDS", "SMALL STUDIOS"]}
      />

      {brands.length ? (
        <section className="container-luxury mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand, index) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[30px] p-7 transition-transform duration-500 hover:-translate-y-1"
              style={{ background: gradients[index % gradients.length], color: index % 3 === 1 ? "#f8f5f1" : "#292420" }}
            >
              <div aria-hidden className="absolute -left-8 -top-10 font-display text-[180px] leading-none opacity-10">{brand.name.slice(0, 1).toUpperCase()}</div>
              <div className="relative flex items-start justify-between gap-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-current/20 bg-white/10 font-display text-2xl backdrop-blur">
                  {brand.logo ? (
                    <span className="relative h-10 w-10 overflow-hidden rounded-lg">
                      <SafeImage src={brand.logo} alt={brand.name} fill sizes="40px" className="object-contain" fallbackLabel={brand.name.slice(0, 1)} />
                    </span>
                  ) : (
                    brand.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-current/20 transition-colors group-hover:bg-current/10">
                  <ArrowUpLeft className="h-4 w-4" />
                </span>
              </div>
              <div className="relative mt-12">
                <p className="text-[10px] tracking-[0.3em] opacity-55">MAKER / {String(index + 1).padStart(2, "0")}</p>
                <h2 className="mt-3 text-3xl font-semibold">{brand.name}</h2>
                {brand.description ? <p className="mt-3 line-clamp-3 text-sm leading-7 opacity-65">{brand.description}</p> : null}
                <p className="mt-5 text-[11px] opacity-55">{formatNumber(brand._count.products)} قطعه در فروشگاه</p>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="container-luxury mt-12">
          <div className="grid gap-8 rounded-[32px] border border-dashed border-line bg-surface p-8 text-center sm:p-14 lg:grid-cols-[1fr_auto] lg:items-center lg:text-right">
            <div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span>
              <h2 className="mt-5 text-2xl font-semibold">به‌زودی، برندهای مهمان</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-ink/55">
                در حال حاضر همهٔ قطعه‌های فروشگاه زیر نام ilkaii تولید می‌شوند. به‌زودی استودیوهای منتخب و همکاران طراحی به این صفحه اضافه می‌شوند.
              </p>
            </div>
            <ButtonLink href="/collections" size="lg">دیدن کالکشن‌ها</ButtonLink>
          </div>
        </section>
      )}

      <section className="container-luxury mt-20 grid gap-5 sm:grid-cols-3">
        {[
          { icon: Sparkles, title: "انتخاب محدود", text: "تعداد برندها را کم نگه می‌داریم تا کیفیت قابل پیگیری بماند." },
          { icon: Handshake, title: "همکاری بلندمدت", text: "با سازنده‌هایی کار می‌کنیم که حاضرند دربارهٔ پارچه و فرآیند شفاف باشند." },
          { icon: ArrowUpLeft, title: "قابل خرید", text: "همهٔ برندهای این صفحه، محصولات فعال و موجود در فروشگاه دارند." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl border border-line bg-surface p-6">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 text-sm font-semibold">{title}</h3>
            <p className="mt-2 text-xs leading-6 text-ink/55">{text}</p>
          </div>
        ))}
      </section>

      <section className="container-luxury mt-20">
        <div className="flex flex-col gap-6 rounded-[32px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <p className="eyebrow">FOR DESIGNERS</p>
            <h2 className="mt-3 text-2xl font-semibold">برند یا استودیو دارید؟</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-ink/55">اگر روی کیفیت پارچه و شفافیت تولید جدی هستید، داستان برندتان را برای ما بفرستید.</p>
          </div>
          <ButtonLink href="/contact?subject=همکاری" variant="outline">شروع گفت‌وگو</ButtonLink>
        </div>
      </section>
    </div>
  );
}
