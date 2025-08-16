import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMutationFactory, QueryClient, z } from "../src/index";
import { useMutation, QueryClientProvider } from "../src/react";
import { renderHook, act, waitFor } from "@testing-library/react";

const createWrapper = (client: QueryClient) => {
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);
};

const mockResponse = (data: any) => ({
	data,
	status: 200,
	statusText: "OK",
	headers: new Headers(),
	config: {},
});

const userSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string(),
});

// Factory-based 테스트용 mutation 팩토리
const testMutations = createMutationFactory({
	// URL + Method 방식
	createUser: {
		cacheKey: ["users", "create"],
		url: "/api/users",
		method: "POST" as const,
		requestSchema: z.object({
			name: z.string(),
			email: z.string(),
		}),
		responseSchema: userSchema,
	},

	// Custom Function 방식
	complexMutation: {
		cacheKey: ["complex"],
		mutationFn: async (data: { step1: string; step2: string }, fetcher) => {
			const result1 = await fetcher.request({
				url: "/api/step1",
				method: "POST",
				data: { value: data.step1 },
			});

			const result2 = await fetcher.request({
				url: "/api/step2",
				method: "POST",
				data: { value: data.step2, prev: result1.data },
			});

			return { step1: result1.data, step2: result2.data };
		},
	},
});

