import type { QueryClient } from "../../client/query-client";
import type { QueryState } from "../../cache/query-cache";
import type { QueryObserverOptions, QueryObserverResult } from "../types";
import { PlaceholderManager } from "./placeholder-manager";
import { isNil } from "es-toolkit/compat";

/**
 * Select 상태 추적을 위한 인터페이스 (함수 참조 기반)
 */
interface SelectState {
	selectFunction?: Function;
	selectDeps?: any[];
	lastResult?: any;
}

/**
 * QueryObserver 결과 계산기 클래스
 *
 * @description
 * QueryObserver의 결과 계산 로직을 담당합니다.
 * 캐시 상태, PlaceholderData, 초기 로딩 상태에 따라
 * 적절한 QueryObserverResult를 생성합니다.
 */
export class ResultComputer<T = unknown, E = unknown> {
	private queryClient: QueryClient;
	private placeholderManager: PlaceholderManager<T>;

	// Select 상태 추적 (TanStack Query 방식)
	private selectState: SelectState = {};

	constructor(queryClient: QueryClient, placeholderManager: PlaceholderManager<T>) {
		this.queryClient = queryClient;
		this.placeholderManager = placeholderManager;
	}

	/**
	 * 결과 계산
	 * 캐시 상태와 placeholderData를 완전히 분리하여 처리
	 */
	computeResult(cacheKey: string, options: QueryObserverOptions<T>, refetchFn: () => void): QueryObserverResult<T, E> {
		const { enabled = true } = options;
		const cached = this.queryClient.get<T>(cacheKey);

		// 1. enabled가 false인 경우: 비활성화된 상태 반환
		if (!enabled) {
			return this.createDisabledResult(cached, options, refetchFn);
		}

		// 2. 캐시된 데이터가 있는 경우
		if (this.hasCachedData(cached)) {
			return this.createCachedResult(cached!, options, refetchFn);
		}

		// 3. 캐시가 없는 경우: placeholderData 확인
		const placeholderData = this.placeholderManager.computePlaceholderData(options);
		if (this.placeholderManager.hasValidPlaceholderData(placeholderData)) {
			return this.createPlaceholderResult(placeholderData!, options, refetchFn);
		}

		// 4. 캐시도 placeholderData도 없는 경우: 초기 loading 상태
		return this.createInitialLoadingResult(refetchFn);
	}

	/**
	 * 비활성화된 결과 생성 (enabled: false)
	 */
	private createDisabledResult(
		cached: QueryState<T> | undefined,
		options: QueryObserverOptions<T>,
		refetchFn: () => void,
	): QueryObserverResult<T, E> {
		// enabled가 false일 때는 캐시된 데이터가 있어도 로딩하지 않는 상태
		if (cached) {
			const finalData = this.applySelect(cached.data, options);
			const isStale = this.computeStaleTime(cached.updatedAt, options);

			return {
				data: finalData,
				error: cached.error as E,
				isLoading: false, // enabled: false이므로 로딩하지 않음
				isFetching: false, // enabled: false이므로 fetch하지 않음
				isError: !!cached.error,
				isSuccess: this.isSuccessState(cached),
				isStale,
				isPlaceholderData: false,
				refetch: refetchFn,
			};
		}

		// 캐시도 없고 enabled도 false인 경우: 비활성화된 초기 상태
		this.placeholderManager.deactivatePlaceholder();

		return {
			data: undefined,
			error: undefined,
			isLoading: false, // enabled: false이므로 로딩하지 않음
			isFetching: false, // enabled: false이므로 fetch하지 않음
			isError: false,
			isSuccess: false,
			isStale: true,
			isPlaceholderData: false,
			refetch: refetchFn,
		};
	}

	/**
	 * 캐시된 데이터가 있는지 확인
	 */
	private hasCachedData(cached: QueryState<T> | undefined): boolean {
		return !!cached;
	}

	/**
	 * 캐시된 결과 생성
	 */
	private createCachedResult(
		cached: QueryState<T>,
		options: QueryObserverOptions<T>,
		refetchFn: () => void,
	): QueryObserverResult<T, E> {
		const finalData = this.applySelect(cached.data, options);
		const isStale = this.computeStaleTime(cached.updatedAt, options);

		return {
			data: finalData,
			error: cached.error as E,
			isLoading: cached.isLoading,
			isFetching: cached.isFetching, // 캐시된 상태의 isFetching 값 사용
			isError: !!cached.error,
			isSuccess: this.isSuccessState(cached),
			isStale,
			isPlaceholderData: false, // 캐시된 데이터는 항상 false
			refetch: refetchFn,
		};
	}

	/**
	 * PlaceholderData 결과 생성
	 */
	private createPlaceholderResult(
		placeholderData: any,
		options: QueryObserverOptions<T>,
		refetchFn: () => void,
	): QueryObserverResult<T, E> {
		// placeholderData가 있는 경우: success 상태로 시작
		this.placeholderManager.setPlaceholderState({
			data: placeholderData,
			isActive: true,
		});

		const finalData = this.applySelect(placeholderData as T, options);

		return {
			data: finalData,
			error: undefined,
			isLoading: false, // placeholderData는 success 상태
			isFetching: true, // 백그라운드에서 fetch 중
			isError: false,
			isSuccess: true,
			isStale: true,
			isPlaceholderData: true,
			refetch: refetchFn,
		};
	}

