import { useReducer, useCallback, useRef, useEffect } from "react";
import {
	FetchError,
	type ApiErrorResponse,
	type MutationMethod,
	type RequestConfig,
	type NextTypeFetch,
} from "next-unified-query-core";
import { validateMutationConfig, type MutationConfig, type InferIfZodSchema } from "next-unified-query-core";
import { useQueryClient } from "../query-client-provider";
import { z, type ZodType } from "next-unified-query-core";
import { merge, isArray, isFunction } from "es-toolkit/compat";

/**
 * Mutation 상태 인터페이스
 */
export interface MutationState<TData = unknown, TError = FetchError<ApiErrorResponse>, TVariables = void> {
	data: TData | undefined;
	error: TError | null;
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
}

/**
 * 기본 UseMutation 옵션 (공통 속성)
 * 간소화된 타입 파라미터: TVariables, TData, TError
 */
interface BaseUseMutationOptions<
	TVariables = any,
	TData = unknown,
	TError = FetchError<ApiErrorResponse>,
> {
	/**
	 * Mutation 실행 전 호출되는 콜백 (Optimistic Update 등에 사용)
	 * 반환값은 context로 다른 콜백에 전달됨
	 */
	onMutate?: (variables: TVariables) => Promise<any> | any;
	
	/**
	 * Mutation 성공 시 호출되는 콜백
	 */
	onSuccess?: (
		data: TData,
		variables: TVariables,
		context: any,
	) => Promise<void> | void;
	
	/**
	 * Mutation 실패 시 호출되는 콜백
	 */
	onError?: (error: TError, variables: TVariables, context: any) => Promise<void> | void;
	
	/**
	 * Mutation 완료 시 (성공/실패 무관) 호출되는 콜백
	 */
	onSettled?: (
		data: TData | undefined,
		error: TError | null,
		variables: TVariables,
		context: any,
	) => Promise<void> | void;
	
	/**
	 * Mutation 성공 시 무효화할 쿼리 키 목록
	 */
	invalidateQueries?:
		| string[][]
		| ((
				data: TData,
				variables: TVariables,
				context: any,
		  ) => string[][]);
	
	/**
	 * 추가 fetch 설정 (baseURL, headers, timeout 등)
	 */
	fetchConfig?: Omit<RequestConfig, "url" | "method" | "params" | "data" | "schema">;
	
	/**
	 * 요청 데이터 검증용 Zod 스키마 (선택적)
	 */
	requestSchema?: ZodType<TVariables>;
	
	/**
	 * 응답 데이터 검증용 Zod 스키마 (선택적)
	 */
	responseSchema?: ZodType<TData>;
	
	/**
	 * Mutation 에러 발생 시 Error Boundary로 전파할지 여부
	 * - boolean: true면 모든 에러를 Error Boundary로 전파
	 * - function: 조건부 전파 (예: (error) => error.response?.status >= 500)
	 * @default false
	 */
	throwOnError?: boolean | ((error: TError) => boolean);
}

/**
 * URL 기반 UseMutation 옵션
 */
interface UrlBasedUseMutationOptions<
	TVariables = any,
	TData = unknown,
	TError = FetchError<ApiErrorResponse>,
> extends BaseUseMutationOptions<TVariables, TData, TError> {
	/**
	 * API 요청 URL
	 */
	url: string | ((variables: TVariables) => string);

	/**
	 * HTTP 메서드 (Mutation 가능한 메서드만)
	 */
	method: MutationMethod;

	/**
	 * mutationFn이 있으면 안됨 (상호 배제)
	 */
	mutationFn?: never;
}

/**
 * Function 기반 UseMutation 옵션 (통일된 시그니처)
 */
interface FunctionBasedUseMutationOptions<
	TVariables = any,
	TData = unknown,
	TError = FetchError<ApiErrorResponse>,
> extends BaseUseMutationOptions<TVariables, TData, TError> {
	/**
	 * Custom mutation function - (variables, fetcher) 패턴 사용
	 */
	mutationFn: (variables: TVariables, fetcher: NextTypeFetch) => Promise<TData>;

	/**
	 * url/method가 있으면 안됨 (상호 배제)
	 */
	url?: never;
	method?: never;
}

/**
 * UseMutation 옵션
 * URL 방식 또는 Custom Function 방식 중 하나를 선택할 수 있음
 * 순서 변경: TVariables, TData, TError (사용 빈도 순)
 */
export type UseMutationOptions<
	TVariables = any,
	TData = unknown,
	TError = FetchError<ApiErrorResponse>,
