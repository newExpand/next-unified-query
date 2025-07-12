import type { QueryClient } from "../client/query-client";
import { serializeQueryKey } from "../cache/query-cache";
import { isEmpty } from "es-toolkit/compat";
import { TrackedResult, replaceEqualDeep } from "./utils";
import type { QueryObserverOptions, QueryObserverResult } from "./types";
import { PlaceholderManager, ResultComputer, FetchManager } from "./managers";

/**
 * Query Observer 클래스 - 쿼리 상태 관찰 및 관리
 *
 * @advanced 이 클래스는 고급 사용 케이스를 위한 저수준 API입니다.
 * 일반적인 사용에서는 useQuery React hook을 사용하는 것을 강력히 권장합니다.
 *
 * placeholderData는 캐시와 완전히 분리하여 UI 레벨에서만 관리합니다.
 *
 * @example
 * ```tsx
 * // ❌ 권장하지 않음 - 직접 QueryObserver 사용
 * import { QueryObserver } from 'next-unified-query';
 *
 * // ✅ 권장 - React hooks 사용
 * import { useQuery } from 'next-unified-query/react';
 * const { data, isLoading } = useQuery({ cacheKey: ['users'], url: '/users' });
 * ```
 */
export class QueryObserver<T = unknown, E = unknown> {
	private queryClient: QueryClient;
	private options: QueryObserverOptions<T>;
	private listeners = new Set<() => void>();
	private cacheKey: string;
	private isDestroyed = false;
	private currentResult: QueryObserverResult<T, E>;
	private optionsHash: string = "";

	// 결과 캐싱으로 불필요한 렌더링 방지
	private lastResultReference: QueryObserverResult<T, E> | null = null;

	// computeResult 메모이제이션을 위한 캐시
	private computeResultCache: {
		hash: string;
		result: QueryObserverResult<T, E>;
	} | null = null;

	// Tracked Properties
	private trackedResult: TrackedResult<T, E> | null = null;

	// Select 함수 내용 추적 및 메모이제이션
	private lastSelectFunctionContent: string | null = null;
	private selectFunctionChanged = false;

	// PlaceholderData 관리자 (지연 초기화)
	private placeholderManager: PlaceholderManager<T> | null;

	// 결과 계산기 (지연 초기화)
	private resultComputer: ResultComputer<T, E> | null;

	// Fetch 관리자 (지연 초기화)
	private fetchManager: FetchManager<T> | null;

	// Observer 시작 여부 플래그
	private isStarted = false;

	constructor(queryClient: QueryClient, options: QueryObserverOptions<T>) {
		this.queryClient = queryClient;
		this.options = options;
		this.cacheKey = serializeQueryKey(options.key);
		this.optionsHash = this.createOptionsHash(options);

		// 매니저들은 지연 초기화
		this.placeholderManager = null as any;
		this.resultComputer = null as any;
		this.fetchManager = null as any;

		// 캐시 변경 구독 먼저 설정
		this.subscribeToCache();

		// 초기 결과 계산 (placeholderData 고려)
		this.currentResult = this.computeResult();

		// 초기 fetch는 start() 메서드로 수동 시작
		// React 렌더링 중에는 fetch를 시작하지 않음
	}

	private subscribeToCache(): void {
		this.queryClient.subscribeListener(this.options.key, () => {
			if (!this.isDestroyed) {
				const hasChanged = this.updateResult();
				if (hasChanged) {
					this.scheduleNotifyListeners();
				}

				// invalidateQueries로 인한 무효화 감지 및 자동 refetch
				this.handlePotentialInvalidation();
			}
		});

		this.queryClient.subscribe(this.options.key);
	}

	/**
	 * invalidateQueries로 인한 무효화 감지 및 처리
	 * updatedAt이 0이면 invalidateQueries로 인한 무효화로 간주
	 */
	private handlePotentialInvalidation(): void {
		const { enabled = true } = this.options;

		if (!enabled) return;

		const cached = this.queryClient.get<T>(this.cacheKey);
		if (cached && cached.updatedAt === 0) {
			// invalidateQueries로 인한 무효화 감지
			// 현재 fetching 중이 아니고 로딩 중이 아닌 경우에만 refetch
			if (!cached.isFetching && !cached.isLoading) {
				this.fetchData();
			}
		}
	}

