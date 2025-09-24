import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "8080"),
  },
  preview: {
    host: "0.0.0.0", 
    port: parseInt(process.env.PORT || "8080"),
    allowedHosts: ['echovibe-app-bdza8.ondigitalocean.app', 'https://sparkvibe.app'],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});