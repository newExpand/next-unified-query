import { defineConfig } from "tsup";
import { readFile, writeFile } from "fs/promises";

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
		async onSuccess() {
			// 빌드 후 "use client" 지시어 추가
			const files = ["dist/react.js", "dist/react.mjs"];

			for (const file of files) {
				try {
					const content = await readFile(file, "utf-8");
					if (!content.startsWith('"use client"')) {
						await writeFile(file, '"use client";\n' + content);
					}
				} catch (error) {
					console.warn(`Failed to add "use client" to ${file}:`, error);
				}
			}
		},
	},
]);