	/**
	 * 결과 계산
	 * 캐시 상태와 placeholderData를 완전히 분리하여 처리
	 */
	private computeResult(): QueryObserverResult<T, E> {
		// 매니저들 지연 초기화
		this.ensureManagersInitialized();

		// 메모이제이션: 캐시 상태와 옵션을 기반으로 한 해시 생성
		const cached = this.queryClient.get<T>(this.cacheKey);
		const selectDepsStr = JSON.stringify(this.options.selectDeps);
		const selectFnStr = this.options.select ? this.options.select.toString() : "null";
		const cacheHash = cached
			? `${this.cacheKey}:${cached.updatedAt}:${cached.isFetching}:${this.options.staleTime}:${this.options.enabled}:${selectDepsStr}:${selectFnStr}`
			: `${this.cacheKey}:null:${this.options.staleTime}:${this.options.enabled}:${selectDepsStr}:${selectFnStr}`;

		// 캐시된 결과가 있고 해시가 동일하면 재사용
		if (this.computeResultCache && this.computeResultCache.hash === cacheHash) {
			return this.computeResultCache.result;
		}

		// 새로운 결과 계산
		const result = this.resultComputer!.computeResult(this.cacheKey, this.options, () => {
			this.refetch();
		});

		// 결과 캐싱
		this.computeResultCache = {
			hash: cacheHash,
			result,
		};

		return result;
	}

	/**
	 * Tracked Properties 기반 결과 업데이트
	 * 기본적으로 tracked 모드로 동작
	 */
	private updateResult(): boolean {
		const newResult = this.computeResult();

		// Structural Sharing 적용
		const optimizedResult = this.applyStructuralSharing(newResult);

		// 'tracked' 모드: 실제 사용된 속성만 확인
		if (this.hasChangeInTrackedProps(optimizedResult)) {
			this.currentResult = optimizedResult;
			this.lastResultReference = optimizedResult;
			// 결과가 변경되면 computeResult 캐시도 초기화
			this.computeResultCache = null;
			return true;
		}

		return false;
	}

	/**
	 * Structural Sharing 적용
	 */
	private applyStructuralSharing(newResult: QueryObserverResult<T, E>): QueryObserverResult<T, E> {
		if (!this.lastResultReference) {
			return newResult;
		}

		return replaceEqualDeep(this.lastResultReference, newResult);
	}

	private hasChangeInTrackedProps(newResult: QueryObserverResult<T, E>): boolean {
		// 초기 상태 확인
		if (this.isInitialState()) {
			return true;
		}

		const trackedProps = this.trackedResult!.getTrackedProps();

		// 추적된 속성이 없으면 초기 상태로 간주
		if (this.hasNoTrackedProperties(trackedProps)) {
			return true;
		}

		// 추적된 속성 중 변경된 것이 있는지 확인
		return this.hasTrackedPropertyChanged(trackedProps, newResult);
	}

	private isInitialState(): boolean {
		return !this.lastResultReference || !this.trackedResult;
	}

	private hasNoTrackedProperties(trackedProps: Set<keyof QueryObserverResult<T, E>>): boolean {
		return isEmpty(trackedProps);
	}

	private hasTrackedPropertyChanged(
		trackedProps: Set<keyof QueryObserverResult<T, E>>,
		newResult: QueryObserverResult<T, E>,
	): boolean {
		for (const prop of trackedProps) {
			if (this.lastResultReference![prop] !== newResult[prop]) {
				return true;
			}
		}
		return false;
	}

	private async executeFetch(onComplete?: () => void): Promise<void> {
		this.ensureManagersInitialized();
		await this.fetchManager!.executeFetch(this.cacheKey, this.options, onComplete);
	}

