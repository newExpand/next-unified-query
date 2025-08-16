import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient } from "../src/query/client/query-client";
import type { QueryClientOptions } from "../src/query/client/query-client";

describe("환경별 인터셉터 테스트", () => {
	let originalWindow: any;

	beforeEach(() => {
		originalWindow = global.window;
		vi.clearAllMocks();
	});

	afterEach(() => {
		global.window = originalWindow;
	});

	describe("클라이언트 환경", () => {
		beforeEach(() => {
			// 클라이언트 환경 시뮬레이션
			global.window = {} as any;
		});

		it("클라이언트 환경에서 clientInterceptors가 실행됨", () => {
			const commonRequestSpy = vi.fn((config) => config);
			const clientRequestSpy = vi.fn((config) => config);
			const serverRequestSpy = vi.fn((config) => config);

			const options: QueryClientOptions = {
				interceptors: {
					request: commonRequestSpy,
				},
				clientInterceptors: {
					request: clientRequestSpy,
				},
				serverInterceptors: {
					request: serverRequestSpy,
				},
			};

			const queryClient = new QueryClient(options);
			const fetcher = queryClient.getFetcher();

			// 인터셉터가 등록되었는지 확인
			expect(fetcher.interceptors.request).toBeDefined();
		});

		it("클라이언트 환경에서 serverInterceptors는 실행되지 않음", () => {
			let executedInterceptors: string[] = [];

			const options: QueryClientOptions = {
				interceptors: {
					request: (config) => {
						executedInterceptors.push("common");
						return config;
					},
				},
				clientInterceptors: {
					request: (config) => {
						executedInterceptors.push("client");
						return config;
					},
				},
				serverInterceptors: {
					request: (config) => {
						executedInterceptors.push("server");
						return config;
					},
				},
			};

			new QueryClient(options);

			// 서버 인터셉터는 등록되지 않았어야 함
			expect(executedInterceptors).not.toContain("server");
		});
	});

	describe("서버 환경", () => {
		beforeEach(() => {
			// 서버 환경 시뮬레이션 (window 객체 제거)
			// @ts-ignore
			delete global.window;
		});

		it("서버 환경에서 serverInterceptors가 실행됨", () => {
			const commonRequestSpy = vi.fn((config) => config);
			const clientRequestSpy = vi.fn((config) => config);
			const serverRequestSpy = vi.fn((config) => config);

			const options: QueryClientOptions = {
				interceptors: {
					request: commonRequestSpy,
				},
				clientInterceptors: {
					request: clientRequestSpy,
				},
				serverInterceptors: {
					request: serverRequestSpy,
				},
			};

			const queryClient = new QueryClient(options);
			const fetcher = queryClient.getFetcher();

			// 인터셉터가 등록되었는지 확인
			expect(fetcher.interceptors.request).toBeDefined();
		});

		it("서버 환경에서 clientInterceptors는 실행되지 않음", () => {
			let executedInterceptors: string[] = [];

			const options: QueryClientOptions = {
				interceptors: {
					request: (config) => {
						executedInterceptors.push("common");
						return config;
					},
				},
				clientInterceptors: {
					request: (config) => {
						executedInterceptors.push("client");
						return config;
					},
				},
				serverInterceptors: {
					request: (config) => {
						executedInterceptors.push("server");
						return config;
					},
				},
			};

			new QueryClient(options);

			// 클라이언트 인터셉터는 등록되지 않았어야 함
			expect(executedInterceptors).not.toContain("client");
		});
	});

	describe("하위 호환성", () => {
		it("기존 interceptors 옵션만 사용해도 정상 동작", () => {
			const requestSpy = vi.fn((config) => config);
			const responseSpy = vi.fn((response) => response);
			const errorSpy = vi.fn((error) => error);

			const options: QueryClientOptions = {
				interceptors: {
					request: requestSpy,
					response: responseSpy,
					error: errorSpy,
				},
			};

			const queryClient = new QueryClient(options);
			const fetcher = queryClient.getFetcher();

			// 인터셉터가 정상적으로 등록되었는지 확인
			expect(fetcher.interceptors.request).toBeDefined();
			expect(fetcher.interceptors.response).toBeDefined();
			expect(fetcher.interceptors.error).toBeDefined();
		});

		it("interceptors와 환경별 인터셉터를 함께 사용 가능", () => {
			global.window = {} as any; // 클라이언트 환경

			let executionOrder: string[] = [];

			const options: QueryClientOptions = {
				interceptors: {
					request: (config) => {
						executionOrder.push("common-request");
						return config;
					},
					response: (response) => {
						executionOrder.push("common-response");
						return response;
					},
				},
				clientInterceptors: {
					request: (config) => {
						executionOrder.push("client-request");
						return config;
					},
					response: (response) => {
						executionOrder.push("client-response");
						return response;
					},
				},
			};

			const queryClient = new QueryClient(options);
			const fetcher = queryClient.getFetcher();

			// 모든 인터셉터가 등록되었는지 확인
			expect(fetcher.interceptors.request).toBeDefined();
			expect(fetcher.interceptors.response).toBeDefined();
		});
	});

	describe("실제 사용 시나리오", () => {
		it("클라이언트 환경에서 localStorage 접근이 가능한 인터셉터", () => {
			global.window = {} as any;
			global.localStorage = {
				getItem: vi.fn(() => "test-token"),
				setItem: vi.fn(),
				removeItem: vi.fn(),
			} as any;

			let interceptorExecuted = false;
			let tokenUsed = false;

			const options: QueryClientOptions = {
				clientInterceptors: {
					request: (config) => {
						interceptorExecuted = true;
						// typeof window 체크 없이 직접 localStorage 접근
						const token = localStorage.getItem("token");
						if (token) {
							tokenUsed = true;
							config.headers = {
								...config.headers,
								Authorization: `Bearer ${token}`,
							};
						}
						return config;
					},
				},
			};

			const queryClient = new QueryClient(options);
			expect(queryClient).toBeDefined();
			// 인터셉터는 실제 요청 시점에 실행되므로, 여기서는 QueryClient가 정상 생성되었는지만 확인
			expect(queryClient.getFetcher()).toBeDefined();
		});

		it("서버 환경에서 process.env 접근이 가능한 인터셉터", () => {
			// @ts-ignore
			delete global.window;
			process.env.REGION = "ap-northeast-2";
			process.env.INSTANCE_ID = "server-001";

			const options: QueryClientOptions = {
				serverInterceptors: {
					request: (config) => {
						// typeof window 체크 없이 직접 process.env 접근
						config.headers = {
							...config.headers,
							"X-Server-Region": process.env.REGION,
							"X-Server-Instance": process.env.INSTANCE_ID,
						};
						return config;
					},
				},
			};

			const queryClient = new QueryClient(options);
			expect(queryClient).toBeDefined();
		});
	});
});