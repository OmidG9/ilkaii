"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="بازگشت به بالای صفحه"
      className="fixed bottom-5 left-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface/95 text-primary shadow-soft backdrop-blur transition-colors hover:bg-primary hover:text-white"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