	/**
	 * 초기 로딩 결과 생성
	 */
	private createInitialLoadingResult(refetchFn: () => void): QueryObserverResult<T, E> {
		this.placeholderManager.deactivatePlaceholder();

		return {
			data: undefined,
			error: undefined,
			isLoading: true,
			isFetching: true,
			isError: false,
			isSuccess: false,
			isStale: true,
			isPlaceholderData: false,
			refetch: refetchFn,
		};
	}

	/**
	 * 성공 상태인지 확인
	 */
	private isSuccessState(cached: QueryState<T>): boolean {
		return !cached.isLoading && !cached.error && !isNil(cached.data);
	}

	/**
	 * select 함수 적용 (TanStack Query 방식 메모이제이션)
	 */
	private applySelect(data: T | React.ReactNode | undefined, options: QueryObserverOptions<T>): T | undefined {
		if (isNil(data) || !options.select) return data as T;

		// select 함수나 의존성이 변경되었는지 확인
		const shouldRecompute = this.shouldRecomputeSelect(options, data);

		if (!shouldRecompute && this.selectState.lastResult !== undefined) {
			return this.selectState.lastResult;
		}

		// 개발 환경에서 도움말 제공
		this.provideDevelopmentHelp(options);

		try {
			const result = options.select(data as T);

			// 새로운 상태 저장
			this.updateSelectState(options, result);

			return result;
		} catch {
			return data as T;
		}
	}

	/**
	 * select 함수나 의존성이 변경되어 재계산이 필요한지 확인 (TanStack Query 방식)
	 */
	private shouldRecomputeSelect(options: QueryObserverOptions<T>, data: T | React.ReactNode | undefined): boolean {
		const { select, selectDeps } = options;
		const { selectFunction, selectDeps: prevSelectDeps } = this.selectState;

		// 함수 참조가 변경된 경우 (TanStack Query 방식)
		if (select !== selectFunction) {
			return true;
		}

		// selectDeps가 변경된 경우
		if (selectDeps || prevSelectDeps) {
			return !this.areSelectDepsEqual(selectDeps, prevSelectDeps);
		}

		return false;
	}

	/**
	 * selectDeps 배열이 동일한지 비교
	 */
	private areSelectDepsEqual(currentDeps: any[] | undefined, prevDeps: any[] | undefined): boolean {
		if (currentDeps === prevDeps) return true;
		if (!currentDeps || !prevDeps) return false;
		if (currentDeps.length !== prevDeps.length) return false;

		return currentDeps.every((dep, index) => Object.is(dep, prevDeps[index]));
	}

	/**
	 * select 상태 업데이트
	 */
	private updateSelectState(options: QueryObserverOptions<T>, result: any): void {
		this.selectState = {
			selectFunction: options.select,
			selectDeps: options.selectDeps,
			lastResult: result,
		};
	}

	/**
	 * 개발 환경에서 도움말 제공
	 */
	private provideDevelopmentHelp(options: QueryObserverOptions<T>): void {
		if (process.env.NODE_ENV !== "production") {
			const { select, selectDeps } = options;
			const { selectFunction } = this.selectState;

			// Case 1: 인라인 함수이면서 selectDeps가 없는 경우
			if (this.isInlineFunction(select, selectFunction) && !selectDeps) {
				console.warn(
					"⚠️ next-unified-query: Select function recreated on every render.\n" +
						"Solution 1: Add selectDeps: [dependency1, dependency2]\n" +
						"Solution 2: Use useCallback with dependencies\n" +
						"Solution 3: Extract function outside component",
				);
			}

			// Case 2: 클로저 변수가 감지되는 경우
			if (this.hasClosureVariables(select) && !selectDeps) {
				console.warn(
					"💡 next-unified-query: Detected closure variables in select function.\n" +
						"Consider adding selectDeps to track dependencies:\n" +
						"selectDeps: [variable1, variable2]",
				);
			}
		}
	}

	/**
	 * 인라인 함수인지 감지 (함수 참조가 매번 변경되는지)
	 */
	private isInlineFunction(currentSelect?: Function, previousSelect?: Function): boolean {
		return currentSelect !== previousSelect && currentSelect?.toString() === previousSelect?.toString();
	}

	/**
	 * 클로저 변수 사용 패턴 감지 (간단한 휴리스틱)
	 */
	private hasClosureVariables(selectFunction?: Function): boolean {
		if (!selectFunction) return false;

		const functionString = selectFunction.toString();
		// 간단한 패턴 매칭: 함수 외부 변수 참조 패턴 감지
		const closurePatterns = [
			/\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*[.[]/, // 변수.property 또는 변수[key] 패턴
			/\?\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\./, // ?.variable. 패턴
		];

		return closurePatterns.some((pattern) => pattern.test(functionString));
	}

	/**
	 * Select 상태 정리 (QueryObserver에서 호출)
	 */
	clearSelectState(): void {
		this.selectState = {};
	}

	/**
	 * Stale 시간 계산
	 */
	private computeStaleTime(updatedAt: number, options: QueryObserverOptions<T>): boolean {
		return updatedAt ? Date.now() - updatedAt >= (options.staleTime || 0) : true;
	}
}