	/**
	 * 초기 fetch 실행 - 캐시 상태를 확인하고 필요한 경우에만 fetch
	 */
	private async executeInitialFetch(): Promise<void> {
		const isEnabled = this.isQueryEnabled();
		if (!isEnabled) {
			return;
		}

		// 캐시 상태를 한 번만 확인
		const hasCached = this.queryClient.has(this.cacheKey);

		const isServer = this.isServerSide();
		if (isServer) {
			// 서버에서는 캐시가 있으면 fetch 하지 않음
			return;
		}

		if (!hasCached) {
			// 캐시가 없는 경우: 초기 상태는 이미 computeResult()에서 처리됨
			// 여기서는 fetch만 시작
			try {
				// 초기 fetch는 onComplete 없이 실행 (subscribeToCache만 사용)
				await this.executeFetch();
			} catch (error) {
				console.error("executeFetch error:", error);
			}
			return;
		}

		// 캐시가 있는 경우: handleCachedDataAvailable을 호출하여
		// stale 체크 및 백그라운드 fetch 처리
		this.handleCachedDataAvailable();
	}

	/**
	 * 쿼리가 활성화되어 있는지 확인
	 */
	private isQueryEnabled(): boolean {
		return this.options.enabled !== false;
	}

	/**
	 * 서버사이드 환경인지 확인
	 */
	private isServerSide(): boolean {
		return typeof window === "undefined";
	}

	/**
	 * 캐시가 stale 상태인지 확인
	 */
	private isCacheStale(cached: any): boolean {
		const { staleTime = 0 } = this.options;
		return Date.now() - cached.updatedAt >= staleTime;
	}

	private async fetchData(): Promise<void> {
		this.ensureManagersInitialized();
		try {
			await this.fetchManager!.fetchData(this.cacheKey, this.options);
			// fetchData 완료 후 캐시가 업데이트되면 subscribeToCache 콜백이 자동 호출됨
			// 중복 알림 방지를 위해 여기서는 직접 updateResult를 호출하지 않음
		} catch (error) {
			console.error("fetchData error:", error);
			// 에러의 경우에도 fetchManager가 캐시를 업데이트하므로
			// subscribeToCache 콜백이 자동으로 호출됨
		}
	}

	private notifyListeners(): void {
		this.listeners.forEach((listener) => listener());
	}

	/**
	 * 결과 구독 (React 컴포넌트에서 사용)
	 */
	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	/**
	 * Tracked Properties가 적용된 현재 결과 반환
	 * TrackedResult 인스턴스를 재사용하여 속성 추적을 유지
	 */
	getCurrentResult(): QueryObserverResult<T, E> {
		this.ensureTrackedResultExists();
		return this.trackedResult!.createProxy();
	}

	/**
	 * TrackedResult 인스턴스가 존재하고 최신 상태인지 확인
	 */
	private ensureTrackedResultExists(): void {
		if (!this.trackedResult) {
			this.createNewTrackedResult();
		} else if (this.isTrackedResultOutdated()) {
			this.updateTrackedResult();
		}
	}

	/**
	 * 새로운 TrackedResult 인스턴스 생성
	 */
	private createNewTrackedResult(): void {
		this.trackedResult = new TrackedResult(this.currentResult);
	}

	/**
	 * TrackedResult가 구식인지 확인
	 */
	private isTrackedResultOutdated(): boolean {
		return this.trackedResult!.getResult() !== this.currentResult;
	}

	/**
	 * TrackedResult를 최신 결과로 업데이트
	 */
	private updateTrackedResult(): void {
		this.trackedResult!.updateResult(this.currentResult);
	}

	/**
	 * Observer 시작 - React useEffect에서 호출
	 * 렌더링과 분리하여 안전하게 초기 fetch 시작
	 */
	start(): void {
		if (this.isStarted) {
			return;
		}

		this.isStarted = true;

		// 최적화된 초기 fetch 시작 (queueMicrotask 사용)
		queueMicrotask(async () => {
			try {
				await this.executeInitialFetch();
			} catch (error) {
				console.error("executeInitialFetch error:", error);
			}
		});
	}

