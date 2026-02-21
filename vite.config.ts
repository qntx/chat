import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), nodePolyfills({ include: ["crypto"] })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          wallet: ["wagmi", "viem", "@rainbow-me/rainbowkit"],
          chat: ["@assistant-ui/react", "@assistant-ui/react-markdown"],
        },
      },
    },
  },
});
