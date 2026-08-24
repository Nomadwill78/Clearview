import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root holds a separate app with its own lockfile; pin the workspace
  // root so Turbopack does not infer it and pull in the wrong dependency tree.
  turbopack: { root: path.resolve(__dirname) },
  serverExternalPackages: ["pdf-parse", "mammoth", "xlsx"],
};

export default nextConfig;
