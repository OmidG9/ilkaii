import Link from "next/link";
import { ArrowLeft, PackageX, Search, Sparkles } from "lucide-react";
import { collections } from "@/config/editorial";
import { ButtonLink } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="container-luxury py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[36px] border border-line bg-surface">
          <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
            <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-primary/5 p-10">
              <span aria-hidden className="absolute font-display text-[190px] leading-none text-primary/10">404</span>
              <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-surface text-primary shadow-soft">
                <PackageX className="h-8 w-8" />
              </span>
            </div>
            <div className="p-8 sm:p-12">
              <p className="eyebrow">PRODUCT NOT FOUND</p>
              <h1 className="mt-4 text-balance text-3xl font-semibold sm:text-4xl">این قطعه از قاب خارج شده است.</h1>
              <p className="mt-4 text-sm leading-8 text-ink/55">
                ممکن است محصول فروخته شده و از مجموعه حذف شده باشد، یا آدرس آن تغییر کرده باشد. قطعه‌های تازه و کالکشن‌های دیگر همچنان منتظر شما هستند.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/new-arrivals"><Sparkles className="h-4 w-4" /> تازه‌ها</ButtonLink>
                <ButtonLink href="/shop" variant="outline"><Search className="h-4 w-4" /> جستجو در فروشگاه</ButtonLink>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <p className="mb-4 text-center text-[10px] tracking-[0.28em] text-ink/35">OR EXPLORE A COLLECTION</p>
          <div className="flex flex-wrap justify-center gap-2">
            {collections.map((collection) => (
              <Link key={collection.slug} href={`/collections/${collection.slug}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-xs text-ink/60 transition-colors hover:border-primary hover:text-primary">
                {collection.title} <ArrowLeft className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
