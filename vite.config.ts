import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // 配置 @ 指向 src 目录
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // 将所有 /api 前缀的请求代理到后端服务器
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // 将 /api-docs 路径的请求也代理到后端服务器（用于访问 Swagger 文档）
      "/api-docs": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      onwarn: (warning, warn) => {
        // 忽略特定警告
        if (
          warning.code === "UNUSED_EXTERNAL_IMPORT" ||
          warning.code === "UNUSED_VARIABLE"
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
});
