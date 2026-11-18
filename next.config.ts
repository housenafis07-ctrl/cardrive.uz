import type { NextConfig } from "next";
const nextConfig: NextConfig = {\n  reactStrictMode: true,\n  experimental: {\n    serverActions: { bodySizeLimit: "3mb" },\n  },\n};
export default nextConfig;
