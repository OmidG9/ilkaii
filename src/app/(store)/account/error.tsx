"use client";

import { useEffect } from "react";
import { RefreshCw, UserRound } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/display";

export default function AccountError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("account_error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <Card className="p-8 text-center sm:p-12">
      <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UserRound className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-xl font-semibold">اطلاعات حساب بارگذاری نشد</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink/55">
        ممکن است نشست شما منقضی شده باشد یا ارتباط با سرور موقتاً قطع شده باشد. دوباره تلاش کنید؛ در صورت نیاز مجدداً وارد شوید.
      </p>
      {error.digest ? <p dir="ltr" className="mt-3 text-[10px] text-ink/30">Ref: {error.digest}</p> : null}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}><RefreshCw className="h-4 w-4" /> تلاش دوباره</Button>
        <ButtonLink href="/auth/login" variant="outline">ورود مجدد</ButtonLink>
      </div>
    </Card>
  );
}
