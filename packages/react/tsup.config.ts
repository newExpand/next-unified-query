import { defineConfig } from "tsup";

export default defineConfig([
  // Server-side bundle (default export, includes core)
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: false,
    noExternal: ["next-unified-query-core"],
    // No banner for server bundle
  },
  // Client-side React bundle (with "use client")
  {
    entry: { react: "src/react.ts" },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    treeshake: true,
    external: ["react", "react-dom"],
    banner: {
      js: '"use client";',
    },
  },
]);