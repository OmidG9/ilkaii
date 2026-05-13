import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/Navbar";
import { MobileDrawer } from "@/components/MobileDrawer";

export const metadata: Metadata = {
  title: "ilkaii | Luxury Stock Clothing",
  description:
    "Premium luxury women's clothing collection. Exclusive designs, superior quality.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#6B5E57",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="bg-luxury-background text-luxury-text antialiased">
        <Navbar />
        <MobileDrawer />
        <main>{children}</main>
      </body>
    </html>
  );
}
