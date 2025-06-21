import type { QueryClient } from "../../client/query-client";
import type { QueryState } from "../../cache/query-cache";
import type { QueryObserverOptions } from "../types";
import { isEqual, isNil } from "es-toolkit/compat";
import { isFunction } from "es-toolkit/predicate";

/**
 * PlaceholderData 상태 타입
 */
export interface PlaceholderState {
  data: any;
  isActive: boolean;
}

/**
 * PlaceholderData 관리자 클래스
 *
 * @description
 * placeholderData 처리를 담당합니다.
 * 캐시와 완전히 독립적으로 UI 레벨에서만 관리되며,
 * 이전 쿼리 데이터를 찾아서 placeholderData로 사용할 수 있습니다.
 */
export class PlaceholderManager<T = unknown> {
  private queryClient: QueryClient;
  private placeholderState: PlaceholderState | null = null;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * placeholderData 계산
   * 캐시와 완전히 독립적으로 처리
   */
  computePlaceholderData<T>(options: QueryObserverOptions<T>): any {
    const { placeholderData } = options;

    if (!placeholderData) return undefined;

    // 직접 값이 제공된 경우 (함수가 아닌 경우)
    if (!isFunction(placeholderData)) {
      return placeholderData;
    }

    // 함수인 경우: 이전 쿼리 데이터 찾기
    const prevQuery = this.findPreviousQuery(options);

    if (!prevQuery || prevQuery.data === undefined) return undefined;

    return placeholderData(prevQuery.data, prevQuery);
  }

  /**
   * 이전 쿼리 데이터 찾기
   * 같은 타입의 쿼리 중에서 가장 최근에 성공한 쿼리를 찾습니다.
   */
  private findPreviousQuery<T>(
    options: QueryObserverOptions<T>
  ): QueryState<T> | undefined {
    const allQueries = this.queryClient.getAll();
    const currentKey = options.key;

    let mostRecentQuery: QueryState<T> | undefined;
    let mostRecentTime = 0;

    for (const [keyStr, state] of Object.entries(allQueries)) {
      try {
        const keyArray = JSON.parse(keyStr);

        if (this.isValidPreviousQuery(keyArray, currentKey, state, options)) {
          const updatedAt = (state as QueryState<T>).updatedAt || 0;

          if (this.isMoreRecent(updatedAt, mostRecentTime)) {
            mostRecentQuery = state as QueryState<T>;
            mostRecentTime = updatedAt;
          }
        }
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }

    return mostRecentQuery;
  }

  /**
   * 유효한 이전 쿼리인지 확인
   */
  private isValidPreviousQuery<T>(
    keyArray: any,
    currentKey: readonly unknown[],
    state: any,
    options: QueryObserverOptions<T>
  ): boolean {
    return (
      this.isArrayKey(keyArray, options) &&
      this.isSameQueryType(keyArray, currentKey) &&
      this.isDifferentQueryKey(keyArray, currentKey) &&
      this.hasValidData(state)
    );
  }

  /**
   * 배열 키인지 확인
   */
  private isArrayKey<T>(
    keyArray: any,
    options: QueryObserverOptions<T>
  ): boolean {
    return Array.isArray(keyArray) && Array.isArray(options.key);
  }

  /**
   * 같은 쿼리 타입인지 확인 (첫 번째 키 요소로 판단)
   */
  private isSameQueryType(
    keyArray: any[],
    currentKey: readonly unknown[]
  ): boolean {
    return keyArray[0] === currentKey[0];
  }

  /**
   * 다른 쿼리 키인지 확인 (같은 키는 제외)
   */
  private isDifferentQueryKey(
    keyArray: any[],
    currentKey: readonly unknown[]
  ): boolean {
    return !isEqual(keyArray, currentKey);
  }

  /**
   * 유효한 데이터가 있는지 확인
   */
  private hasValidData<T>(state: any): boolean {
    return state && !isNil((state as QueryState<T>).data);
  }

  /**
   * 더 최근 데이터인지 확인
   */
  private isMoreRecent(updatedAt: number, mostRecentTime: number): boolean {
    return updatedAt > mostRecentTime;
  }

  /**
   * PlaceholderData가 유효한지 확인
   */
  hasValidPlaceholderData(placeholderData: any): boolean {
    return !isNil(placeholderData);
  }

  /**
   * PlaceholderState 설정
   */
  setPlaceholderState(state: PlaceholderState | null): void {
    this.placeholderState = state;
  }

  /**
   * PlaceholderState 가져오기
   */
  getPlaceholderState(): PlaceholderState | null {
    return this.placeholderState;
  }

  /**
   * PlaceholderData 비활성화 (fetch 성공 또는 실패 시)
   */
  deactivatePlaceholder(): void {
    this.placeholderState = null;
  }
}
