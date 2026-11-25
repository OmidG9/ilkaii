import Link from "next/link";
import type { SiteConfig } from "@/config/site";
import type { StoreMenuItem } from "@/lib/navigation";
import { formatNumber } from "@/lib/persian";
import { NewsletterForm } from "@/components/newsletter-form";

function flattenMenu(items: StoreMenuItem[], depth = 0): Array<StoreMenuItem & { depth: number }> {
  return items.flatMap((item) => [{ ...item, depth }, ...flattenMenu(item.children, depth + 1)]);
}

export function Footer({ site, menu }: { site: SiteConfig; menu?: StoreMenuItem[] }) {
  const menuItems = menu?.length ? flattenMenu(menu).slice(0, 12) : [];
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-luxury grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="font-display text-2xl text-primary">{site.name}</h2>
          <p className="mt-3 text-sm leading-7 text-ink/60">{site.tagline}</p>
          <p className="mt-4 text-xs text-ink/50">تمام قیمت‌ها به تومان نمایش داده می‌شود.</p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold">فروشگاه</h3>
          <ul className="space-y-3 text-sm text-ink/70">
            {menuItems.length ? menuItems.map((item) => (
              <li key={item.id} style={{ paddingInlineStart: `${item.depth * 12}px` }}>
                <Link className="link-underline" href={item.href} target={item.target === "_blank" ? "_blank" : undefined} rel={item.target === "_blank" ? "noopener noreferrer" : undefined}>{item.label}</Link>
              </li>
            )) : (
              <>
                <li><Link className="link-underline" href="/shop">همه محصولات</Link></li>
                <li><Link className="link-underline" href="/shop?newArrival=true">جدیدها</Link></li>
                <li><Link className="link-underline" href="/shop?available=true">موجودی‌ها</Link></li>
                <li><Link className="link-underline" href="/account/wishlist">علاقه‌مندی‌ها</Link></li>
              </>
            )}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold">اطلاعات</h3>
          <ul className="space-y-3 text-sm text-ink/70">
            <li><Link className="link-underline" href="/about">درباره ما</Link></li>
            <li><Link className="link-underline" href="/contact">تماس با ما</Link></li>
            <li><Link className="link-underline" href="/policies/shipping">ارسال و تحویل</Link></li>
            <li><Link className="link-underline" href="/policies/returns">بازگشت کالا</Link></li>
            <li><Link className="link-underline" href="/track">پیگیری سفارش</Link></li>
            <li><Link className="link-underline" href="/blog">وبلاگ</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold">ارتباط</h3>
          <p className="text-sm text-ink/70">{site.contact.email}</p>
          <p dir="ltr" className="mt-2 text-sm text-ink/70">{site.contact.phone}</p>
          <p className="mt-2 text-sm text-ink/70">{site.contact.address}</p>
          {site.features.newsletter ? (
            <div className="mt-4">
              <p className="text-xs font-semibold">عضویت در خبرنامه</p>
              <NewsletterForm compact />
            </div>
          ) : null}
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink/50">
        © {formatNumber(new Date().getFullYear())} {site.name} — تمامی حقوق محفوظ است.
      </div>
    </footer>
  );
}
