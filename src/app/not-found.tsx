import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-luxury flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-7xl font-display text-primary/30">404</p>
      <h1 className="mt-4 text-2xl font-semibold">صفحهای که میخواهید وجود ندارد</h1>
      <p className="mt-2 max-w-md text-sm leading-7 text-ink/60">آدرس ممکن است تغییر کرده باشد یا محصول از مجموعه خارج شده باشد.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">بازگشت به خانه</ButtonLink>
        <ButtonLink href="/shop" variant="outline">مشاهده فروشگاه</ButtonLink>
      </div>
    </div>
  );
}
