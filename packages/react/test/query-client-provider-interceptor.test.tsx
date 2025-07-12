import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "../src/index";
import { QueryClientProvider, useQuery } from "../src/react";

describe("QueryClientProvider + fetcher 인터셉터 통합", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		global.fetch = fetchMock;
	});

	it("Provider로 주입된 QueryClient의 fetcher 인터셉터가 useQuery에 적용된다", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => ({ name: "Alice" }),
			text: async () => JSON.stringify({ name: "Alice" }),
		});
		const client = new QueryClient({ baseURL: "https://api.example.com" });
		client.getFetcher().interceptors.request.use((config) => {
			config.headers = { ...config.headers, "X-Test-Header": "test-value" };
			return config;
		});

		const { result } = renderHook(() => useQuery({ cacheKey: ["user", 1], url: "/api/user/1" }), {
			wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
		});

		await waitFor(() => {
			expect(result.current.data).toEqual({ name: "Alice" });
		});

		const fetchConfig = fetchMock.mock.calls[0][1];
		expect(fetchConfig.headers["X-Test-Header"]).toBe("test-value");
	});

	it("Provider 중첩 시 각각의 fetcher 인터셉터가 분리 적용된다", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => ({ name: "Main" }),
			text: async () => JSON.stringify({ name: "Main" }),
		});
		fetchMock.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => ({ name: "Sub" }),
			text: async () => JSON.stringify({ name: "Sub" }),
		});
		const client1 = new QueryClient({ baseURL: "https://api.main.com" });
		const client2 = new QueryClient({ baseURL: "https://api.sub.com" });
		client1.getFetcher().interceptors.request.use((config) => {
			config.headers = { ...config.headers, "X-Client": "main" };
			return config;
		});
		client2.getFetcher().interceptors.request.use((config) => {
			config.headers = { ...config.headers, "X-Client": "sub" };
			return config;
		});
		const Wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={client1}>
				<div>
					<QueryClientProvider client={client2}>{children}</QueryClientProvider>
				</div>
			</QueryClientProvider>
		);
		const { result: result1 } = renderHook(() => useQuery({ cacheKey: ["user", 1], url: "/api/user/1" }), {
			wrapper: ({ children }) => <QueryClientProvider client={client1}>{children}</QueryClientProvider>,
		});
		await waitFor(() => {
			expect(result1.current.data).toEqual({ name: "Main" });
		});
		const fetchConfig1 = fetchMock.mock.calls[0][1];
		expect(fetchConfig1.headers["X-Client"]).toBe("main");

		const { result: result2 } = renderHook(() => useQuery({ cacheKey: ["user", 2], url: "/api/user/2" }), {
			wrapper: Wrapper,
		});
		await waitFor(() => {
			expect(result2.current.data).toEqual({ name: "Sub" });
		});
		const fetchConfig2 = fetchMock.mock.calls[1][1];
		expect(fetchConfig2.headers["X-Client"]).toBe("sub");
	});
});
