"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/display";
import { formatToman } from "@/lib/money";

interface WishlistItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  available: boolean;
}

export function WishlistView({ items }: { items: WishlistItem[] }) {
  const router = useRouter();
  if (!items.length) {
    return (
      <EmptyState
        title="علاقهمندیهای خالی است"
        description="محصولی را که دوست دارید ذخیره کنید تا بعداً راحتتر پیدا کنید."
        action={<ButtonLink href="/shop" className="mt-2">مشاهده محصولات</ButtonLink>}
      />
    );
  }

  const remove = async (productId: string) => {
    await fetch("/api/account/wishlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    router.refresh();
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} className="p-4">
          <Link href={`/product/${item.slug}`} className="relative block aspect-[3/4] overflow-hidden rounded-xl border border-line bg-line/20">
            {item.image ? <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" /> : null}
          </Link>
          <div className="mt-3 flex items-start justify-between gap-2">
            <div>
              <Link href={`/product/${item.slug}`} className="text-sm font-semibold hover:text-primary">{item.name}</Link>
              <p dir="ltr" className="mt-1 text-sm text-primary">{formatToman(item.price)}</p>
            </div>
            <button type="button" aria-label="حذف از علاقهمندیها" onClick={() => remove(item.productId)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-primary hover:border-primary"><Heart className="h-4 w-4 fill-current" /></button>
          </div>
          {!item.available ? <p className="mt-2 text-xs text-red-600">موجودی تمام شده</p> : null}
        </Card>
      ))}
    </div>
  );
}
