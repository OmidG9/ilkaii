import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import type { ProductCard as ProductCardType } from "@/services/catalog";
import { Badge, Price } from "@/components/ui/display";

export function ProductCard({ product, priority = false }: { product: ProductCardType; priority?: boolean }) {
  return (
    <article className="group animate-fade-in">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-luxury border border-line bg-line/30">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink/40">تصویر موجود نیست</div>
          )}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            {product.discount > 0 ? <Badge tone="danger">{product.discount}٪ تخفیف</Badge> : null}
            {product.isNewArrival ? <Badge tone="success">جدید</Badge> : null}
          </div>
          {!product.available ? (
            <div className="absolute inset-x-0 bottom-0 bg-ink/70 py-2 text-center text-xs text-white">موجودی تمام شده</div>
          ) : null}
        </div>
        <div className="mt-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
            <p className="mt-1 text-xs text-ink/50">{product.category}</p>
          </div>
          <ArrowUpLeft className="mt-1 h-4 w-4 shrink-0 text-ink/30 transition-transform group-hover:-translate-x-1 group-hover:translate-y-1 group-hover:text-primary" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Price value={product.price} className="text-sm text-primary" />
          {product.discount > 0 ? <span dir="ltr" className="text-xs text-ink/40 line-through">{product.basePrice.toLocaleString("en-US")}</span> : null}
        </div>
      </Link>
    </article>
  );
}
