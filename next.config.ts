import type { NextConfig } from "next";

const imageHosts = new Set<string>(["res.cloudinary.com"]);
for (const host of (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "").split(",")) {
  const clean = host.trim();
  if (clean) imageHosts.add(clean);
}

const nextConfig: NextConfig = {
  // Allows an isolated dev/build directory (NEXT_DIST_DIR=.next-audit) when
  // another process already owns .next; production keeps the default.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [340, 540, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [...imageHosts].map((hostname) => ({
      protocol: "https" as const,
      hostname,
      port: "",
      pathname: "/**",
    })),
  },
  experimental: { optimizePackageImports: ["lucide-react"] },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
