import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { 
	QueryClientProvider, 
	QueryErrorBoundary, 
	QueryErrorResetBoundary,
	useErrorResetBoundary,
	useQuery,
	useMutation
} from "../src/react";
import { QueryClient, FetchError } from "../src/index";

// Mock 에러 생성 헬퍼
const createFetchError = (status: number, message: string, method: "GET" | "POST" = "GET") => {
	const error = new FetchError(
		message,
		{ 
			url: "/api/test", 
			method,
			headers: {} as any, // headers 추가
			baseURL: undefined
		},
		"ERR_NETWORK"
	);
	error.response = {
		status,
		statusText: message,
		data: null as any,
		headers: new Headers()
	} as any;
	return error;
};

describe("QueryErrorBoundary", () => {
	let client: QueryClient;
	const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

	beforeEach(() => {
		client = new QueryClient();
		client.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		consoleErrorSpy.mockClear();
	});

	describe("Basic Error Boundary", () => {
		it("에러 발생 시 fallback UI를 렌더링해야 함", () => {
			const ThrowError = () => {
				throw new Error("Test error");
			};

			render(
				<QueryErrorBoundary
					fallback={(error: Error) => <div>Error: {error.message}</div>}
				>
					<ThrowError />
				</QueryErrorBoundary>
			);

			expect(screen.getByText("Error: Test error")).toBeInTheDocument();
		});

		it("reset 함수가 Error Boundary를 리셋해야 함", async () => {
			const user = userEvent.setup();
			let shouldThrow = true;

			const TestComponent = () => {
				if (shouldThrow) {
					throw new Error("Test error");
				}
				return <div>Success</div>;
			};

			render(
				<QueryErrorBoundary
					fallback={(error: Error, reset: () => void) => (
						<div>
							<div>Error: {error.message}</div>
							<button onClick={() => {
								shouldThrow = false;
								reset();
							}}>Reset</button>
						</div>
					)}
				>
					<TestComponent />
				</QueryErrorBoundary>
			);

			expect(screen.getByText("Error: Test error")).toBeInTheDocument();
			
			await user.click(screen.getByText("Reset"));
			
			await waitFor(() => {
				expect(screen.getByText("Success")).toBeInTheDocument();
			});
		});

		it("기본 fallback UI를 렌더링해야 함", () => {
			const ThrowError = () => {
				throw new Error("Test error");
			};

			render(
				<QueryErrorBoundary>
					<ThrowError />
				</QueryErrorBoundary>
			);

			expect(screen.getByText("Something went wrong")).toBeInTheDocument();
			expect(screen.getByText("Try again")).toBeInTheDocument();
		});
	});

	describe("useQuery with throwOnError", () => {
		it("throwOnError가 true일 때 Error Boundary로 에러를 전파해야 함", async () => {
			const error = createFetchError(500, "Server error");
			vi.spyOn(client.getFetcher(), "get").mockRejectedValueOnce(error);

			const TestComponent = () => {
				useQuery({
					cacheKey: ["test"],
					url: "/api/test",
					throwOnError: true
				});
				return <div>Success</div>;
			};

			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<QueryClientProvider client={client}>
					<QueryErrorBoundary
						fallback={(error: Error) => <div>Error caught: {error.message}</div>}
					>
						{children}
					</QueryErrorBoundary>
				</QueryClientProvider>
			);

			render(<TestComponent />, { wrapper });

			await waitFor(() => {
				expect(screen.getByText("Error caught: Server error")).toBeInTheDocument();
			});
		});

		it("throwOnError 함수가 조건부로 에러를 전파해야 함", async () => {
			// 404 에러는 전파하지 않음
			const error404 = createFetchError(404, "Not found");
			const getMock = vi.spyOn(client.getFetcher(), "get");
			getMock.mockRejectedValueOnce(error404);

			const TestComponent = ({ throwCondition, testId }: { throwCondition: (error: FetchError) => boolean; testId: string }) => {
				const { error: queryError, isError } = useQuery({
					cacheKey: ["test", testId], // testId를 포함해서 각 테스트마다 다른 캐시 키 사용
					url: "/api/test",
					throwOnError: throwCondition
				});
				
				if (isError) {
					return <div>Error handled: {queryError?.message}</div>;
				}
				
				return <div>Success</div>;
			};

			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<QueryClientProvider client={client}>
					<QueryErrorBoundary
						fallback={(error: Error) => <div>Error caught by boundary: {error.message}</div>}
					>
						{children}
					</QueryErrorBoundary>
				</QueryClientProvider>
			);

			// 500+ 에러만 전파하는 조건
			const { rerender } = render(
				<TestComponent 
					throwCondition={(error: FetchError) => (error.response?.status ?? 0) >= 500}
					testId="404-test"
				/>,
				{ wrapper }
			);

			await waitFor(() => {
				// 404는 Error Boundary로 전파되지 않음
				expect(screen.getByText("Error handled: Not found")).toBeInTheDocument();
			});

			// mock이 한 번 호출되었는지 확인 (404 에러)
			expect(getMock).toHaveBeenCalledTimes(1);

			// 500 에러로 재시도
			const error500 = createFetchError(500, "Server error");
			getMock.mockRejectedValueOnce(error500);

			rerender(
				<TestComponent 
					throwCondition={(error: FetchError) => (error.response?.status ?? 0) >= 500}
					testId="500-test" // 다른 캐시 키를 사용하도록 testId 변경
				/>
			);

			await waitFor(() => {
				// 500 에러는 Error Boundary로 전파됨
				expect(screen.getByText("Error caught by boundary: Server error")).toBeInTheDocument();
			});

			// mock이 두 번 호출되었는지 확인 (404 에러 + 500 에러)
			expect(getMock).toHaveBeenCalledTimes(2);
		});
	});

	describe("useMutation with throwOnError", () => {
		it("throwOnError가 true일 때 mutation 에러를 Error Boundary로 전파해야 함", async () => {
			const user = userEvent.setup();
			const error = createFetchError(500, "Mutation failed", "POST");
			
			// fetcher의 request 메서드를 mock
			vi.spyOn(client.getFetcher(), "request").mockRejectedValueOnce(error);

			const TestComponent = () => {
				const mutation = useMutation({
					url: "/api/test",
					method: "POST",
					throwOnError: true
				});

				return (
					<button onClick={() => mutation.mutate({ data: "test" })}>
						Mutate
					</button>
				);
			};

			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<QueryClientProvider client={client}>
					<QueryErrorBoundary
						fallback={(error: Error) => <div>Mutation error: {error.message}</div>}
					>
						{children}
					</QueryErrorBoundary>
				</QueryClientProvider>
			);

			render(<TestComponent />, { wrapper });
			
			await user.click(screen.getByText("Mutate"));

			await waitFor(() => {
				expect(screen.getByText("Mutation error: Mutation failed")).toBeInTheDocument();
			});
		});
	});

	describe("QueryErrorResetBoundary", () => {
		it("useErrorResetBoundary Hook이 Error Boundary를 리셋해야 함", async () => {
			const user = userEvent.setup();
			let shouldThrow = true;

			const TestComponent = () => {
				const resetBoundary = useErrorResetBoundary();
				
				if (shouldThrow) {
					throw new Error("Test error");
				}

				return (
					<div>
						<div>Success</div>
						<button onClick={resetBoundary}>Reset from child</button>
					</div>
				);
			};

			const FallbackComponent = ({ error, reset }: { error: Error; reset: () => void }) => (
				<div>
					<div>Error: {error.message}</div>
					<button onClick={() => {
						shouldThrow = false;
						reset();
					}}>Reset from fallback</button>
				</div>
			);

			render(
				<QueryErrorResetBoundary
					fallback={(error, reset) => <FallbackComponent error={error} reset={reset} />}
				>
					<TestComponent />
				</QueryErrorResetBoundary>
			);

			expect(screen.getByText("Error: Test error")).toBeInTheDocument();
			
			await user.click(screen.getByText("Reset from fallback"));
			
			await waitFor(() => {
				expect(screen.getByText("Success")).toBeInTheDocument();
			});
		});

		it("resetKeys 변경 시 자동으로 Error Boundary를 리셋해야 함", async () => {
			let shouldThrow = true;

			const TestComponent = () => {
				if (shouldThrow) {
					throw new Error("Test error");
				}
				return <div>Success</div>;
			};

			const App = () => {
				const [key, setKey] = useState(0);

				return (
					<QueryErrorBoundary
						resetKeys={[key]}
						fallback={(error: Error) => (
							<div>
								<div>Error: {error.message}</div>
								<button onClick={() => {
									shouldThrow = false;
									setKey(k => k + 1);
								}}>Change key</button>
							</div>
						)}
					>
						<TestComponent />
					</QueryErrorBoundary>
				);
			};

			const user = userEvent.setup();
			render(<App />);

			expect(screen.getByText("Error: Test error")).toBeInTheDocument();
			
			await user.click(screen.getByText("Change key"));
			
			await waitFor(() => {
				expect(screen.getByText("Success")).toBeInTheDocument();
			});
		});
	});

	describe("Error logging", () => {
		it("onError 콜백이 호출되어야 함", () => {
			const onError = vi.fn();
			
			const ThrowError = () => {
				throw new Error("Test error");
			};

			render(
				<QueryErrorBoundary onError={onError}>
					<ThrowError />
				</QueryErrorBoundary>
			);

			expect(onError).toHaveBeenCalledWith(
				expect.any(Error),
				expect.objectContaining({
					componentStack: expect.any(String)
				})
			);
		});

		it("FetchError의 경우 추가 정보를 로깅해야 함", () => {
			const error = createFetchError(500, "Server error", "GET");
			
			const ThrowError = () => {
				throw error;
			};

			render(
				<QueryErrorBoundary>
					<ThrowError />
				</QueryErrorBoundary>
			);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Query Error Details:",
				expect.objectContaining({
					status: 500,
					statusText: "Server error",
					url: "/api/test",
					method: "GET"
				})
			);
		});
	});
});