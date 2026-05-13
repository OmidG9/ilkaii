"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import type { SampleProduct } from "@/lib/sampleProducts";

export default function ProductDetailClient({
  product,
}: {
  product: SampleProduct;
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "");
  const [activeImage, setActiveImage] = useState(product.heroImage);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}-${selectedSize}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size: selectedSize,
      price: product.salePrice ?? product.basePrice,
      heroImage: product.heroImage,
      quantity: 1,
    });
  };

  return (
    <div className="container mx-auto px-4 py-10 lg:py-14">
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="lg:w-6/12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="overflow-hidden rounded-[32px] border border-luxury-border bg-white shadow-sm"
          >
            <img
              src={activeImage}
              alt={product.name}
              className="aspect-[4/5] w-full object-cover"
            />
          </motion.div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[product.heroImage, ...product.gallery].map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(image)}
                className={`overflow-hidden rounded-3xl border transition ${
                  activeImage === image
                    ? "border-luxury-primary"
                    : "border-luxury-border"
                }`}
              >
                <img
                  src={image}
                  alt={product.name}
                  className="h-24 w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:w-6/12">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="space-y-6 rounded-[32px] border border-luxury-border bg-white p-8 shadow-sm"
          >
            <div className="space-y-3">
              <Link
                href="/shop"
                className="text-sm uppercase tracking-[0.3em] text-luxury-text/50"
              >
                بازگشت به فروشگاه
              </Link>
              <p className="text-xs uppercase tracking-[0.3em] text-luxury-text/50">
                {product.category}
              </p>
              <h1 className="text-4xl font-serif font-bold text-luxury-text">
                {product.name}
              </h1>
              <p className="max-w-xl text-sm leading-7 text-luxury-text/75">
                {product.description}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-3xl border border-luxury-border bg-luxury-background p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-luxury-text/50">
                  وضعیت
                </p>
                <p className="mt-3 text-lg font-semibold text-luxury-text">
                  {product.stockCondition}
                </p>
              </div>
              <div className="rounded-3xl border border-luxury-border bg-luxury-background p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-luxury-text/50">
                  جنس
                </p>
                <p className="mt-3 text-lg font-semibold text-luxury-text">
                  {product.material}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-luxury-text/50">
                  انتخاب سایز
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-3xl border px-4 py-3 text-sm transition ${
                        selectedSize === size
                          ? "bg-luxury-primary text-white"
                          : "border-luxury-border text-luxury-text"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-luxury-text/50">
                    Price
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-luxury-primary">
                    ﷼{product.salePrice ?? product.basePrice}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex items-center justify-center rounded-3xl bg-luxury-primary px-8 py-4 text-sm font-semibold text-white transition hover:bg-luxury-hover"
                >
                  افزودن به سبد خرید
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
