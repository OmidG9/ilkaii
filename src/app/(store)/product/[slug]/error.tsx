"use client";

import { useEffect } from "react";
import { RefreshCw, ShoppingBag } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/display";

export default function ProductError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("product_error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="container-luxury py-16">
      <Card className="mx-auto max-w-2xl p-8 text-center sm:p-12">
        <p className="eyebrow">PRODUCT UNAVAILABLE</p>
        <h1 className="mt-4 text-2xl font-semibold">جزئیات این قطعه بارگذاری نشد</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink/55">
          مشکلی موقت در دریافت اطلاعات محصول پیش آمده است. می‌توانید دوباره تلاش کنید یا از فروشگاه ادامه دهید.
        </p>
        {error.digest ? <p dir="ltr" className="mt-3 text-[10px] text-ink/30">Ref: {error.digest}</p> : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={reset}><RefreshCw className="h-4 w-4" /> تلاش دوباره</Button>
          <ButtonLink href="/shop" variant="outline"><ShoppingBag className="h-4 w-4" /> فروشگاه</ButtonLink>
        </div>
      </Card>
    </div>
  );
}
