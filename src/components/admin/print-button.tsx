"use client";

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm hover:border-primary">چاپ گزارش</button>;
}
