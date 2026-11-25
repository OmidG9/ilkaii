import type { ReactNode } from "react";
import { getSiteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const site = await getSiteConfig();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar site={site} />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer site={site} />
    </div>
  );
}