	/**
	 * 수동 refetch
	 * force 옵션이 true인 경우 staleTime을 무시하고 강제로 페칭합니다.
	 */
	refetch(force: boolean = true): void {
		this.ensureManagersInitialized();
		this.fetchManager!.refetch(
			this.cacheKey,
			this.options,
			() => {
				// refetch 완료 후 결과 업데이트 및 리스너 알림
				const hasChanged = this.updateResult();
				if (hasChanged) {
					this.scheduleNotifyListeners();
				}
			},
			force,
		);
	}

	/**
	 * 옵션 업데이트 최적화
	 */
	setOptions(options: QueryObserverOptions<T>): void {
		const prevKey = this.cacheKey;
		const prevHash = this.optionsHash;
		const prevEnabled = this.options.enabled;
		const prevSelectFunction = this.options.select;
		const newHash = this.createOptionsHash(options);

		// Select 함수 내용 변경 감지
		const currentSelectContent = options.select ? options.select.toString() : null;
		this.selectFunctionChanged = this.lastSelectFunctionContent !== currentSelectContent;
		this.lastSelectFunctionContent = currentSelectContent;

		if (prevHash === newHash && !this.selectFunctionChanged) {
			// 해시가 동일하고 select 함수도 동일하면 옵션만 업데이트
			this.options = options;
			return;
		}

		if (prevHash === newHash && this.selectFunctionChanged) {
			// 해시는 동일하지만 select 함수만 변경된 경우
			this.options = options;
			// Select 함수 변경으로 인한 결과 재계산
			this.invalidateSelectRelatedCaches();
			const hasChanged = this.updateResult();
			if (hasChanged) {
				this.scheduleNotifyListeners();
			}
			return;
		}

		const prevOptions = this.options;
		this.options = options;
		this.cacheKey = serializeQueryKey(options.key);
		this.optionsHash = newHash;

		// enabled 상태 변경 감지
		const enabledChanged = prevEnabled !== options.enabled;

		if (prevKey !== this.cacheKey) {
			this.ensureManagersInitialized();
			this.handleKeyChange(prevOptions);
		} else {
			this.handleOptionsChange(enabledChanged, prevEnabled, options.enabled);
		}
	}

	/**
	 * 키 변경 처리
	 */
	private handleKeyChange(prevOptions: QueryObserverOptions<T>): void {
		this.trackedResult = null;

		// 이전 구독 해제
		this.queryClient.unsubscribe(prevOptions.key, prevOptions.gcTime || 300000);

		// PlaceholderData 초기화
		if (this.placeholderManager) {
			this.placeholderManager.deactivatePlaceholder();
		}

		// 새 키로 구독
		this.subscribeToCache();

		// 캐시 상태에 따른 처리
		if (this.queryClient.has(this.cacheKey)) {
			this.handleCachedDataAvailable();
		} else {
			this.handleNoCachedData();
		}
	}

	/**
	 * 옵션 변경 처리
	 */
	private handleOptionsChange(
		enabledChanged: boolean,
		prevEnabled: boolean | undefined,
		newEnabled: boolean | undefined,
	): void {
		// 키는 같지만 다른 옵션이 변경된 경우
		const hasChanged = this.updateResult();
		if (hasChanged) {
			this.scheduleNotifyListeners();
		}

		// enabled가 false에서 true로 변경된 경우 fetch 시도
		if (enabledChanged && prevEnabled === false && newEnabled === true && this.isStarted) {
			queueMicrotask(async () => {
				try {
					const cached = this.queryClient.get<T>(this.cacheKey);
					const hasCached = !!cached;

					if (!hasCached) {
						// 캐시가 없는 경우: 초기 로딩 상태 설정
						this.queryClient.set(this.cacheKey, {
							data: undefined,
							error: undefined,
							isLoading: true,
							isFetching: true,
							updatedAt: 0,
						});
					} else if (this.isCacheStale(cached)) {
						// 캐시가 있지만 stale인 경우: fetching 상태로 업데이트
						this.queryClient.set(this.cacheKey, {
							...cached,
							isFetching: true,
						});
					}

					// enabled 변경 시에는 onComplete 콜백 사용 (즉시 완료 알림을 위해)
					await this.executeFetch(() => {
						// fetch 완료 후 결과 업데이트 및 리스너 알림
						const hasChanged = this.updateResult();
						if (hasChanged) {
							this.scheduleNotifyListeners();
						}
					});
				} catch (error) {
					console.error("executeFetch error after enabled change:", error);
				}
			});
		}
	}

