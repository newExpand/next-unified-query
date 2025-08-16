/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./test/setup.ts"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/type-safety/**", // 타입 테스트는 실행하지 않음
		],
	},
});
