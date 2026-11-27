import Link from "next/link";
import { ArrowLeft, Home, ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getSiteConfig } from "@/config/site";

export default async function RootNotFound() {
  const site = await getSiteConfig();
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-16">
      <div className="w-full max-w-3xl text-center">
        <Link href="/" className="font-display text-3xl font-bold tracking-tight text-primary">{site.name}</Link>
        <p className="mt-10 font-display text-[110px] leading-none text-primary/15 sm:text-[150px]">404</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-4xl">صفحه‌ای که به دنبالش بودید پیدا نشد</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-ink/55">
          آدرس ممکن است اشتباه تایپ شده باشد یا این صفحه جابه‌جا شده باشد. از مسیرهای زیر ادامه دهید.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" size="lg"><Home className="h-4 w-4" /> خانه</ButtonLink>
          <ButtonLink href="/shop" size="lg" variant="outline"><ShoppingBag className="h-4 w-4" /> فروشگاه</ButtonLink>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-ink/45">
          <Link href="/new-arrivals" className="inline-flex items-center gap-1 hover:text-primary">تازه‌ها <ArrowLeft className="h-3 w-3" /></Link>
          <Link href="/collections" className="inline-flex items-center gap-1 hover:text-primary">کالکشن‌ها <ArrowLeft className="h-3 w-3" /></Link>
          <Link href="/contact" className="inline-flex items-center gap-1 hover:text-primary">تماس با ما <ArrowLeft className="h-3 w-3" /></Link>
        </div>
      </div>
    </div>
  );
}
