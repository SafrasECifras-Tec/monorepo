import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // In pnpm monorepos, webpack follows symlinks into the .pnpm store and
  // generates module IDs with the real (symlink-resolved) path. The server
  // and client compilers produce different IDs for the same file, breaking
  // the React Server Consumer Manifest (RSC manifest mismatch).
  // Setting symlinks: false forces webpack to use the symlink path consistently.
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },

  // Tell Next.js the monorepo root so file-tracing covers shared packages.
  outputFileTracingRoot: path.join(__dirname, "../../"),

  transpilePackages: [
    "@socios/auth",
    "@socios/database",
    "@socios/utils",
  ],
};

export default nextConfig;
