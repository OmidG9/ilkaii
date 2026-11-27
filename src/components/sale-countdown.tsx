"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/persian";

const now = new Date();
// The seasonal sale closes on 30 Azar (Dec 21) each year. Computing it here
// keeps the page honest after the previous campaign has ended.
const saleYear = now.getMonth() > 10 ? now.getFullYear() + 1 : now.getFullYear();
const SALE_END = new Date(`${saleYear}-12-21T23:59:59+03:30`).getTime();

function remaining() {
  const diff = Math.max(0, SALE_END - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    ended: diff === 0,
  };
}

export function SaleCountdown() {
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    const tick = () => setTime(remaining());
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const cells = useMemo(() => {
    if (!time || time.ended) return [];
    return [
      { value: time.days, label: "روز" },
      { value: time.hours, label: "ساعت" },
      { value: time.minutes, label: "دقیقه" },
      { value: time.seconds, label: "ثانیه" },
    ];
  }, [time]);

  if (!time) {
    return <div className="h-[74px] rounded-2xl border border-white/10 bg-white/5" aria-hidden />;
  }

  if (time.ended) {
    return <p className="text-sm text-white/60">زمان این دوره به پایان رسیده است؛ مجموعهٔ بعدی به‌زودی.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2" aria-label="زمان باقی‌مانده تا پایان حراج">
      {cells.map((cell) => (
        <div key={cell.label} className="min-w-[64px] rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center">
          <p dir="ltr" className="text-xl font-semibold tabular-nums text-white sm:text-2xl">{formatNumber(cell.value).padStart(2, "۰")}</p>
          <p className="mt-1 text-[10px] text-white/45">{cell.label}</p>
        </div>
      ))}
    </div>
  );
}