	private handleCachedDataAvailable(): void {
		// 캐시된 데이터가 있는 경우: 즉시 결과 업데이트, stale인 경우에만 백그라운드 fetch
		const hasChanged = this.updateResult();

		// 캐시 조회를 한 번만 수행
		const cached = this.queryClient.get<T>(this.cacheKey);
		if (this.shouldStartBackgroundFetch(cached)) {
			this.startBackgroundFetch(cached);
		} else {
		}

		// 변경사항이 있을 때만 알림
		if (hasChanged) {
			this.scheduleNotifyListeners();
		}
	}

	/**
	 * 백그라운드 fetch를 시작해야 하는지 확인
	 */
	private shouldStartBackgroundFetch(cached: any): boolean {
		if (!cached || this.options.enabled === false) {
			return false;
		}

		return this.isCacheStale(cached);
	}

	/**
	 * 백그라운드 fetch 시작
	 */
	private startBackgroundFetch(cached: any): void {
		// 캐시 상태를 fetching으로 업데이트
		this.queryClient.set(this.cacheKey, {
			...cached,
			isFetching: true,
		});

		// 백그라운드에서 fetch 수행
		this.executeFetch();
	}

	private handleNoCachedData(): void {
		// 캐시가 없는 경우: placeholderData 사용 가능
		const hasChanged = this.updateResult();

		if (hasChanged) {
			this.scheduleNotifyListeners();
		}

		this.executeFetch();
	}

	private scheduleNotifyListeners(): void {
		// React 렌더링 중 setState 방지를 위해 마이크로태스크로 지연
		queueMicrotask(() => {
			if (!this.isDestroyed) {
				this.notifyListeners();
			}
		});
	}

	/**
	 * 매니저들이 초기화되었는지 확인하고 필요한 경우 초기화
	 */
	private ensureManagersInitialized(): void {
		if (!this.placeholderManager) {
			this.placeholderManager = new PlaceholderManager<T>(this.queryClient);
			this.resultComputer = new ResultComputer(this.queryClient, this.placeholderManager);
			this.fetchManager = new FetchManager(this.queryClient, this.placeholderManager);
		}
	}

	/**
	 * 옵션 해시 생성
	 * Select 함수는 내용 기반으로 해시 생성
	 */
	private createOptionsHash(options: QueryObserverOptions<T>): string {
		const hashableOptions = {
			key: options.key,
			url: options.url,
			params: options.params,
			enabled: options.enabled,
			staleTime: options.staleTime,
			gcTime: options.gcTime,
			// Select 함수 내용을 해시에 포함 (함수 내용이 같으면 같은 해시)
			selectFnContent: options.select ? options.select.toString() : null,
			selectDeps: options.selectDeps,
		};
		return JSON.stringify(hashableOptions);
	}

	/**
	 * Select 함수 관련 캐시 무효화
	 */
	private invalidateSelectRelatedCaches(): void {
		// computeResult 캐시 무효화
		this.computeResultCache = null;

		// ResultComputer의 select 캐시도 무효화 (ResultComputer에서 구현 예정)
		if (this.resultComputer) {
			this.resultComputer.clearSelectState();
		}
	}

	/**
	 * Observer 정리
	 */
	destroy(): void {
		this.isDestroyed = true;
		this.queryClient.unsubscribe(this.options.key, this.options.gcTime || 300000);
		this.listeners.clear();
		if (this.placeholderManager) {
			this.placeholderManager.deactivatePlaceholder();
		}
		if (this.resultComputer) {
			this.resultComputer.clearSelectState();
		}
		this.lastResultReference = null;
		this.trackedResult = null;
		this.computeResultCache = null;
		this.lastSelectFunctionContent = null;
		this.selectFunctionChanged = false;
	}
}
