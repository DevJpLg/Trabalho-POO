import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3333",
        changeOrigin: true,
        configure(proxy) {
          // DELETE de usuário/produto responde 204 sem corpo. O http-proxy do Vite
          // às vezes trava ou falha nessas respostas se o content-length não for 0.
          proxy.on("proxyRes", (proxyRes) => {
            if (proxyRes.statusCode === 204) {
              proxyRes.headers["content-length"] = "0";
              delete proxyRes.headers["transfer-encoding"];
            }
          });
        },
      },
    },
  },
});
