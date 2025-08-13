import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Ensure server bundles never try to include konva's node build
    config.externals = config.externals || [];
    // No server-side usage, but guard just in case
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "konva/lib/index-node": false,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
