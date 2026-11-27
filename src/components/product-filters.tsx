"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { normalizeDigits } from "@/lib/persian";

interface Props {
  categories: { slug: string; name: string }[];
  initial: {
    q?: string; category?: string; size?: string; color?: string;
    minPrice?: string; maxPrice?: string; sort?: string; available?: string;
  };
  /** Category pages already constrain the query; hide the category selector. */
  lockedCategory?: string;
  sizes?: string[];
  colors?: string[];
}

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "36", "38", "40"];
const DEFAULT_COLORS = ["مشکی", "کرم", "خاکستری", "سرمه‌ای", "سبز", "بژ", "آبی", "صورتی"];

const onlyDigits = (value: string) => normalizeDigits(value).replace(/[^\d]/g, "");

export function ProductFilters({ categories, initial, lockedCategory, sizes = DEFAULT_SIZES, colors = DEFAULT_COLORS }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState({ ...initial });

  const apply = () => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(form)) {
      if (value) params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <aside aria-label="فیلترهای محصول" className="surface-card space-y-4 p-5">
      <h2 className="text-base font-semibold">فیلترها</h2>
      <div>
        <label htmlFor="filter-search" className="mb-2 block text-xs text-ink/60">جستجو</label>
        <Input id="filter-search" value={form.q ?? ""} onChange={(e) => set("q", e.target.value)} placeholder="نام محصول" />
      </div>
      {lockedCategory ? null : (
      <div>
        <label htmlFor="filter-category" className="mb-2 block text-xs text-ink/60">دستهبندی</label>
        <Select id="filter-category" value={form.category ?? ""} onChange={(e) => set("category", e.target.value)}>
          <option value="">همه دستهها</option>
          {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
        </Select>
      </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="filter-min" className="mb-2 block text-xs text-ink/60">از (تومان)</label>
          <Input id="filter-min" inputMode="numeric" value={form.minPrice ?? ""} onChange={(e) => set("minPrice", onlyDigits(e.target.value))} placeholder="۰" />
        </div>
        <div>
          <label htmlFor="filter-max" className="mb-2 block text-xs text-ink/60">تا (تومان)</label>
          <Input id="filter-max" inputMode="numeric" value={form.maxPrice ?? ""} onChange={(e) => set("maxPrice", onlyDigits(e.target.value))} placeholder="۱۰۰۰۰۰۰" />
        </div>
      </div>
      <div>
        <label htmlFor="filter-size" className="mb-2 block text-xs text-ink/60">سایز</label>
        <Select id="filter-size" value={form.size ?? ""} onChange={(e) => set("size", e.target.value)}>
          <option value="">همه سایزها</option>
          {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
        </Select>
      </div>
      <div>
        <label htmlFor="filter-color" className="mb-2 block text-xs text-ink/60">رنگ</label>
        <Select id="filter-color" value={form.color ?? ""} onChange={(e) => set("color", e.target.value)}>
          <option value="">همه رنگها</option>
          {colors.map((color) => <option key={color} value={color}>{color}</option>)}
        </Select>
      </div>
      <div>
        <label htmlFor="filter-sort" className="mb-2 block text-xs text-ink/60">مرتبسازی</label>
        <Select id="filter-sort" value={form.sort ?? "newest"} onChange={(e) => set("sort", e.target.value)}>
          <option value="newest">جدیدترین</option>
          <option value="price-asc">قیمت: کم به زیاد</option>
          <option value="price-desc">قیمت: زیاد به کم</option>
          <option value="popular">پرفروشترین</option>
        </Select>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" className="h-5 w-5 accent-[var(--color-primary)]" checked={form.available === "true"} onChange={(e) => set("available", e.target.checked ? "true" : "")} />
        فقط موجودیها
      </label>
      <div className="flex gap-2 pt-2">
        <Button onClick={apply} className="flex-1">اعمال فیلتر</Button>
        <Button variant="outline" onClick={() => { setForm({}); router.push(pathname); }}>پاک کردن</Button>
      </div>
    </aside>
  );
}
