import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained Node.js server for Docker and other self-hosted
  // environments while keeping the normal Vinext build output available.
  output: "standalone",
};

export default nextConfig;
