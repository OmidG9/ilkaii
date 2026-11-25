import type { SiteConfig } from "@/config/site";

const HEX = /^#[0-9a-f]{6}$/i;

function safeColor(value: string | undefined, fallback: string) {
  return value && HEX.test(value) ? value : fallback;
}

/** "107 94 87" channels let Tailwind apply `/opacity` modifiers at runtime. */
function channels(hex: string): string {
  const value = hex.replace("#", "");
  return [0, 2, 4]
    .map((offset) => parseInt(value.slice(offset, offset + 2), 16))
    .join(" ");
}

/** Inline theme tokens let a deployment rebrand without rebuilding Tailwind. */
export function themeVariables(config: SiteConfig): string {
  const t = config.theme;
  const tokens: Array<[string, string]> = [
    ["primary", safeColor(t.primary, "#6B5E57")],
    ["hover", safeColor(t.hover, "#5A4D46")],
    ["secondary", safeColor(t.secondary, "#A89C94")],
    ["background", safeColor(t.background, "#F5F1ED")],
    ["text", safeColor(t.text, "#2B2B2B")],
    ["border", safeColor(t.border, "#E8E3DE")],
  ];
  const rules = tokens
    .map(([name, hex]) => `--color-${name}:${hex};--color-${name}-rgb:${channels(hex)};`)
    .join("");
  // `html:root` outranks the stylesheet's `:root` defaults regardless of order.
  return `html:root{${rules}}`;
}
