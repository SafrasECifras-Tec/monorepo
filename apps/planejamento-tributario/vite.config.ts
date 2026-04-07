import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Force a single React instance across the bundle — prevents the
    // "Cannot read properties of null (reading 'useState')" crash that
    // happens when @socios/auth resolves a different React copy than the app.
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
