"use client";

import { useState } from "react";
import { SafeImage } from "@/components/safe-image";

export interface GalleryImage {
  id: string;
  url: string;
  altText: string | null;
  color: string | null;
}

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] overflow-hidden rounded-luxury border border-line bg-line/30">
        {current ? (
          <SafeImage src={current.url} alt={current.altText ?? name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" fallbackLabel={name} />
        ) : (
          <div className="flex h-full items-center justify-center text-ink/40">تصویر موجود نیست</div>
        )}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`نمایش تصویر ${index + 1}`}
              aria-pressed={index === active}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${index === active ? "border-primary" : "border-line"}`}
            >
              <SafeImage src={image.url} alt={image.altText ?? `${name} ${index + 1}`} fill sizes="64px" className="object-cover" fallbackLabel={image.altText ?? name} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
