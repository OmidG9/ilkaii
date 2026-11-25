"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Alert, Price } from "@/components/ui/display";
import { formatNumber } from "@/lib/persian";

interface Variant {
  id: string; size: string; color: string | null; stock: number; isAvailable: boolean; price: number | null;
}

interface Props {
  productId: string;
  slug: string;
  price: number;
  variants: Variant[];
}

export function VariantPicker({ productId, price, variants }: Props) {
  const router = useRouter();
  const { add, cart } = useCart();
  const colors = useMemo(() => [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[], [variants]);
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))], [variants]);
  const [color, setColor] = useState<string>(colors[0] ?? "");
  const [size, setSize] = useState<string>(sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<{ text: string; tone: "info" | "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = variants.find((v) => v.size === size && (v.color ?? "") === color) ?? null;
  const available = selected ? selected.isAvailable && selected.stock > 0 : variants.length > 0;
  const unitPrice = selected?.price && selected.price > 0 ? selected.price : price;

  const submit = async () => {
    setBusy(true);
    try {
      await add(productId, selected?.id, quantity);
      setMessage({ text: "محصول به سبد خرید اضافه شد", tone: "success" });
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const wishlist = async () => {
    const response = await fetch("/api/account/wishlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage({ text: "برای ذخیره علاقهمندیها لطفاً وارد شوید", tone: "error" });
      return;
    }
    setMessage({ text: body.data.added ? "به علاقهمندیها اضافه شد" : "از علاقهمندیها حذف شد", tone: "success" });
  };

  return (
    <div className="space-y-6">
      <Price value={unitPrice} className="text-3xl text-primary" />

      {colors.length ? (
        <div>
          <p className="mb-3 text-sm font-medium">رنگ: <span className="text-ink/60">{color}</span></p>
          <div className="flex flex-wrap gap-2">
            {colors.map((value) => (
              <button key={value} type="button" onClick={() => setColor(value)} aria-pressed={color === value}
                className={`min-h-11 rounded-xl border px-4 text-sm ${color === value ? "border-primary bg-primary text-white" : "border-line hover:border-primary"}`}>
                {value}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {sizes.length ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">سایز</p>
            <a href="/size-guide" className="text-xs text-primary underline">راهنمای سایز</a>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((value) => {
              const variant = variants.find((v) => v.size === value && (v.color ?? "") === color);
              const disabled = Boolean(variant && (!variant.isAvailable || variant.stock === 0));
              return (
                <button key={value} type="button" onClick={() => setSize(value)} disabled={disabled} aria-pressed={size === value}
                  className={`min-h-11 min-w-11 rounded-xl border px-4 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${size === value ? "border-primary bg-primary text-white" : "border-line hover:border-primary"}`}>
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="text-sm">
        {variants.length === 0 ? "این محصول بدون تنوع است" : available ? `موجودی: ${formatNumber(selected?.stock ?? 0)} عدد` : "موجودی این ترکیب تمام شده است"}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex h-12 items-center rounded-2xl border border-line">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="کاهش تعداد" className="h-12 w-12 text-lg">−</button>
          <span className="w-10 text-center text-sm">{formatNumber(quantity)}</span>
          <button type="button" onClick={() => setQuantity((q) => Math.min(20, q + 1))} aria-label="افزایش تعداد" className="h-12 w-12 text-lg">+</button>
        </div>
        <Button size="lg" onClick={submit} disabled={!available || busy} className="flex-1">
          <ShoppingBag className="h-5 w-5" />افزودن به سبد خرید
        </Button>
        <button type="button" onClick={wishlist} aria-label="افزودن به علاقهمندیها" className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-line hover:border-primary">
          <Heart className="h-5 w-5" />
        </button>
      </div>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      {cart?.itemCount ? <p className="text-xs text-ink/50">{formatNumber(cart.itemCount)} آیتم در سبد خرید</p> : null}
    </div>
  );
}
