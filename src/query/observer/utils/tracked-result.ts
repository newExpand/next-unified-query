import type { QueryObserverResult } from "../types";

/**
 * Tracked Properties 구현
 * Proxy를 사용하여 실제 사용된 속성만 추적
 */
export class TrackedResult<T = unknown, E = unknown> {
  private trackedProps = new Set<keyof QueryObserverResult<T, E>>();
  private result: QueryObserverResult<T, E>;
  private cachedProxy: QueryObserverResult<T, E> | null = null;

  constructor(result: QueryObserverResult<T, E>) {
    this.result = result;
  }

  createProxy(): QueryObserverResult<T, E> {
    // 이미 캐시된 Proxy가 있으면 재사용
    if (this.cachedProxy) {
      return this.cachedProxy;
    }

    this.cachedProxy = new Proxy(this.result, {
      get: (target, prop) => {
        // 속성 접근 추적 - 유효한 프로퍼티만 추적
        if (typeof prop === "string" && prop in target) {
          this.trackedProps.add(prop as keyof QueryObserverResult<T, E>);
        }
        return target[prop as keyof QueryObserverResult<T, E>];
      },
    });

    return this.cachedProxy;
  }

  getTrackedProps(): Set<keyof QueryObserverResult<T, E>> {
    return this.trackedProps;
  }

  hasTrackedProp(prop: keyof QueryObserverResult<T, E>): boolean {
    return this.trackedProps.has(prop);
  }

  getResult(): QueryObserverResult<T, E> {
    return this.result;
  }

  // 결과가 변경될 때 캐시 무효화
  updateResult(newResult: QueryObserverResult<T, E>): void {
    this.result = newResult;
    this.cachedProxy = null; // 캐시 무효화
  }
}