> =
	| UrlBasedUseMutationOptions<TVariables, TData, TError>
	| FunctionBasedUseMutationOptions<TVariables, TData, TError>;

/**
 * UseMutation 결과 인터페이스 (단순화된 시그니처)
 */
export interface UseMutationResult<TData = unknown, TError = FetchError<ApiErrorResponse>, TVariables = any>
	extends MutationState<TData, TError, TVariables> {
	mutate: (
		variables: TVariables,
		options?: {
			onSuccess?: (data: TData, variables: TVariables, context: any) => void;
			onError?: (error: TError, variables: TVariables, context: any) => void;
			onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: any) => void;
		},
	) => void;
	mutateAsync: (
		variables?: TVariables,
		options?: {
			onSuccess?: (data: TData, variables: TVariables, context: any) => void;
			onError?: (error: TError, variables: TVariables, context: any) => void;
			onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: any) => void;
		},
	) => Promise<TData>;
	reset: () => void;
}

type MutationAction<TData, TError, TVariables> =
	| { type: "MUTATE"; variables: TVariables }
	| { type: "SUCCESS"; data: TData }
	| { type: "ERROR"; error: TError }
	| { type: "RESET" };

const getInitialState = <TData, TError, TVariables>(): MutationState<TData, TError, TVariables> => ({
	data: undefined,
	error: null,
	isPending: false,
	isSuccess: false,
	isError: false,
});

/**
 * useMutation 오버로드 선언
 * 새로운 순서: TVariables, TData, TError
 */

// 1. 가장 일반적인 사용: 2개 타입 파라미터 (Variables, Data)
export function useMutation<TVariables = any, TData = unknown>(
	options: UseMutationOptions<TVariables, TData>
): UseMutationResult<TData, FetchError, TVariables>;

// 2. 커스텀 에러 타입 포함: 3개 타입 파라미터
export function useMutation<
	TVariables = any,
	TData = unknown,
	TError = FetchError<ApiErrorResponse>,
>(
	options: UseMutationOptions<TVariables, TData, TError>
): UseMutationResult<TData, TError, TVariables>;

// 3. responseSchema가 명시적으로 제공될 때 (스키마에서 타입 추론)
export function useMutation<
	TVariables = any,
	ResponseSchema extends ZodType = ZodType,
	TError = FetchError<ApiErrorResponse>,
>(
	options: UseMutationOptions<TVariables, any, TError> & {
		responseSchema: ResponseSchema;
	},
): UseMutationResult<z.infer<ResponseSchema>, TError, TVariables>;

// 4. Factory 기반 (하위 호환성 유지, 순서는 새로운 방식)
export function useMutation<
	TVariables = any,
	TData = unknown,
	TError = FetchError<ApiErrorResponse>,
>(
	factoryConfig: MutationConfig<TVariables, TData, TError>,
	overrideOptions?: Partial<BaseUseMutationOptions<TVariables, TData, TError>>,
): UseMutationResult<TData, TError, TVariables>;

// 구현부
export function useMutation<
	TVariables = any,
	TData = unknown,
	TError = FetchError<ApiErrorResponse>,
>(
	configOrOptions:
		| MutationConfig<TVariables, TData, TError>
		| UseMutationOptions<TVariables, TData, TError>,
	overrideOptions?: Partial<BaseUseMutationOptions<TVariables, TData, TError>>,
): UseMutationResult<TData, TError, TVariables> {
	// Factory 기반인지 확인 (cacheKey 등 factory 특성이 있는지 확인)
	const isFactoryConfig = "url" in configOrOptions || "mutationFn" in configOrOptions;

	if (isFactoryConfig && overrideOptions) {
		// Factory 기반 + override options
		const factoryConfig = configOrOptions as MutationConfig<TVariables, TData, TError>;
		const mergedOptions = mergeMutationOptions(factoryConfig, overrideOptions);
		return _useMutationInternal(mergedOptions);
	} else {
		// Options 기반 또는 Factory 기반 (override 없음)
		return _useMutationInternal(configOrOptions as any);
	}
}

/**
 * Factory 옵션과 useMutation 옵션을 병합하는 함수
 */
