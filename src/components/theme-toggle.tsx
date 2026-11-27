"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.theme = "dark";
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("ilkaii_theme", next ? "dark" : "light");
    } catch {
      // Storage can be unavailable in private mode; the visual toggle still works.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
      aria-pressed={dark}
      title={dark ? "حالت روشن" : "حالت تاریک"}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink/75 transition-colors hover:bg-line/60 ${className}`}
    >
      {mounted && dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
