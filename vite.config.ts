import { defineConfig } from "vite";
import path from "path";

// Node.js library build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "WinstonLogger",
      fileName: (format) => `index.${format}.js`,
      formats: ["cjs", "es"]
    },
    rollupOptions: {
      external: [
        "winston",
        "tsyringe", 
        "reflect-metadata",
        "class-transformer",
        "class-validator",
        "uuid",
        "fs",
        "path",
        "express"
      ],
      output: {
        globals: {
          winston: "winston",
          tsyringe: "tsyringe",
          "reflect-metadata": "Reflect"
        }
      }
    },
    target: "node14",
    sourcemap: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
