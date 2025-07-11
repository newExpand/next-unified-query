/**
 * 공정한 라이브러리 벤치마크를 위한 공용 설정
 * 모든 벤치마크 테스트에서 동일한 조건을 사용하여 공정한 비교를 보장합니다.
 */

export interface PerformanceData {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  delay: number;
}

/**
 * 모든 라이브러리에서 동일하게 사용할 고정된 쿼리 설정
 * 랜덤값 대신 고정된 지연 시간을 사용하여 재현 가능한 테스트를 보장
 */
export const FIXED_QUERY_CONFIGS = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  // 고정된 지연 패턴: 0-99ms를 순차적으로 분배
  delay: (i * 7) % 100, // 7씩 증가하여 0-99 범위에서 균등 분포
}));

/**
 * 모든 라이브러리에서 사용할 공통 캐시 설정
 */
export const COMMON_CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000,  // 5분
  gcTime: 10 * 60 * 1000,    // 10분 (TanStack Query의 gcTime, SWR의 경우 다른 방식 적용)
} as const;

/**
 * 공통 API 엔드포인트 설정
 */
export const API_CONFIG = {
  endpoint: '/api/performance-data',
  params: {
    type: 'concurrent',
    size: 'small'
  }
} as const;

/**
 * 성능 측정을 위한 공통 유틸리티
 */
export class PerformanceTracker {
  private startTime: number = 0;
  private queryTimes: number[] = [];
  
  start() {
    this.startTime = performance.now();
    this.queryTimes = [];
  }
  
  recordQuery(responseTime: number) {
    this.queryTimes.push(responseTime);
  }
  
  getResults() {
    const totalTime = performance.now() - this.startTime;
    const averageTime = this.queryTimes.length > 0 
      ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length 
      : 0;
    const cacheHits = this.queryTimes.filter(time => time < 10).length;
    
    return {
      totalTime,
      averageTime,
      cacheHits,
      completed: this.queryTimes.length,
    };
  }
}

/**
 * 모든 라이브러리에서 사용할 공통 fetcher 함수
 * HTTP 클라이언트를 통일하여 순수한 라이브러리 성능 비교
 */
export const commonFetcher = async (url: string): Promise<PerformanceData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

/**
 * 쿼리 URL 생성 헬퍼
 */
export const buildQueryUrl = (id: number, delay: number) => {
  const params = new URLSearchParams({
    id: id.toString(),
    delay: delay.toString(),
    ...API_CONFIG.params
  });
  return `${API_CONFIG.endpoint}?${params.toString()}`;
};