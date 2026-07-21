import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Les images sont émises en fichiers séparés (servis par Netlify), pas inline en base64 :
  // JS léger (~1 Mo au lieu de 24 Mo), build plus fiable et site plus rapide.
});
