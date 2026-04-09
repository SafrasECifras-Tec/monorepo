import type { NextConfig } from "next";

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

  // NOTE: outputFileTracingRoot is intentionally omitted.
  // Setting it to the monorepo root causes Vercel CLI v50+ to compute distDir
  // as "apps/portal-shell/.next" (relative to monorepo root), which then gets
  // resolved relative to the portal-shell CWD, doubling the path and breaking
  // @cloudflare/next-on-pages. All @socios/* packages are covered by
  // transpilePackages (compiled at build time), so runtime file tracing
  // of the monorepo root is not needed for Cloudflare Pages deployments.

  transpilePackages: [
    "@socios/auth",
    "@socios/database",
    "@socios/utils",
  ],
};

export default nextConfig;
