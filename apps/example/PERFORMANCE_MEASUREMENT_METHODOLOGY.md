# 성능 측정 방법론

## 개요

이 문서는 Next Unified Query, SWR, TanStack Query 간의 공정한 성능 비교를 위한 표준화된 측정 방법론을 설명합니다.

## 표준화 이전 문제점

### 1. 타이밍 로직 불일치
- **SWR**: `isValidating` 상태 변화로 완료 감지
- **TanStack Query**: `isFetching` 상태 변화로 완료 감지
- **Next Unified Query**: `isFetching` 상태 변화로 완료 감지

### 2. 캐시 히트 감지 차이
- 동일한 10ms 임계값 사용하지만 측정 시점 차이
- 상태 관리 방식에 따른 타이밍 차이

### 3. Window Stats 노출 불일치
- 각 라이브러리별 다른 네이밍 규칙
- 구조적 차이로 인한 비교 어려움

## 표준화 솔루션

### 1. 통합된 성능 측정 헬퍼 (`shared-config.ts`)

#### StandardizedPerformanceTracker
```typescript
export class StandardizedPerformanceTracker {
  // 모든 라이브러리에서 동일한 성능 측정 로직 제공
  start(): void
  recordQuery(success: boolean, responseTime: number): void
  getStandardizedStats(): StandardizedPerformanceStats
  stop(): void
}
```

#### QueryCompletionTracker
```typescript
export class QueryCompletionTracker {
  // 라이브러리별 상태 관리 방식과 무관하게 동일한 완료 감지
  updateAndCheckCompletion(
    enabled: boolean,
    data: any,
    error: any,
    isFetching?: boolean,    // TanStack Query, Next Unified Query
    isValidating?: boolean   // SWR
  ): { completed: boolean; duration: number; success: boolean } | null
}
```

### 2. 표준화된 성능 통계 구조

```typescript
export interface StandardizedPerformanceStats {
  completed: number;      // 완료된 쿼리 수
  successful: number;     // 성공한 쿼리 수
  failed: number;         // 실패한 쿼리 수
  totalTime: number;      // 전체 실행 시간 (ms)
  averageTime: number;    // 평균 응답 시간 (ms)
  cacheHits: number;      // 캐시 히트 수 (10ms 미만)
}
```

### 3. 통일된 Window Stats 노출

```typescript
export const exposeStandardizedStats = (
  libraryName: 'SWR' | 'TANSTACK_QUERY' | 'NEXT_UNIFIED_QUERY',
  stats: StandardizedPerformanceStats
): void => {
  // 각 라이브러리 고유 stats
  window[`__${libraryName}_PERFORMANCE_STATS__`] = stats;
  
  // 공통 벤치마크 stats
  window.__BENCHMARK_PERFORMANCE_STATS__ = {
    ...stats,
    library: libraryName,
    timestamp: Date.now(),
  };
}
```

## 측정 방법론

### 1. 쿼리 완료 감지 로직

```typescript
// 공통 완료 조건
const wasLoading = this.wasFetching || this.wasValidating;
const isCurrentlyLoading = currentFetching || currentValidating;
const hasResult = data || error;

if (wasLoading && !isCurrentlyLoading && hasResult) {
  // 완료 감지
  return { completed: true, duration, success: !!data && !error };
}
```

### 2. 성능 메트릭 계산

- **총 실행 시간**: `performance.now()`를 사용한 정확한 측정
- **평균 응답 시간**: 개별 쿼리 시간의 산술 평균
- **캐시 히트**: 10ms 미만 응답 시간을 캐시 히트로 간주
- **성공률**: 에러 없이 완료된 쿼리 비율

### 3. 테스트 조건 통일

#### 공통 설정 (`shared-config.ts`)
```typescript
export const FIXED_QUERY_CONFIGS = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  delay: (i * 7) % 100, // 0-99ms 균등 분포
}));

export const COMMON_CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000,  // 5분
  gcTime: 10 * 60 * 1000,    // 10분
};
```

#### 공통 Fetcher
```typescript
export const commonFetcher = async (url: string): Promise<PerformanceData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};
```

## E2E 테스트 검증

### 1. 표준화된 통계 검증
```typescript
// 각 라이브러리별 고유 stats와 공통 benchmark stats 일치성 검증
expect(performanceMetrics.standardized.library).toBe('SWR');
expect(performanceMetrics.standardized.completed).toBe(100);
expect(performanceMetrics.standardized.successful).toBe(performanceMetrics.successful);
```

### 2. 성능 기준 검증
- **실행 시간**: 워밍업 후 실제 처리 시간만 측정
- **성공률**: 100% 성공 보장
- **응답 시간**: 개발 환경 고려한 합리적 임계값

## 공정한 비교 보장

### 1. 동일한 테스트 조건
- 100개 고정 쿼리 (ID 1-100)
- 0-99ms 균등 분포 지연
- 동일한 API 엔드포인트
- 동일한 캐시 설정

### 2. 동일한 측정 로직
- 표준화된 완료 감지
- 통일된 성능 계산
- 일관된 캐시 히트 기준

### 3. 동일한 검증 기준
- E2E 테스트 일관성
- 성능 임계값 통일
- 에러 처리 표준화

## 결론

이 표준화된 성능 측정 방법론을 통해:

1. **공정한 비교**: 모든 라이브러리가 동일한 조건에서 측정
2. **정확한 측정**: 라이브러리별 상태 관리 차이 극복
3. **일관된 검증**: E2E 테스트를 통한 자동화된 검증
4. **신뢰할 수 있는 결과**: 표준화된 메트릭으로 객관적 비교

이를 통해 Next Unified Query, SWR, TanStack Query 간의 진정한 성능 차이를 정확히 측정할 수 있습니다.