import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: "auto-imports.d.ts",
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: "components.d.ts",
    }),
    vueJsx(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "../dist/public",
    // rollupOptions: {
    //   external: ["@conveyor/types"],
    // },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000/api",
        rewrite: (path) => path.replace(/^\/api/, ""),
        changeOrigin: true,
      },
    },
  },
  define: {
    __VERSION__: JSON.stringify(require("./package.json").version),
  },
});
