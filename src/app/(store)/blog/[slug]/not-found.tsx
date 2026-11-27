import Link from "next/link";
import { ArrowLeft, BookOpen, PenLine, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function BlogPostNotFound() {
  return (
    <div className="container-luxury py-16 sm:py-24">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[36px] border border-line bg-surface">
        <div className="relative border-b border-line bg-canvas px-8 py-12 text-center sm:px-12">
          <div aria-hidden className="grain absolute inset-0 opacity-50" />
          <p className="relative text-[10px] tracking-[0.32em] text-ink/35">JOURNAL / ARCHIVE MISS</p>
          <p aria-hidden className="relative mt-3 font-display text-[100px] leading-none text-primary/10">۰۴</p>
          <h1 className="relative mt-2 text-3xl font-semibold sm:text-4xl">این صفحه از ژورنال پیدا نشد.</h1>
        </div>
        <div className="p-8 text-center sm:p-12">
          <p className="mx-auto max-w-lg text-sm leading-8 text-ink/55">
            شمارهٔ مجله تغییر کرده یا مقاله از آرشیو خارج شده است. می‌توانید همهٔ مقاله‌ها را ببینید یا سراغ کالکشن‌ها بروید.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/blog"><BookOpen className="h-4 w-4" /> همهٔ مقاله‌ها</ButtonLink>
            <ButtonLink href="/collections" variant="outline"><Search className="h-4 w-4" /> کالکشن‌ها</ButtonLink>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-5 text-xs text-ink/40">
            <Link href="/" className="hover:text-primary">خانه</Link>
            <Link href="/new-arrivals" className="hover:text-primary">تازه‌ها</Link>
            <Link href="/contact" className="inline-flex items-center gap-1 hover:text-primary"><PenLine className="h-3 w-3" /> پیشنهاد موضوع</Link>
            <Link href="/blog" className="inline-flex items-center gap-1 hover:text-primary">ژورنال <ArrowLeft className="h-3 w-3" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
