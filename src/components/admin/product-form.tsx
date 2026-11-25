"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";

interface Option { id: string; name: string }

export interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  brandId?: string | null;
  basePrice: number;
  salePrice?: number | null;
  status: string;
  gender?: string | null;
  season?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  reorderLevel: number;
}

interface Props {
  categories: Option[];
  brands: Option[];
  product?: ProductFormData;
}

const initial = (categories: Option[]): ProductFormData => ({
  name: "", slug: "", sku: "", categoryId: categories[0]?.id ?? "", basePrice: 0,
  salePrice: null, status: "DRAFT", gender: "", season: "", shortDescription: "",
  description: "", isFeatured: false, isNewArrival: false, reorderLevel: 5,
});

export function ProductForm({ categories, brands, product }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(product ?? initial(categories));
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        slug: form.slug,
        sku: form.sku,
        categoryId: form.categoryId,
        basePrice: Number(form.basePrice),
        status: form.status,
        isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival,
        reorderLevel: Number(form.reorderLevel),
      };
      if (form.brandId) payload.brandId = form.brandId;
      if (form.salePrice !== null && form.salePrice !== undefined && form.salePrice !== 0) payload.salePrice = Number(form.salePrice);
      if (form.gender) payload.gender = form.gender;
      if (form.season) payload.season = form.season;
      if (form.shortDescription) payload.shortDescription = form.shortDescription;
      if (form.description) payload.description = form.description;

      const response = await fetch(product?.id ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product?.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره محصول ناموفق بود");
      if (!product?.id && body?.data?.id) {
        router.push(`/admin/products/${body.data.id}`);
        return;
      }
      setMessage({ text: "محصول ذخیره شد.", tone: "success" });
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-5 text-lg font-semibold">{product?.id ? "ویرایش محصول" : "محصول جدید"}</h2>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="نام محصول" htmlFor="p-name"><Input id="p-name" required minLength={2} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="اسلاگ" htmlFor="p-slug"><Input id="p-slug" dir="ltr" required value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="linen-dress" /></Field>
        <Field label="کد محصول (SKU)" htmlFor="p-sku"><Input id="p-sku" dir="ltr" required value={form.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
        <Field label="دستهبندی" htmlFor="p-cat">
          <Select id="p-cat" required value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
        </Field>
        <Field label="برند" htmlFor="p-brand">
          <Select id="p-brand" value={form.brandId ?? ""} onChange={(e) => set("brandId", e.target.value)}>
            <option value="">بدون برند</option>
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </Select>
        </Field>
        <Field label="وضعیت" htmlFor="p-status">
          <Select id="p-status" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="DRAFT">پیشنویس</option>
            <option value="ACTIVE">فعال</option>
            <option value="INACTIVE">غیرفعال</option>
            <option value="DISCONTINUED">متوقف شده</option>
          </Select>
        </Field>
        <Field label="قیمت (تومان)" htmlFor="p-price"><Input id="p-price" type="number" dir="ltr" min={0} required value={form.basePrice} onChange={(e) => set("basePrice", Number(e.target.value))} /></Field>
        <Field label="قیمت تخفیف (تومان)" htmlFor="p-sale" hint="اختیاری؛ خالی بگذارید اگر تخفیف ندارد">
          <Input id="p-sale" type="number" dir="ltr" min={0} value={form.salePrice ?? ""} onChange={(e) => set("salePrice", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="آستانه هشدار موجودی" htmlFor="p-reorder"><Input id="p-reorder" type="number" dir="ltr" min={0} value={form.reorderLevel} onChange={(e) => set("reorderLevel", Number(e.target.value))} /></Field>
        <Field label="جنسیت" htmlFor="p-gender">
          <Select id="p-gender" value={form.gender ?? ""} onChange={(e) => set("gender", e.target.value)}>
            <option value="">نامشخص</option>
            <option value="WOMEN">زنانه</option>
            <option value="MEN">مردانه</option>
            <option value="UNISEX">یونیسکس</option>
            <option value="KIDS">کودک</option>
          </Select>
        </Field>
        <Field label="فصل" htmlFor="p-season">
          <Select id="p-season" value={form.season ?? ""} onChange={(e) => set("season", e.target.value)}>
            <option value="">نامشخص</option>
            <option value="SPRING">بهار</option>
            <option value="SUMMER">تابستان</option>
            <option value="AUTUMN">پاییز</option>
            <option value="WINTER">زمستان</option>
            <option value="ALL_SEASON">چهار فصل</option>
          </Select>
        </Field>
        <div className="flex items-end gap-6 pb-3">
          <label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />ویژه</label>
          <label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={form.isNewArrival} onChange={(e) => set("isNewArrival", e.target.checked)} />جدید</label>
        </div>
        <div className="sm:col-span-2">
          <Field label="توضیح کوتاه" htmlFor="p-short"><Input id="p-short" maxLength={500} value={form.shortDescription ?? ""} onChange={(e) => set("shortDescription", e.target.value)} /></Field>
        </div>
        <div className="lg:col-span-3">
          <Field label="توضیحات کامل" htmlFor="p-desc"><Textarea id="p-desc" rows={6} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Button type="submit" size="lg" disabled={busy}>{busy ? "در حال ذخیره..." : product?.id ? "ذخیره تغییرات" : "ایجاد محصول"}</Button>
          {message ? <div className="mt-4"><Alert tone={message.tone}>{message.text}</Alert></div> : null}
        </div>
      </form>
    </Card>
  );
}
