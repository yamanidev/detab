import { defineConfig } from "vite";
import { copyFileSync } from "fs";

const browser = process.env.BROWSER ?? "chrome";

export default defineConfig({
  base: "",
  publicDir: "public",
  plugins: [
    {
      name: "copy-manifest",
      closeBundle() {
        const src = browser === "firefox" ? "manifest.firefox.json" : "manifest.json";
        copyFileSync(src, `dist/${browser}/manifest.json`);
      },
    },
  ],
  build: {
    outDir: `dist/${browser}`,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: "popup.html",
      },
    },
  },
});
