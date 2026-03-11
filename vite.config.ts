import { defineConfig } from "vite";
import { copyFileSync } from "fs";

export default defineConfig({
  base: "",
  publicDir: false,
  plugins: [
    {
      name: "copy-manifest",
      closeBundle() {
        copyFileSync("manifest.json", "dist/manifest.json");
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: "popup.html",
      },
    },
  },
});
