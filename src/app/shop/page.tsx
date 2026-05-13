"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { sampleProducts, sampleCategories } from "@/lib/sampleProducts";
import { useMemo, useState } from "react";

function ShopBrowser() {
  const [category, setCategory] = useState<string>("All");
  const [size, setSize] = useState<string>("All");
  const [priceRange, setPriceRange] = useState<string>("All");

  const availableSizes = useMemo(
    () =>
      Array.from(new Set(sampleProducts.flatMap((item) => item.sizes))).sort(),
    [],
  );

  const filteredProducts = useMemo(() => {
    return sampleProducts.filter((product) => {
      if (category !== "All" && product.category !== category) return false;
      if (size !== "All" && !product.sizes.includes(size)) return false;
      if (priceRange !== "All") {
        const price = product.salePrice ?? product.basePrice;
        if (priceRange === "under-400" && price >= 400) return false;
        if (priceRange === "400-600" && (price < 400 || price > 600))
          return false;
        if (priceRange === "above-600" && price <= 600) return false;
      }
      return true;
    });
  }, [category, size, priceRange]);

  return (
    <div className="container mx-auto px-4 py-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-luxury-border bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-luxury-text/50">
                فیلتر
              </p>
              <h1 className="mt-3 text-3xl font-serif font-semibold text-luxury-text">
                فروشگاه
              </h1>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-luxury-text/80">
                  دسته‌بندی
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategory("All")}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      category === "All"
                        ? "bg-luxury-primary text-white"
                        : "border-luxury-border text-luxury-text"
                    }`}
                  >
                    همه
                  </button>
                  {sampleCategories.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setCategory(group.name)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        category === group.name
                          ? "bg-luxury-primary text-white"
                          : "border-luxury-border text-luxury-text"
                      }`}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-luxury-text/80">
                  سایز
                </h2>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSize("All")}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      size === "All"
                        ? "bg-luxury-primary text-white"
                        : "border-luxury-border text-luxury-text"
                    }`}
                  >
                    همه
                  </button>
                  {availableSizes.map((option) => (
                    <button
                      key={option}
                      onClick={() => setSize(option)}
                      className={`rounded-xl border px-3 py-2 text-sm transition ${
                        size === option
                          ? "bg-luxury-primary text-white"
                          : "border-luxury-border text-luxury-text"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-luxury-text/80">
                  قیمت
                </h2>
                <div className="mt-3 space-y-3">
                  <button
                    onClick={() => setPriceRange("All")}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      priceRange === "All"
                        ? "bg-luxury-primary text-white"
                        : "border-luxury-border text-luxury-text"
                    }`}
                  >
                    همه قیمت‌ها
                  </button>
                  <button
                    onClick={() => setPriceRange("under-400")}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      priceRange === "under-400"
                        ? "bg-luxury-primary text-white"
                        : "border-luxury-border text-luxury-text"
                    }`}
                  >
                    زیر ۴۰۰ دلار
                  </button>
                  <button
                    onClick={() => setPriceRange("400-600")}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      priceRange === "400-600"
                        ? "bg-luxury-primary text-white"
                        : "border-luxury-border text-luxury-text"
                    }`}
                  >
                    ۴۰۰ تا ۶۰۰ دلار
                  </button>
                  <button
                    onClick={() => setPriceRange("above-600")}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      priceRange === "above-600"
                        ? "bg-luxury-primary text-white"
                        : "border-luxury-border text-luxury-text"
                    }`}
                  >
                    بالای ۶۰۰ دلار
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-luxury-text/50">
                انتخاب لوکس
              </p>
              <h2 className="mt-2 text-3xl font-serif font-semibold text-luxury-text">
                محصولات منتخب
              </h2>
            </div>
            <p className="text-sm text-luxury-text/70">
              {filteredProducts.length} محصول منتخب برای سبک شما.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <motion.article
                key={product.id}
                layout
                whileHover={{ y: -4 }}
                className="group overflow-hidden rounded-[28px] border border-luxury-border bg-white shadow-sm"
              >
                <Link href={`/product/${product.slug}`} className="block">
                  <div className="relative overflow-hidden bg-luxury-background">
                    <img
                      src={product.heroImage}
                      alt={product.name}
                      className="h-72 w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="mb-3 text-xs uppercase tracking-[0.3em] text-luxury-text/50">
                      {product.category}
                    </div>
                    <h3 className="text-xl font-semibold text-luxury-text">
                      {product.name}
                    </h3>
                    <p className="mt-3 text-sm text-luxury-text/70">
                      {product.shortDescription}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <span className="text-lg font-semibold text-luxury-primary">
                        ﷼{product.salePrice ?? product.basePrice}
                      </span>
                      <span className="rounded-full border border-luxury-border px-3 py-1 text-xs uppercase tracking-[0.3em] text-luxury-text/60">
                        {product.stockCondition}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return <ShopBrowser />;
}
