import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import fs from "fs";

/**
 * Tiny Vite plugin that copies index.html → 404.html after build.
 * This enables SPA fallback on GitHub Pages (and other static hosts)
 * so that direct navigation to /mergekeys, /about, /iaa works
 * without the /#/ hash prefix.
 */
function spaFallback(): Plugin {
  return {
    name: "spa-fallback-404",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const src = path.join(outDir, "index.html");
      const dest = path.join(outDir, "404.html");
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log("\n  ✓ SPA fallback: copied index.html → 404.html\n");
      }
    },
  };
}

export default defineConfig({
  plugins: [vue(), spaFallback()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "esbuild",
  },
  server: {
    port: 3000,
    open: true,
  },
});
