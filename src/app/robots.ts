import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/account/",
          "/auth/",
          "/cart",
          "/checkout",
          "/track",
          "/search",
        ],
      },
    ],
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
  };
}
