import { defineConfig } from "tsup";

export default defineConfig([
  // index.ts - 서버/클라이언트 공통 코드
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ["react", "react-dom"],
  },
  // react.ts - 클라이언트 전용 코드
  {
    entry: ["src/react.ts"],
    format: ["cjs", "esm"],
    dts: true,
    clean: false,
    sourcemap: true,
    treeshake: false,
    external: ["react", "react-dom"],
    banner: {
      js: '"use client";', // 모든 JS 파일에 "use client" 추가
    },
  },
]);
