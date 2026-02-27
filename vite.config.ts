import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [TanStackRouterVite({}), react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5100",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "three-vendor": ["three", "@react-three/fiber", "@react-three/drei"],
          "react-flow": ["@xyflow/react"],
          recharts: ["recharts"],
          router: ["@tanstack/react-router"],
        },
      },
    },
  },
});
