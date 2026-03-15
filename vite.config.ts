import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
