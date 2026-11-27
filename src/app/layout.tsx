import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@/styles/globals.css";
import { getSiteConfig } from "@/config/site";
import { themeVariables } from "@/config/theme";
import { CartProvider } from "@/components/cart-provider";
import { JsonLd } from "@/components/json-ld";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6B5E57",
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const title = site.seo.defaultTitle || `${site.name} | ${site.tagline}`;
  const description = site.seo.defaultDescription || site.description;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
    title: { default: title, template: `%s | ${site.name}` },
    description,
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: site.name,
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteConfig();
  // The nonce is only part of the production CSP. Applying it during dev causes
  // React hydration noise because dev CSP already allows inline scripts.
  const nonce = process.env.NODE_ENV === "production"
    ? (await headers()).get("x-nonce") ?? undefined
    : undefined;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: site.name,
        description: site.description,
        inLanguage: "fa-IR",
      },
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: site.name,
        url: base,
        email: site.contact.email,
        telephone: site.contact.phone,
        address: { "@type": "PostalAddress", addressLocality: site.contact.address, addressCountry: "IR" },
      },
    ],
  };
  return (
    <html lang="fa" dir="rtl">
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("ilkaii_theme");if(t==="dark"){document.documentElement.dataset.theme="dark"}}catch(e){}`,
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: themeVariables(site) }} />
        <JsonLd data={structuredData} />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
