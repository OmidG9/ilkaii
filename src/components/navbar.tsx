"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { SiteConfig } from "@/config/site";
import type { StoreMenuItem } from "@/lib/navigation";
import { formatToman } from "@/lib/money";
import { ThemeToggle } from "@/components/theme-toggle";

function item(id: string, href: string, label: string, children: StoreMenuItem[] = []): StoreMenuItem {
  return { id, href, label, target: "_self", children };
}

const DEFAULT_LINKS: StoreMenuItem[] = [
  item("shop", "/shop", "فروشگاه", [
    item("shop-all", "/shop", "همهٔ محصولات"),
    item("shop-new", "/new-arrivals", "تازه‌ها"),
    item("shop-sale", "/sale", "حراج فصل"),
    item("shop-collections", "/collections", "کالکشن‌ها"),
    item("shop-brands", "/brands", "برندها"),
  ]),
  item("lookbook", "/lookbook", "لوک‌بوک"),
  item("journal", "/blog", "ژورنال"),
  item("about", "/about", "دربارهٔ ما", [
    item("about-story", "/about", "داستان برند"),
    item("about-sustainability", "/sustainability", "پایداری"),
    item("about-stores", "/stores", "فروشگاه‌های حضوری"),
    item("about-faq", "/faq", "سؤالات متداول"),
  ]),
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ site, menu }: { site: SiteConfig; menu?: StoreMenuItem[] }) {
  const { cart } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const links = menu?.length ? menu : DEFAULT_LINKS;

  useEffect(() => {
    setOpen(false);
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((body) => setSignedIn(Boolean(body?.data?.user)))
      .catch(() => setSignedIn(false));
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) window.location.assign(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      <div className="bg-primary text-white">
        <div className="container-luxury flex min-h-9 items-center justify-between gap-4 text-[10px] sm:text-[11px]">
          <p className="line-clamp-1">ارسال رایگان سفارش‌های بالای <span dir="ltr">{formatToman(site.shipping.freeThreshold)}</span></p>
          <div className="hidden shrink-0 items-center gap-5 text-white/75 sm:flex">
            <Link href="/track" className="hover:text-white">پیگیری سفارش</Link>
            <span className="h-3 w-px bg-white/25" />
            <Link href="/sale" className="hover:text-white">حراج فصل</Link>
            <span className="h-3 w-px bg-white/25" />
            <Link href="/stores" className="hover:text-white">فروشگاه‌ها</Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="container-luxury flex min-h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="باز کردن منو"
              aria-expanded={open}
              aria-controls="store-mobile-menu"
              onClick={() => setOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-line/60 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link href="/" className="text-2xl font-display font-bold tracking-tight text-primary" aria-label={`${site.name} خانه`}>
              {site.name}
            </Link>
          </div>

          <nav aria-label="ناوبری اصلی" className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <div key={link.id} className="group relative">
                <Link
                  href={link.href}
                  target={link.target === "_blank" ? "_blank" : undefined}
                  rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink/75 transition-colors hover:text-primary aria-[current=page]:text-primary"
                >
                  {link.label}
                  {link.children.length ? <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" /> : null}
                </Link>
                {link.children.length ? (
                  <div className="invisible absolute right-0 top-full z-50 min-w-56 translate-y-1 rounded-2xl border border-line bg-surface p-2 opacity-0 shadow-soft transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    {link.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        target={child.target === "_blank" ? "_blank" : undefined}
                        rel={child.target === "_blank" ? "noopener noreferrer" : undefined}
                        className="flex min-h-10 items-center rounded-xl px-3 py-2 text-sm text-ink/75 transition-colors hover:bg-line/60 hover:text-primary"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-0.5">
            <form role="search" onSubmit={submitSearch} className="hidden lg:block">
              <label htmlFor="desktop-search" className="sr-only">جستجو</label>
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
                <input
                  id="desktop-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجوی محصول..."
                  className="h-11 w-48 rounded-xl border border-line bg-surface pr-9 pl-3 text-sm transition-colors focus:border-primary focus:outline-none xl:w-56"
                />
              </div>
            </form>
            <ThemeToggle />
            <Link href="/account/wishlist" aria-label="علاقه‌مندی‌ها" className="hidden h-11 w-11 items-center justify-center rounded-xl text-ink/75 hover:bg-line/60 sm:inline-flex">
              <Heart className="h-[18px] w-[18px]" />
            </Link>
            <Link href={signedIn ? "/account" : "/auth/login"} aria-label={signedIn ? "حساب من" : "ورود"} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink/75 hover:bg-line/60">
              <UserRound className="h-[18px] w-[18px]" />
            </Link>
            <Link href="/cart" aria-label={`سبد خرید، ${cart?.itemCount ?? 0} آیتم`} className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink/75 hover:bg-line/60">
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cart?.itemCount ? (
                <span className="absolute -left-0.5 -top-0.5 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] leading-5 text-white">
                  {cart.itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        <form role="search" onSubmit={submitSearch} className="container-luxury flex gap-2 pb-3 lg:hidden">
          <label htmlFor="mobile-search" className="sr-only">جستجو</label>
          <input id="mobile-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی محصول..." className="field min-h-11" />
          <button type="submit" aria-label="جستجو" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <Search className="h-5 w-5" />
          </button>
        </form>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="بستن منو" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside id="store-mobile-menu" role="dialog" aria-modal="true" aria-label="منو" className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col overflow-y-auto border-l border-line bg-canvas p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-2xl text-primary">{site.name}</span>
              <button onClick={() => setOpen(false)} aria-label="بستن" className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-line/60"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-1">
              {links.map((link) => (
                <div key={link.id} className="border-b border-line/70 pb-1">
                  <Link href={link.href} target={link.target === "_blank" ? "_blank" : undefined} onClick={() => setOpen(false)} className="block min-h-12 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-line/60">
                    {link.label}
                  </Link>
                  {link.children.length ? (
                    <div className="pb-1">
                      {link.children.map((child) => (
                        <Link key={child.id} href={child.href} target={child.target === "_blank" ? "_blank" : undefined} onClick={() => setOpen(false)} className="block min-h-10 rounded-xl px-6 py-2 text-sm text-ink/60 hover:bg-line/60">
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-1">
              <Link href={signedIn ? "/account" : "/auth/login"} onClick={() => setOpen(false)} className="block min-h-11 rounded-xl px-3 py-3 text-sm hover:bg-line/60">
                {signedIn ? "حساب من" : "ورود / ثبت‌نام"}
              </Link>
              <Link href="/account/wishlist" onClick={() => setOpen(false)} className="block min-h-11 rounded-xl px-3 py-3 text-sm hover:bg-line/60">علاقه‌مندی‌ها</Link>
              <Link href="/track" onClick={() => setOpen(false)} className="block min-h-11 rounded-xl px-3 py-3 text-sm hover:bg-line/60">پیگیری سفارش</Link>
            </div>

            <div className="mt-auto border-t border-line pt-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink/45">حالت نمایش</span>
                <ThemeToggle />
              </div>
              <p className="mt-4 text-[11px] leading-6 text-ink/40">{site.tagline}</p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
