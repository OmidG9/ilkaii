"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { SiteConfig } from "@/config/site";

export function Navbar({ site }: { site: SiteConfig }) {
  const { cart } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setOpen(false);
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((body) => setSignedIn(Boolean(body?.data?.user)))
      .catch(() => setSignedIn(false));
  }, [pathname]);

  const links = [
    { href: "/shop", label: "فروشگاه" },
    { href: "/shop?newArrival=true", label: "جدیدها" },
    { href: "/size-guide", label: "راهنمای سایز" },
    { href: "/about", label: "درباره ما" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="container-luxury flex min-h-20 items-center justify-between gap-4">
          <button
            type="button"
            aria-label="باز کردن منو"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-line/60 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/" className="text-2xl font-display font-bold tracking-tight text-primary" aria-label={`${site.name} خانه`}>
            {site.name}
          </Link>

          <nav aria-label="ناوبری اصلی" className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className="min-h-11 inline-flex items-center text-sm font-medium text-ink/80 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <form
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                if (query.trim()) window.location.assign(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="hidden lg:block"
            >
              <label htmlFor="desktop-search" className="sr-only">جستجو</label>
              <input
                id="desktop-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی محصول..."
                className="h-11 w-48 rounded-xl border border-line bg-surface px-4 text-sm"
              />
            </form>
            <Link href="/account" aria-label="حساب من" className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-line/60">
              <UserRound className="h-5 w-5" />
            </Link>
            <Link href="/cart" aria-label={`سبد خرید، ${cart?.itemCount ?? 0} آیتم`} className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-line/60">
              <ShoppingBag className="h-5 w-5" />
              {cart?.itemCount ? (
                <span className="absolute -left-0.5 -top-0.5 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] leading-5 text-white">
                  {cart.itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) window.location.assign(`/search?q=${encodeURIComponent(query.trim())}`);
          }}
          className="container-luxury flex gap-2 pb-3 lg:hidden"
        >
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
          <aside role="dialog" aria-modal="true" aria-label="منو" className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col gap-2 border-l border-line bg-canvas p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-2xl text-primary">{site.name}</span>
              <button onClick={() => setOpen(false)} aria-label="بستن" className="inline-flex h-11 w-11 items-center justify-center"><X className="h-5 w-5" /></button>
            </div>
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="min-h-12 rounded-xl px-3 py-3 text-sm hover:bg-line/60">{link.label}</Link>
            ))}
            <Link href={signedIn ? "/account" : "/auth/login"} onClick={() => setOpen(false)} className="min-h-12 rounded-xl px-3 py-3 text-sm hover:bg-line/60">
              {signedIn ? "حساب من" : "ورود"}
            </Link>
            <Link href="/account/wishlist" onClick={() => setOpen(false)} className="min-h-12 rounded-xl px-3 py-3 text-sm hover:bg-line/60">علاقهمندیها</Link>
          </aside>
        </div>
      ) : null}
    </>
  );
}
