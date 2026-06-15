import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't pick up a stray
  // lockfile in a parent directory (e.g. ~/package-lock.json).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
