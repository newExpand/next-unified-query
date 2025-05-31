import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/react.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  minify: true,
  splitting: false,
  sourcemap: false,
  treeshake: true,
  external: ["react", "react-dom"],
});
