import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src")
    }
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true
    }),
    react({ compiler: true })
  ]
});
