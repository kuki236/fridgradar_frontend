import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Punto al directorio donde está tu next.config.ts (tu app frontend)
    root: path.join(__dirname),
  },
};

export default nextConfig;