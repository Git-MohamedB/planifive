import type { NextConfig } from "next";

// Force rebuild timestamp: 999999

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
