import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/unsubscribe-form";

export const metadata: Metadata = { title: "لغو عضویت خبرنامه", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <div className="container-luxury max-w-xl py-16">
      <h1 className="text-2xl font-semibold">لغو عضویت خبرنامه</h1>
      {token ? <div className="mt-4"><UnsubscribeForm token={token} /></div> : <p className="mt-3 text-sm text-ink/55">لینک لغو عضویت معتبر نیست.</p>}
    </div>
  );
}
