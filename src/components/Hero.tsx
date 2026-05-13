"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-luxury-background via-luxury-background to-luxury-secondary/10">
      <div className="container mx-auto px-4 sm:px-6 py-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center min-h-screen md:min-h-[600px]">
          {/* Text Content */}
          <div className="flex flex-col justify-center py-12 md:py-20 space-y-6 md:space-y-8">
            <div className="space-y-4">
              <p className="text-luxury-secondary text-sm md:text-base font-semibold uppercase tracking-widest">
                لوکس با نگاهی نو
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-luxury-primary leading-tight">
                زیبایی در هر تار
              </h1>
              <p className="text-luxury-text/80 text-base sm:text-lg md:text-xl leading-relaxed max-w-lg">
                مجموعه‌ای منتخب از پوشاک زنانه لوکس. تجربه‌ای از ظرافت، کیفیت و
                سبک ماندگار.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/shop"
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "px-8 py-3.5 rounded-lg",
                  "bg-luxury-primary text-white font-semibold",
                  "hover:bg-luxury-hover active:scale-95",
                  "transition-all duration-200",
                  "touch-target min-w-[120px]",
                )}
              >
                خرید کن
                <ChevronRight size={18} />
              </Link>
              <Link
                href="/collections"
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "px-8 py-3.5 rounded-lg",
                  "bg-white border-2 border-luxury-primary",
                  "text-luxury-primary font-semibold",
                  "hover:bg-luxury-primary/5 active:scale-95",
                  "transition-all duration-200",
                  "touch-target min-w-[120px]",
                )}
              >
                مشاهده مجموعه‌ها
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-luxury-border/30">
              <div>
                <p className="text-2xl font-bold text-luxury-primary">۵۰۰+</p>
                <p className="text-sm text-luxury-text/60">محصولات ممتاز</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-luxury-primary">۱۰K+</p>
                <p className="text-sm text-luxury-text/60">مشتریان خوشحال</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-luxury-primary">۱۰۰٪</p>
                <p className="text-sm text-luxury-text/60">اصلی</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative h-96 md:h-full min-h-[400px] md:min-h-[600px] overflow-hidden rounded-lg md:rounded-none">
            <Image
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=900&fit=crop"
              alt="مجموعه پوشاک زنانه لوکس"
              fill
              priority
              quality={85}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center w-full h-full hover:scale-105 transition-transform duration-500"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-luxury-background/40" />
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-luxury-secondary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-luxury-secondary/5 rounded-full blur-3xl" />
    </section>
  );
}
