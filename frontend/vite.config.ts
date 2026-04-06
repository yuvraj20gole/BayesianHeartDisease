import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiPort = process.env.VITE_API_PORT ?? "8000";
const devPort = Number(process.env.VITE_DEV_PORT ?? "5173");
/** GitHub Pages project site: /RepoName/ — set VITE_BASE_PATH in CI */
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: devPort,
    strictPort: true,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
