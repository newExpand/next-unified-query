import { defineConfig } from "tsup";

export default defineConfig([
  // Server-side bundle (default export, Core re-exports only)
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ["react", "react-dom", "next-unified-query-core"],
    // No banner for server bundle
  },
  // Client-side React bundle (with "use client")
  {
    entry: { react: "src/react.ts" },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    treeshake: true,
    external: ["react", "react-dom", "next-unified-query-core"],
    banner: {
      js: '"use client";',
    },
  },
]);