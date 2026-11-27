import Link from "next/link";
import { ArrowLeft, Compass, Layers, Sparkles } from "lucide-react";
import { collections } from "@/config/editorial";
import { ButtonLink } from "@/components/ui/button";
import { themeBackground } from "@/components/editorial";

export default function CollectionNotFound() {
  return (
    <div className="container-luxury py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[36px] border border-line bg-surface p-8 sm:p-12">
          <div aria-hidden className="grain absolute inset-0 opacity-50" />
          <div className="relative text-center">
            <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Layers className="h-7 w-7" /></span>
            <p className="mt-6 text-[10px] tracking-[0.32em] text-ink/35">COLLECTION / NOT FOUND</p>
            <h1 className="mx-auto mt-4 max-w-xl text-balance text-3xl font-semibold sm:text-4xl">این کالکشن از قاب خارج شده است.</h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-ink/55">
              ممکن است فصل آن تمام شده باشد یا نام کالکشن تغییر کرده باشد. یکی از مجموعه‌های فعلی را ببینید؛ هر کدام یک قاب کامل برای شماست.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/collections"><Compass className="h-4 w-4" /> همهٔ کالکشن‌ها</ButtonLink>
              <ButtonLink href="/new-arrivals" variant="outline"><Sparkles className="h-4 w-4" /> تازه‌ها</ButtonLink>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.slice(0, 3).map((collection) => (
            <Link key={collection.slug} href={`/collections/${collection.slug}`} className="group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-2xl p-5" style={themeBackground(collection.theme)}>
              <span className="text-[9px] tracking-[0.24em] opacity-55">{collection.englishTitle.toUpperCase()}</span>
              <span>
                <span className="block text-lg font-semibold">{collection.title}</span>
                <span className="mt-1 flex items-center gap-1 text-[10px] opacity-55">مشاهدهٔ کالکشن <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /></span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