describe("useMutation", () => {
	let client: QueryClient;

	beforeEach(() => {
		client = new QueryClient();
		client.clear();
		vi.clearAllMocks();
	});

	describe("Options-based 사용법", () => {
		it("기본 POST 요청 성공", async () => {
			vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(
				mockResponse({ id: 1, name: "Alice", email: "alice@example.com" }),
			);

			const { result } = renderHook(
				() =>
					useMutation({
						cacheKey: ["users", "create"],
						mutationFn: async (data: { name: string; email: string }, fetcher) => {
							const response = await fetcher.request({
								url: "/api/users",
								method: "POST",
								data,
								schema: userSchema,
							});
							return response.data;
						},
					}),
				{ wrapper: createWrapper(client) },
			);

			expect(result.current.isPending).toBe(false);
			expect(result.current.data).toBeUndefined();

			await act(async () => {
				result.current.mutate({ name: "Alice", email: "alice@example.com" });
			});

			await waitFor(() => {
				expect(result.current.isPending).toBe(false);
			});

			expect(result.current.isSuccess).toBe(true);
			expect(result.current.data).toEqual({
				id: 1,
				name: "Alice",
				email: "alice@example.com",
			});
			expect(result.current.isError).toBe(false);
		});

		it("fetcher를 통한 다중 API 호출", async () => {
			vi.spyOn(client.getFetcher(), "request")
				.mockResolvedValueOnce(mockResponse({ token: "auth123" }))
				.mockResolvedValueOnce(mockResponse({ id: 1, name: "Alice" }));

			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async (data: { username: string; password: string }, fetcher) => {
							// 1단계: 인증
							const authResult = await fetcher.request({
								url: "/api/auth/login",
								method: "POST",
								data: { username: data.username, password: data.password },
							});

							// 2단계: 사용자 정보 조회
							const userResult = await fetcher.request({
								url: "/api/user/profile",
								method: "GET",
								headers: {
									Authorization: `Bearer ${(authResult.data as { token: string }).token}`,
								},
							});

							return {
								token: (authResult.data as { token: string }).token,
								user: userResult.data,
							};
						},
					}),
				{ wrapper: createWrapper(client) },
			);

			await act(async () => {
				result.current.mutate({ username: "alice", password: "secret" });
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual({
				token: "auth123",
				user: { id: 1, name: "Alice" },
			});

			expect(client.getFetcher().request).toHaveBeenCalledTimes(2);
		});

		it("에러 처리", async () => {
			vi.spyOn(client.getFetcher(), "request").mockRejectedValueOnce(new Error("Server error"));

			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async (data: { name: string }, fetcher) => {
							return await fetcher.request({
								url: "/api/users",
								method: "POST",
								data,
							});
						},
					}),
				{ wrapper: createWrapper(client) },
			);

			await act(async () => {
				result.current.mutate({ name: "Alice" });
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(Error);
			expect((result.current.error as Error).message).toBe("Server error");
			expect(result.current.data).toBeUndefined();
			expect(result.current.isSuccess).toBe(false);
		});

		it("mutateAsync 사용법", async () => {
			vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(mockResponse({ id: 1, name: "Alice" }));

			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async (data: { name: string }, fetcher) => {
							const response = await fetcher.request({
								url: "/api/users",
								method: "POST",
								data,
							});
							return response.data;
						},
					}),
				{ wrapper: createWrapper(client) },
			);

			let mutateAsyncResult: any;
			await act(async () => {
				mutateAsyncResult = await result.current.mutateAsync({ name: "Alice" });
			});

			expect(mutateAsyncResult).toEqual({ id: 1, name: "Alice" });
			expect(result.current.isSuccess).toBe(true);
			expect(result.current.data).toEqual({ id: 1, name: "Alice" });
		});

		it("mutateAsync 에러 처리", async () => {
			vi.spyOn(client.getFetcher(), "request").mockRejectedValueOnce(new Error("Async error"));

			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async (data: { name: string }, fetcher) => {
							return await fetcher.request({
								url: "/api/users",
								method: "POST",
								data,
							});
						},
					}),
				{ wrapper: createWrapper(client) },
			);

			await act(async () => {
				try {
					await result.current.mutateAsync({ name: "Alice" });
				} catch (error) {
					expect(error).toBeInstanceOf(Error);
					expect((error as Error).message).toBe("Async error");
				}
			});

			expect(result.current.isError).toBe(true);
		});
	});

	describe("Factory-based 사용법", () => {
		it("URL + Method 팩토리 사용", async () => {
			vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(
				mockResponse({ id: 1, name: "Alice", email: "alice@example.com" }),
			);

			const { result } = renderHook(() => useMutation(testMutations.createUser), { wrapper: createWrapper(client) });

			await act(async () => {
				result.current.mutate({ name: "Alice", email: "alice@example.com" });
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual({
				id: 1,
				name: "Alice",
				email: "alice@example.com",
			});
			expect(client.getFetcher().request).toHaveBeenCalledWith({
				url: "/api/users",
				method: "POST",
				data: { name: "Alice", email: "alice@example.com" },
				schema: userSchema,
			});
		});

		it("Custom Function 팩토리 사용", async () => {
			vi.spyOn(client.getFetcher(), "request")
				.mockResolvedValueOnce(mockResponse({ result: "step1-done" }))
				.mockResolvedValueOnce(mockResponse({ result: "step2-done" }));

			const { result } = renderHook(() => useMutation(testMutations.complexMutation), {
				wrapper: createWrapper(client),
			});

			await act(async () => {
				result.current.mutate({ step1: "data1", step2: "data2" });
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual({
				step1: { result: "step1-done" },
				step2: { result: "step2-done" },
			});

			expect(client.getFetcher().request).toHaveBeenCalledTimes(2);
		});

		it("Factory 옵션 오버라이드", async () => {
			const onSuccessSpy = vi.fn();
			const onErrorSpy = vi.fn();

			vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(
				mockResponse({ id: 1, name: "Alice", email: "alice@example.com" }),
			);

			const { result } = renderHook(
				() =>
					useMutation(testMutations.createUser, {
						onSuccess: onSuccessSpy,
						onError: onErrorSpy,
					}),
				{ wrapper: createWrapper(client) },
			);

			await act(async () => {
				result.current.mutate({ name: "Alice", email: "alice@example.com" });
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(onSuccessSpy).toHaveBeenCalledWith(
				{ id: 1, name: "Alice", email: "alice@example.com" },
				{ name: "Alice", email: "alice@example.com" },
				undefined,
			);
			expect(onErrorSpy).not.toHaveBeenCalled();
		});
	});

	describe("콜백 시스템", () => {
		it("모든 콜백이 올바른 순서로 실행됨", async () => {
			const callbacks: string[] = [];

			vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(mockResponse({ id: 1, name: "Alice" }));

			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async (data: { name: string }, fetcher) => {
							const response = await fetcher.request({
								url: "/api/users",
								method: "POST",
								data,
							});
							return response.data;
						},
						onMutate: async (variables) => {
							callbacks.push("onMutate");
							return { timestamp: Date.now() };
						},
						onSuccess: (data, variables, context) => {
							callbacks.push("onSuccess");
						},
						onSettled: (data, error, variables, context) => {
							callbacks.push("onSettled");
						},
					}),
				{ wrapper: createWrapper(client) },
			);

			await act(async () => {
				result.current.mutate(
					{ name: "Alice" },
					{
						onSuccess: () => callbacks.push("local-onSuccess"),
						onSettled: () => callbacks.push("local-onSettled"),
					},
				);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(callbacks).toEqual(["onMutate", "onSuccess", "local-onSuccess", "onSettled", "local-onSettled"]);
		});

		it("에러 시 onError와 onSettled 콜백 실행", async () => {
			const callbacks: string[] = [];

			vi.spyOn(client.getFetcher(), "request").mockRejectedValueOnce(new Error("Test error"));

			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async (data: { name: string }, fetcher) => {
							return await fetcher.request({
								url: "/api/users",
								method: "POST",
								data,
							});
						},
						onMutate: async () => {
							callbacks.push("onMutate");
							return { timestamp: Date.now() };
						},
						onError: (error, variables, context) => {
							callbacks.push("onError");
						},
						onSettled: (data, error, variables, context) => {
							callbacks.push("onSettled");
						},
					}),
				{ wrapper: createWrapper(client) },
			);

			await act(async () => {
				result.current.mutate(
					{ name: "Alice" },
					{
						onError: () => callbacks.push("local-onError"),
						onSettled: () => callbacks.push("local-onSettled"),
					},
				);
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(callbacks).toEqual(["onMutate", "onError", "local-onError", "onSettled", "local-onSettled"]);
		});
	});

	describe("invalidateQueries", () => {
		it("정적 쿼리 키 배열로 무효화", async () => {
			vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(mockResponse({ id: 1, name: "Alice" }));

			const invalidateQueriesSpy = vi.spyOn(client, "invalidateQueries");

			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async (data: { name: string }, fetcher) => {
							return await fetcher.request({
								url: "/api/users",
								method: "POST",
								data,
							});
						},
						invalidateQueries: [["users"], ["user-list"]],
					}),
				{ wrapper: createWrapper(client) },
			);

			await act(async () => {
				result.current.mutate({ name: "Alice" });
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(invalidateQueriesSpy).toHaveBeenCalledWith(["users"]);
			expect(invalidateQueriesSpy).toHaveBeenCalledWith(["user-list"]);
		});

		it("동적 함수로 쿼리 키 무효화", async () => {
			vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(mockResponse({ id: 5, name: "Alice" }));

			const invalidateQueriesSpy = vi.spyOn(client, "invalidateQueries");

			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async (data: { name: string }, fetcher) => {
							const response = await fetcher.request({
								url: "/api/users",
								method: "POST",
								data,
							});
							return response.data; // response.data 반환
						},
						invalidateQueries: (data: any, variables, context) => [["users"], ["users", data.id], ["user-profile", data.id]],
					}),
				{ wrapper: createWrapper(client) },
			);

			await act(async () => {
				result.current.mutate({ name: "Alice" });
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(invalidateQueriesSpy).toHaveBeenCalledWith(["users"]);
			expect(invalidateQueriesSpy).toHaveBeenCalledWith(["users", 5]);
			expect(invalidateQueriesSpy).toHaveBeenCalledWith(["user-profile", 5]);
		});
	});

	describe("상태 관리", () => {
		it("isPending 상태 변화", async () => {
			const fetchPromise = new Promise((resolve) => {
				setTimeout(() => resolve(mockResponse({ id: 1, name: "Alice" })), 100);
			});

			vi.spyOn(client.getFetcher(), "request").mockReturnValueOnce(fetchPromise as any);

			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async (data: { name: string }, fetcher) => {
							return await fetcher.request({
								url: "/api/users",
								method: "POST",
								data,
							});
						},
					}),
				{ wrapper: createWrapper(client) },
			);

			expect(result.current.isPending).toBe(false);

			act(() => {
				result.current.mutate({ name: "Alice" });
			});

			expect(result.current.isPending).toBe(true);

			await waitFor(() => {
				expect(result.current.isPending).toBe(false);
			});

			expect(result.current.isSuccess).toBe(true);
		});

		it("reset으로 상태 초기화", async () => {
			vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(mockResponse({ id: 1, name: "Alice" }));

			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async (data: { name: string }, fetcher) => {
							const response = await fetcher.request({
								url: "/api/users",
								method: "POST",
								data,
							});
							return response.data; // response.data 반환
						},
					}),
				{ wrapper: createWrapper(client) },
			);

			// mutation 실행
			await act(async () => {
				result.current.mutate({ name: "Alice" });
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual({ id: 1, name: "Alice" });

			// reset 실행
			act(() => {
				result.current.reset();
			});

			expect(result.current.data).toBeUndefined();
			expect(result.current.error).toBeNull();
			expect(result.current.isPending).toBe(false);
			expect(result.current.isSuccess).toBe(false);
			expect(result.current.isError).toBe(false);
		});
	});

	describe("런타임 검증", () => {
		beforeEach(() => {
			// 에러 테스트에서 console.error 스택 트레이스 출력 억제
			vi.spyOn(console, "error").mockImplementation(() => {});
		});

		afterEach(() => {
			// console.error mock 복원
			vi.restoreAllMocks();
		});

		it("mutationFn과 url+method 동시 제공 시 에러", () => {
			expect(() => {
				const invalidConfig = {
					url: "/api/test",
					method: "POST",
					mutationFn: async (data: any, fetcher: any) => ({ result: "test" }),
				};

				renderHook(() => useMutation(invalidConfig as any), {
					wrapper: createWrapper(client),
				});
			}).toThrow(
				"MutationConfig cannot have both 'mutationFn' and 'url'+'method' at the same time. Choose either custom function approach (mutationFn) or URL-based approach (url + method).",
			);
		});

		it("mutationFn도 url+method도 없을 시 에러", () => {
			expect(() => {
				const invalidConfig = {
					cacheKey: ["test"],
					// mutationFn, url, method 모두 없음
				};

				renderHook(() => useMutation(invalidConfig as any), {
					wrapper: createWrapper(client),
				});
			}).toThrow(
				"MutationConfig must have either 'mutationFn' or both 'url' and 'method'. Provide either a custom function or URL-based configuration.",
			);
		});
	});
});
