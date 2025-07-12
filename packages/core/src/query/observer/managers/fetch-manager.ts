import type { QueryClient } from "../../client/query-client";
import type { QueryObserverOptions } from "../types";
import type { FetchConfig, NextTypeFetch, QueryFetcher } from "../../../types/index";
import { PlaceholderManager } from "./placeholder-manager";
import { isNotNil } from "es-toolkit/predicate";
import { merge } from "es-toolkit/compat";

/**
 * QueryObserver fetch 관리자 클래스
 *
 * @description
 * QueryObserver의 데이터 페칭 로직을 담당합니다.
 * fetch 실행 조건 확인, 실제 데이터 페칭, 상태 업데이트,
 * 에러 처리를 관리합니다.
 */
export class FetchManager<T = unknown> {
	private queryClient: QueryClient;
	private placeholderManager: PlaceholderManager<T>;

	constructor(queryClient: QueryClient, placeholderManager: PlaceholderManager<T>) {
		this.queryClient = queryClient;
		this.placeholderManager = placeholderManager;
	}

	/**
	 * Fetch 실행
	 * enabled 옵션과 stale 상태를 확인하여 필요한 경우에만 페칭을 수행합니다.
	 * 각 QueryObserver가 독립적으로 실행되며, HTTP 레벨에서 중복 방지가 이루어집니다.
	 */
	async executeFetch<T>(cacheKey: string, options: QueryObserverOptions<T>, onComplete?: () => void): Promise<void> {
		const { staleTime = 0 } = options;

		const cached = this.queryClient.get<T>(cacheKey);
		const isStale = cached ? Date.now() - cached.updatedAt >= staleTime : true;

		if (!cached || isStale) {
			// 각 QueryObserver가 독립적으로 fetchData 실행
			// HTTP 레벨에서 중복 방지가 이루어짐
			try {
				await this.fetchData(cacheKey, options);
				// fetch 완료 후 onComplete 실행 (중복 방지를 위해 여기서만 실행)
				onComplete?.();
			} catch (error) {
				console.error("fetchData error:", error);
				// 에러 시에도 onComplete 실행
				onComplete?.();
			}
		} else {
			// 캐시가 신선한 경우에도 onComplete 호출
			// 이렇게 해야 enabled 변경 시 즉시 완료로 간주할 수 있음
			onComplete?.();
		}
	}

	/**
	 * 데이터 페칭
	 * 실제 HTTP 요청을 수행하고 결과를 캐시에 저장합니다.
	 */
	async fetchData<T>(cacheKey: string, options: QueryObserverOptions<T>): Promise<void> {
		try {
			// fetch 설정이 이미 다른 곳에서 처리되었는지 확인
			const currentState = this.queryClient.get<T>(cacheKey);

			// 초기 상태에서 이미 isFetching: true로 설정되므로
			// 여기서 추가로 설정할 필요 없음 (중복 알림 방지)

			// fetch 결과
			const result = await this.performHttpRequest(options);

			// 성공 상태 저장 - placeholderData 비활성화
			this.placeholderManager.deactivatePlaceholder();

			this.queryClient.set(cacheKey, {
				data: result,
				error: undefined,
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			});
		} catch (error: any) {
			// 에러 상태 저장 - placeholderData 비활성화
			this.placeholderManager.deactivatePlaceholder();

			this.queryClient.set(cacheKey, {
				data: undefined as T | undefined,
				error,
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			});
		}
	}

	/**
	 * HTTP 요청 수행
	 * 실제 네트워크 요청을 처리하고 스키마 검증을 수행합니다.
	 */
	private async performHttpRequest<T>(options: QueryObserverOptions<T>): Promise<T> {
		const fetcher = this.queryClient.getFetcher();

		// queryFn 방식 처리
		if ("queryFn" in options && options.queryFn) {
			return this.executeQueryFn(options, fetcher);
		}

		// URL 방식 처리
		if ("url" in options && options.url) {
			return this.executeUrlRequest(options, fetcher);
		}

		// 이론적으로 도달할 수 없는 코드 (타입 시스템이 보장)
		throw new Error("Invalid QueryObserverOptions: neither 'url' nor 'queryFn' is provided");
	}

