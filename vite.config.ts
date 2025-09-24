import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import cors from "vite-plugin-cors";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "8080"),
  },
  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "8080"),
    allowedHosts: [
      'echovibe-app-bdza8.ondigitalocean.app',
      'sparkvibe.app',
      'www.sparkvibe.app'
    ],
  },
  plugins: [
    react(),
    cors({
      origin: [
        'https://echovibe-app-bdza8.ondigitalocean.app',
        'https://sparkvibe.app',
        'https://www.sparkvibe.app'
      ]
    })
  ],
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