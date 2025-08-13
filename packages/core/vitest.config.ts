/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./test/setup.ts"],
		exclude: [
			"node_modules/**",
			"dist/**",
			"test/type-safety/**", // 타입 체크 전용 파일 제외
		],
	},
});