	/**
	 * NextTypeFetch에서 QueryFetcher 인스턴스 생성
	 * GET/HEAD 메서드만 허용하는 제한된 fetcher 반환
	 */
	private createQueryFetcher(fetcher: NextTypeFetch): QueryFetcher {
		return {
			get: fetcher.get.bind(fetcher),
			head: fetcher.head.bind(fetcher),
			request: (config) => {
				// request 메서드는 GET/HEAD만 허용
				const method = config.method || "GET";
				if (method !== "GET" && method !== "HEAD") {
					throw new Error(`Query fetcher only supports GET and HEAD methods, but received: ${method}`);
				}
				return fetcher.request({ ...config, method });
			},
		};
	}

	/**
	 * queryFn 실행
	 * Factory 방식과 Options 방식을 구분하여 적절한 인자로 호출
	 */
	private async executeQueryFn<T>(options: QueryObserverOptions<T>, fetcher: NextTypeFetch): Promise<T> {
		const queryFn = (options as any).queryFn;
		const queryFetcher = this.createQueryFetcher(fetcher);
		let result: any;

		// Factory 방식 (params가 있는 경우)
		if ("params" in options && options.params !== undefined) {
			result = await queryFn(options.params, queryFetcher);
		} else {
			// Options 방식 (QueryFetcher만 전달)
			result = await queryFn(queryFetcher);
		}

		return this.applySchemaValidation(result, options.schema);
	}

	/**
	 * URL 기반 요청 실행
	 */
	private async executeUrlRequest<T>(options: QueryObserverOptions<T>, fetcher: NextTypeFetch): Promise<T> {
		const url = (options as any).url;
		const config = this.buildFetchConfig(options);
		const response = await fetcher.get(url, config);

		return this.applySchemaValidation(response.data, options.schema);
	}

	/**
	 * Fetch 설정 구성
	 */
	private buildFetchConfig<T>(options: QueryObserverOptions<T>): FetchConfig {
		let config: FetchConfig = merge({}, options.fetchConfig ?? {});

		if (isNotNil(options.params)) {
			config = merge(config, { params: options.params });
		}
		if (isNotNil(options.schema)) {
			config = merge(config, { schema: options.schema });
		}

		return config;
	}

	/**
	 * 스키마 검증 적용
	 */
	private applySchemaValidation<T>(data: any, schema?: any): T {
		if (schema) {
			return schema.parse(data) as T;
		}
		return data as T;
	}

	/**
	 * 수동 refetch
	 * 캐시 키와 옵션을 받아 즉시 데이터를 다시 페칭합니다.
	 * force 옵션이 true인 경우 staleTime을 무시하고 강제로 페칭합니다.
	 */
	async refetch<T>(
		cacheKey: string,
		options: QueryObserverOptions<T>,
		onComplete: () => void,
		force: boolean = true,
	): Promise<void> {
		if (force) {
			// 강제 refetch: staleTime 무시하고 항상 fetch
			try {
				await this.fetchData(cacheKey, options);
				onComplete();
			} catch (error) {
				console.error("refetch fetchData error:", error);
				onComplete();
			}
		} else {
			// 조건부 refetch: staleTime 확인 후 필요시에만 fetch
			const { staleTime = 0 } = options;
			const cached = this.queryClient.get<T>(cacheKey);
			const isStale = cached ? Date.now() - cached.updatedAt >= staleTime : true;

			if (isStale) {
				try {
					await this.fetchData(cacheKey, options);
					onComplete();
				} catch (error) {
					console.error("refetch fetchData error:", error);
					onComplete();
				}
			}
		}
	}

	/**
	 * 페칭 상태 확인
	 * 현재 페칭 중인지 확인합니다.
	 */
	isFetching<T>(cacheKey: string): boolean {
		const cached = this.queryClient.get<T>(cacheKey);
		return cached?.isFetching ?? false;
	}

	/**
	 * Stale 상태 확인
	 * 캐시된 데이터가 stale한지 확인합니다.
	 */
	isStale<T>(cacheKey: string, staleTime: number = 0): boolean {
		const cached = this.queryClient.get<T>(cacheKey);
		return cached ? Date.now() - cached.updatedAt >= staleTime : true;
	}
}
