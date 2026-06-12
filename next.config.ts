import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer', 'satori', 'sharp'],
};

export default nextConfig;
