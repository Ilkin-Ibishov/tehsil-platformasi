import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    root: ".",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
