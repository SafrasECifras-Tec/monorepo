import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In pnpm monorepos, webpack follows symlinks into the .pnpm store and
  // generates module IDs with the real (symlink-resolved) path. The server
  // and client compilers then produce different IDs for the same file, which
  // breaks the React Server Consumer Manifest lookup (RSC manifest mismatch).
  // Setting symlinks: false forces webpack to use the symlink path consistently.
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },

  transpilePackages: [
    "@socios/auth",
    "@socios/database",
    "@socios/ui",
    "@socios/utils",
  ],
};

export default nextConfig;
