import type { NextConfig } from "next";

const basePath = (() => {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
