import type { Metadata, Viewport } from "next";
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
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
    title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
    description: site.description,
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: site.name,
      title: `${site.name} | ${site.tagline}`,
      description: site.description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteConfig();
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
        <style dangerouslySetInnerHTML={{ __html: themeVariables(site) }} />
        <JsonLd data={structuredData} />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