function mergeMutationOptions<TVariables, TData, TError>(
	factoryConfig: MutationConfig<TVariables, TData, TError>,
	overrideOptions: Partial<BaseUseMutationOptions<TVariables, TData, TError>>,
): UseMutationOptions<TVariables, TData, TError> {
	// Factory 콜백들
	const factoryOnMutate = factoryConfig.onMutate;
	const factoryOnSuccess = factoryConfig.onSuccess;
	const factoryOnError = factoryConfig.onError;
	const factoryOnSettled = factoryConfig.onSettled;

	// Override 콜백들
	const overrideOnMutate = overrideOptions.onMutate;
	const overrideOnSuccess = overrideOptions.onSuccess;
	const overrideOnError = overrideOptions.onError;
	const overrideOnSettled = overrideOptions.onSettled;

	return {
		// Factory 기본 속성들
		...factoryConfig,

		// Override 옵션들로 덮어쓰기 (콜백 제외)
		...overrideOptions,

		// 콜백들은 양쪽 모두 실행하도록 병합
		onMutate: combinedCallback(factoryOnMutate, overrideOnMutate),
		onSuccess: combinedCallback(factoryOnSuccess, overrideOnSuccess),
		onError: combinedCallback(factoryOnError, overrideOnError),
		onSettled: combinedCallback(factoryOnSettled, overrideOnSettled),
	} as UseMutationOptions<TVariables, TData, TError>;
}

/**
 * 두 콜백을 결합하여 순서대로 실행하는 함수 생성
 */
function combinedCallback<T extends (...args: any[]) => any>(first?: T, second?: T): T | undefined {
	if (!first && !second) return undefined;
	if (!first) return second;
	if (!second) return first;

	return ((...args: Parameters<T>) => {
		// Factory 콜백 먼저 실행
		const firstResult = first(...args);
		// Override 콜백 실행
		const secondResult = second(...args);

		// Promise인 경우 체인으로 연결
		if (firstResult && typeof firstResult.then === "function") {
			return firstResult.then(() => secondResult);
		}

		return secondResult;
	}) as T;
}

/**
 * 내부 구현 함수
 */
function _useMutationInternal<
	TVariables = any,
	TData = unknown,
	TError = FetchError<ApiErrorResponse>,
