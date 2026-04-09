import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@socios/auth",
    "@socios/database",
    "@socios/utils",
  ],
};

export default nextConfig;
