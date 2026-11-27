import Link from "next/link";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import type { Category } from "@prisma/client";
import { collectionForCategory } from "@/config/editorial";
import { themeBackground } from "@/components/editorial";
import { formatNumber } from "@/lib/persian";

export function ShopMasthead({ categories }: { categories: Array<{ id: string; name: string; slug: string; _count: { products: number } }> }) {
  const total = categories.reduce((sum, category) => sum + category._count.products, 0);
  return (
    <header className="relative overflow-hidden rounded-[32px] border border-line bg-surface p-8 sm:p-12">
      <div aria-hidden className="grain absolute inset-0 opacity-60" />
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="eyebrow">THE SHOP / SEASON ۱۴۰۴</p>
          <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.03] sm:text-7xl">
            کمد
            <span className="font-display italic text-primary/40"> آرام</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-8 text-ink/55">
            همهٔ قطعه‌ها، در یک صفحه. با فیلتر سایز، رنگ و قیمت مسیر را کوتاه کنید؛ یا از کالکشن‌ها شروع کنید.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl border border-line bg-canvas p-4">
            <p className="text-2xl font-semibold text-primary">{formatNumber(total)}</p>
            <p className="mt-1 text-[10px] text-ink/45">قطعه</p>
          </div>
          <div className="rounded-2xl border border-line bg-canvas p-4">
            <p className="text-2xl font-semibold text-primary">{formatNumber(categories.length)}</p>
            <p className="mt-1 text-[10px] text-ink/45">دسته</p>
          </div>
          <div className="rounded-2xl border border-line bg-canvas p-4">
            <p className="text-2xl font-semibold text-primary">۷</p>
            <p className="mt-1 text-[10px] text-ink/45">روز بازگشت</p>
          </div>
        </div>
      </div>
      <div className="relative mt-7 flex flex-wrap gap-2 border-t border-line pt-6">
        <Link href="/shop" className="inline-flex min-h-9 items-center rounded-full bg-primary px-4 text-[11px] text-white">همه</Link>
        {categories.map((category) => (
          <Link key={category.id} href={`/category/${category.slug}`} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-canvas px-4 text-[11px] text-ink/60 transition-colors hover:border-primary hover:text-primary">
            {category.name}
            <span className="text-[9px] text-ink/30">{formatNumber(category._count.products)}</span>
          </Link>
        ))}
        <Link href="/collections" className="inline-flex min-h-9 items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-4 text-[11px] text-primary">
          <Sparkles className="h-3 w-3" /> کالکشن‌ها
        </Link>
      </div>
    </header>
  );
}

export function SearchMasthead({ query, total }: { query: string; total: number }) {
  return (
    <header className="relative overflow-hidden rounded-[32px] border border-line bg-surface p-8 sm:p-10">
      <div aria-hidden className="grain absolute inset-0 opacity-50" />
      <div className="relative flex flex-wrap items-end justify-between gap-8">
        <div>
          <p className="eyebrow">SEARCH THE WARDROBE</p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-5xl">
            {query ? <>نتایج برای <span className="font-display italic text-primary/50">«{query}»</span></> : "چه چیزی را پیدا کنیم؟"}
          </h1>
          <p className="mt-3 text-xs text-ink/45">
            {query ? `${formatNumber(total)} قطعه پیدا شد.` : "نام محصول، کد، دسته‌بندی یا رنگ را جستجو کنید."}
          </p>
        </div>
        <form action="/search" role="search" className="flex w-full max-w-md gap-2">
          <label htmlFor="search-page-input" className="sr-only">جستجو</label>
          <input id="search-page-input" name="q" defaultValue={query} placeholder="مثلاً: هودی، جین، کرم..." className="field min-h-12" />
          <button type="submit" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl bg-primary px-5 text-sm text-white hover:bg-hover">
            <Search className="h-4 w-4" /> جستجو
          </button>
        </form>
      </div>
    </header>
  );
}

export function CategoryMasthead({
  category,
  productCount,
}: {
  category: Pick<Category, "name" | "slug" | "description">;
  productCount: number;
}) {
  const collection = collectionForCategory(category.slug);
  const theme = collection?.theme ?? { from: "#E9DFD2", to: "#B9A38F", accent: "#5B4737", ink: "dark" as const };

  return (
    <header className="relative overflow-hidden rounded-[32px]" style={themeBackground(theme)}>
      <div aria-hidden className="absolute -left-16 -top-20 h-64 w-64 rounded-full border-[40px] border-current opacity-[0.07]" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-6 font-display text-[180px] leading-none opacity-[0.08]">{collection?.index ?? "۰۱"}</div>
      <div className="relative flex flex-wrap items-end justify-between gap-8 p-8 sm:p-12">
        <div className="max-w-2xl">
          <p className="text-[10px] tracking-[0.28em] opacity-55">{collection ? `${collection.englishTitle.toUpperCase()} / COLLECTION` : "CATEGORY / COLLECTION"}</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight sm:text-6xl">{category.name}</h1>
          <p className="mt-4 max-w-xl text-sm leading-8 opacity-65">{collection?.subtitle ?? category.description ?? "قطعه‌های این دسته، با جزئیات کامل در صفحهٔ هر محصول."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-current/25 px-4 py-2 text-xs opacity-70">{formatNumber(productCount)} قطعه</span>
          {collection ? (
            <Link href={`/collections/${collection.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/20 px-5 text-xs font-medium backdrop-blur transition-colors hover:bg-white/30">
              دیدن کالکشن <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
