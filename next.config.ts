import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enables forbidden() and unauthorized() APIs for role-based interrupts
    authInterrupts: true,
  },
};

export default nextConfig;
