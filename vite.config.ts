import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "8080"),
    proxy: {
      "/api": {
        target: "https://sparkvibe.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  },
  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "8080"),
    allowedHosts: [
      "echovibe-app-bdza8.ondigitalocean.app",
      "sparkvibe.app",
      "www.sparkvibe.app"
    ],
    proxy: {
      "/api": {
        target: "https://sparkvibe.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  }
});