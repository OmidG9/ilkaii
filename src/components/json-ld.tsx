import { headers } from "next/headers";

/**
 * Safe JSON-LD emitter: escapes `<` to prevent breaking out of the script tag.
 * The nonce is required by the production CSP; it is read from the request
 * header set by middleware so every caller does not have to pass it.
 */
export async function JsonLd({ data, nonce }: {
  data: Record<string, unknown> | Record<string, unknown>[];
  nonce?: string;
}) {
  const requestNonce = process.env.NODE_ENV === "production"
    ? nonce ?? (await headers()).get("x-nonce") ?? undefined
    : undefined;
  return (
    <script
      type="application/ld+json"
      nonce={requestNonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
