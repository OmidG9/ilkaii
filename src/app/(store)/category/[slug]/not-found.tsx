import Link from "next/link";
import { ArrowLeft, LayoutGrid, Search } from "lucide-react";
import { collections } from "@/config/editorial";
import { ButtonLink } from "@/components/ui/button";

export default function CategoryNotFound() {
  return (
    <div className="container-luxury py-16 sm:py-24">
      <div className="mx-auto max-w-3xl rounded-[36px] border border-line bg-surface p-8 text-center sm:p-14">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LayoutGrid className="h-7 w-7" /></span>
        <p className="mt-6 text-[10px] tracking-[0.32em] text-ink/35">CATEGORY / EMPTY RAIL</p>
        <h1 className="mt-4 text-balance text-3xl font-semibold sm:text-4xl">این دسته در فروشگاه نیست.</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-ink/55">دسته‌بندی حذف شده یا آدرس آن تغییر کرده است. از فهرست کالکشن‌ها یا جستجو شروع کنید.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop"><LayoutGrid className="h-4 w-4" /> همهٔ محصولات</ButtonLink>
          <ButtonLink href="/search" variant="outline"><Search className="h-4 w-4" /> جستجو</ButtonLink>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {collections.map((collection) => (
            <Link key={collection.slug} href={`/collections/${collection.slug}`} className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-3 py-1.5 text-[10px] text-ink/50 hover:border-primary hover:text-primary">
              {collection.title} <ArrowLeft className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
