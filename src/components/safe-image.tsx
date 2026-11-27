"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * next/image with a graceful, branded fallback.
 *
 * Seed/demo databases can reference images that are not present in `public/`.
 * Instead of showing a broken-image icon, we render a deterministic gradient
 * plate with the product name. It keeps the editorial layout intact.
 */
export function SafeImage({ fallbackLabel, className = "", alt, style, ...props }: ImageProps & { fallbackLabel?: string }) {
  const [failed, setFailed] = useState(false);
  const label = fallbackLabel || (typeof alt === "string" ? alt : "");

  if (failed) {
    const hue = [...label].reduce((value, character) => (value * 31 + character.charCodeAt(0)) % 360, 17);
    return (
      <div
        role="img"
        aria-label={label || "بدون تصویر"}
        className={`${props.fill ? "absolute inset-0" : ""} flex h-full w-full items-center justify-center overflow-hidden ${className}`}
        style={{
          ...style,
          background: `linear-gradient(140deg, hsl(${hue} 18% 46%), hsl(${(hue + 28) % 360} 20% 26%))`,
        }}
      >
        <span className="max-w-[80%] text-center font-display text-lg leading-7 text-white/75">{label}</span>
      </div>
    );
  }

  return <Image {...props} alt={alt} className={className} style={style} onError={() => setFailed(true)} />;
}
