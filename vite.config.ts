import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_"],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5180,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8091",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    port: 5180,
    proxy: {
      "/api": {
        target: "http://localhost:8091",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
  },
});