>(options: UseMutationOptions<TVariables, TData, TError>): UseMutationResult<TData, TError, TVariables> {
	const queryClient = useQueryClient();
	const fetcher = queryClient.getFetcher();

	// 런타임 검증 (개발 환경에서만)
	if (process.env.NODE_ENV !== "production") {
		try {
			validateMutationConfig(options as any);
		} catch (error) {
			throw error; // 검증 실패 시 에러를 그대로 던짐
		}
	}

	// 통일된 시그니처 사용: 모든 mutation이 (variables, fetcher) 패턴 사용

	const [state, dispatch] = useReducer(
		(
			prevState: MutationState<TData, TError, TVariables>,
			action: MutationAction<TData, TError, TVariables>,
		): MutationState<TData, TError, TVariables> => {
			switch (action.type) {
				case "MUTATE":
					return {
						...prevState,
						isPending: true,
						isSuccess: false,
						isError: false,
						error: null,
					};
				case "SUCCESS":
					return {
						...prevState,
						isPending: false,
						isSuccess: true,
						isError: false,
						data: action.data,
						error: null,
					};
				case "ERROR":
					return {
						...prevState,
						isPending: false,
						isSuccess: false,
						isError: true,
						error: action.error,
					};
				case "RESET":
					return getInitialState();
				default:
					return prevState;
			}
		},
		getInitialState<TData, TError, TVariables>(),
	);

	const latestOptions = useRef(options);
	latestOptions.current = options;

	// Mutation 함수 생성
	const getMutationFn = useCallback(() => {
		if ("mutationFn" in options && options.mutationFn) {
			// 통일된 시그니처: 모든 mutationFn은 (variables, fetcher) 패턴을 사용
			return options.mutationFn;
		}

		// URL + Method 기반 mutation 함수 생성
		return async (variables: TVariables, fetcher: NextTypeFetch) => {
			const urlBasedOptions = options as UrlBasedUseMutationOptions<TVariables, TData, TError>;
			const url = isFunction(urlBasedOptions.url) ? urlBasedOptions.url(variables) : urlBasedOptions.url;
			const method = urlBasedOptions.method;

			// 요청 데이터 검증
			let dataForRequest: any = variables;
			if (options.requestSchema) {
				try {
					dataForRequest = options.requestSchema.parse(variables);
				} catch (e) {
					if (e instanceof z.ZodError) {
						const config = {
							url: url as string,
							method: method as MutationMethod,
							data: variables,
						} as RequestConfig;

						const fetchError = new FetchError(
							`Request validation failed: ${e.issues.map((issue) => issue.message).join(", ")}`,
							config,
							"ERR_VALIDATION",
						);

						fetchError.name = "ValidationError";
						fetchError.cause = e;
						(fetchError as any).isValidationError = true;
						throw fetchError;
					}
					throw e;
				}
			}

			const requestConfig: RequestConfig = merge(
				{ schema: options.responseSchema },
				// fetcher.defaults에서 baseURL을 가져와서 기본값으로 설정
				{ baseURL: fetcher.defaults.baseURL },
				options.fetchConfig || {},
				{
					url: url as string,
					method: method as any, // MutationMethod는 HttpMethod의 부분집합이므로 안전
					data: dataForRequest,
				},
			);

			const response = await fetcher.request(requestConfig);
			return response.data;
		};
	}, [options, fetcher]);

	const mutateCallback = useCallback(
		async (
			variables?: TVariables,
			mutateLocalOptions?: {
				onSuccess?: (data: TData, variables: TVariables, context: any) => void;
				onError?: (error: TError, variables: TVariables, context: any) => void;
				onSettled?: (
					data: TData | undefined,
					error: TError | null,
					variables: TVariables,
					context: any,
				) => void;
			},
		): Promise<TData> => {
			dispatch({ type: "MUTATE", variables: variables as TVariables });
			let context: any;

			try {
				// onMutate 콜백
				const onMutateCb = latestOptions.current.onMutate;
				if (onMutateCb) {
					context = await onMutateCb(variables as any);
				}

				// 실제 mutation 함수 실행
				const mutationFn = getMutationFn();
				const data = (await mutationFn(variables as TVariables, fetcher)) as TData;
				dispatch({ type: "SUCCESS", data });

				// onSuccess 콜백들 실행
				if (latestOptions.current.onSuccess) {
					await latestOptions.current.onSuccess(data, variables as any, context);
				}
				if (mutateLocalOptions?.onSuccess) {
					mutateLocalOptions.onSuccess(data, variables as any, context);
				}

				// invalidateQueries 처리
				const invalidateQueriesOption = latestOptions.current.invalidateQueries;
				if (invalidateQueriesOption) {
					let keysToInvalidate: string[][];

					if (isFunction(invalidateQueriesOption)) {
						keysToInvalidate = invalidateQueriesOption(data, variables as any, context) as string[][];
					} else {
						keysToInvalidate = invalidateQueriesOption as string[][];
					}

					if (isArray(keysToInvalidate)) {
						keysToInvalidate.forEach((queryKey) => {
							queryClient.invalidateQueries(queryKey);
						});
					}
				}

				// onSettled 콜백들 실행
				if (latestOptions.current.onSettled) {
					await latestOptions.current.onSettled(data, null, variables as any, context);
				}
				if (mutateLocalOptions?.onSettled) {
					mutateLocalOptions.onSettled(data, null, variables as any, context);
				}

				return data as TData;
			} catch (err) {
				const error = err as TError;
				dispatch({ type: "ERROR", error });

				// onError 콜백들 실행
				if (latestOptions.current.onError) {
					await latestOptions.current.onError(error, variables as any, context);
				}
				if (mutateLocalOptions?.onError) {
					mutateLocalOptions.onError(error, variables as any, context);
				}

				// onSettled 콜백들 실행
				if (latestOptions.current.onSettled) {
					await latestOptions.current.onSettled(undefined, error, variables as any, context);
				}
				if (mutateLocalOptions?.onSettled) {
					mutateLocalOptions.onSettled(undefined, error, variables as any, context);
				}

				// 항상 에러를 throw (throwOnError와 관계없이 mutateAsync는 에러를 throw해야 함)
				throw error;
			}
		},
		[getMutationFn, queryClient, fetcher],
	);

	const mutate = useCallback(
		(variables?: TVariables, localOptions?: any) => {
			mutateCallback(variables, localOptions).catch(() => {
				// 에러는 state에 저장되고 useEffect에서 처리됨
			});
		},
		[mutateCallback],
	);

	const mutateAsync = useCallback(
		(variables?: TVariables, localOptions?: any): Promise<TData> => {
			return mutateCallback(variables, localOptions);
		},
		[mutateCallback],
	);

	const reset = useCallback(() => {
		dispatch({ type: "RESET" });
	}, []);

	// Error Boundary로 에러 전파
	// React 18+에서는 useEffect에서 throw한 에러가 Error Boundary로 전파됨
	useEffect(() => {
		if (state.error && options.throwOnError) {
			const shouldThrow = typeof options.throwOnError === 'function'
				? options.throwOnError(state.error)
				: options.throwOnError;
			
			if (shouldThrow) {
				// Error Boundary로 에러 전파
				throw state.error;
			}
		}
		// state.error만 dependency에 포함 (options.throwOnError는 매번 변경될 수 있음)
	}, [state.error]);

	return {
		...state,
		mutate: mutate as any,
		mutateAsync: mutateAsync as any,
		reset,
	};
}
