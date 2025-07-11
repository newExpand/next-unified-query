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

/**
 * 통합된 성능 측정 헬퍼 클래스
 * 모든 라이브러리에서 동일한 성능 측정 로직을 사용하여 공정한 비교를 보장
 */
export interface StandardizedPerformanceStats {
  completed: number;
  successful: number;
  failed: number;
  totalTime: number;
  averageTime: number;
  cacheHits: number;
}

export class StandardizedPerformanceTracker {
  private startTime: number = 0;
  private queryTimes: number[] = [];
  private queryResults: Array<{ success: boolean; time: number }> = [];
  private isTracking: boolean = false;
  private networkRequestTimes: number[] = [];  // 실제 네트워크 요청 시간 추적
  private cacheHitTimes: number[] = [];        // 캐시 히트 시간 추적

  /**
   * 성능 측정 시작
   */
  start(): void {
    this.startTime = performance.now();
    this.queryTimes = [];
    this.queryResults = [];
    this.isTracking = true;
  }

  /**
   * 개별 쿼리 완료 기록
   */
  recordQuery(success: boolean, responseTime: number): void {
    if (!this.isTracking) return;
    
    this.queryTimes.push(responseTime);
    this.queryResults.push({ success, time: responseTime });
    
    // 네트워크 요청 vs 캐시 히트 분류
    if (responseTime > 50) {
      this.networkRequestTimes.push(responseTime);
    } else {
      this.cacheHitTimes.push(responseTime);
    }
  }

  /**
   * 성능 측정 중단
   */
  stop(): void {
    this.isTracking = false;
  }

  /**
   * 표준화된 성능 통계 반환 (기존 호환성)
   */
  getStandardizedStats(): StandardizedPerformanceStats {
    const totalTime = this.isTracking ? performance.now() - this.startTime : 0;
    const successful = this.queryResults.filter(r => r.success).length;
    const failed = this.queryResults.filter(r => !r.success).length;
    const averageTime = this.queryTimes.length > 0 
      ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length 
      : 0;
    
    // 캐시 히트: 10ms 미만 응답 (기존 기준 유지)
    const cacheHits = this.queryTimes.filter(time => time < 10).length;
    
    return {
      completed: this.queryResults.length,
      successful,
      failed,
      totalTime,
      averageTime,
      cacheHits,
    };
  }
  
  /**
   * 고급 다층적 성능 메트릭 반환
   */
  getAdvancedMetrics(libraryType: 'SWR' | 'TANSTACK_QUERY' | 'NEXT_UNIFIED_QUERY'): AdvancedPerformanceMetrics {
    const basic = this.getStandardizedStats();
    const totalTime = this.isTracking ? performance.now() - this.startTime : 0;
    
    // A. 사용자 체감 성능
    const immediateDisplay = this.queryTimes.filter(time => time < 10).length;
    const fastResponse = this.queryTimes.filter(time => time < 50).length;
    const timeToFirstData = this.queryTimes.length > 0 ? Math.min(...this.queryTimes) : 0;
    
    // B. 네트워크 효율성
    const actualNetworkRequests = this.queryTimes.filter(time => time > 50).length;
    const backgroundUpdates = libraryType === 'SWR' ? 
      this.queryTimes.filter(time => time > 10 && time < 100).length : 0;
    
    // C. 라이브러리별 특화 메트릭
    let librarySpecific: any = {};
    
    switch (libraryType) {
      case 'SWR':
        librarySpecific.staleWhileRevalidateEfficiency = {
          immediateStaleServed: immediateDisplay,
          backgroundUpdateSpeed: backgroundUpdates > 0 ? 
            this.queryTimes.filter(time => time > 10 && time < 100)
              .reduce((a, b) => a + b, 0) / backgroundUpdates : 0,
          stalenessAcceptability: this.queryTimes.length > 0 ? immediateDisplay / this.queryTimes.length : 0
        };
        break;
        
      case 'TANSTACK_QUERY':
        // TanStack Query는 staleTime 내에서 즉시 캐시 반환 (첫 실행 대비 상당한 성능 향상)
        // 50ms 미만은 캐시에서 온 것으로 간주 (네트워크 요청은 보통 100ms 이상)
        const cacheThreshold = 50;
        librarySpecific.conditionalCacheEfficiency = {
          intelligentCacheHits: this.queryTimes.filter(time => time < cacheThreshold).length,
          conditionalRefetches: this.queryTimes.filter(time => time >= cacheThreshold).length,
          staleTimeRespected: this.queryTimes.length > 0 ? fastResponse / this.queryTimes.length : 0
        };
        break;
        
      case 'NEXT_UNIFIED_QUERY':
        librarySpecific.absoluteCacheEfficiency = {
          trueCacheHits: immediateDisplay,
          zeroNetworkRequests: immediateDisplay,
          cacheConsistency: this.queryTimes.length > 0 ? immediateDisplay / this.queryTimes.length : 0
        };
        break;
    }
    
    return {
      userExperience: {
        timeToFirstData,
        immediateDisplay,
        fastResponse,
        userPerceivedLoadingTime: basic.averageTime
      },
      networkEfficiency: {
        actualNetworkRequests,
        backgroundUpdates,
        cacheMisses: this.queryTimes.length - immediateDisplay,
        bandwidthSaved: immediateDisplay * 1024 // 1KB 추정 절약
      },
      librarySpecific,
      basic
    };
  }

  /**
   * 진행 상황 반환
   */
  getProgress(): number {
    return Math.min((this.queryResults.length / 100) * 100, 100);
  }

  /**
   * 완료 여부 확인
   */
  isCompleted(): boolean {
    return this.queryResults.length >= 100;
  }

  /**
   * 상태 초기화
   */
  reset(): void {
    this.startTime = 0;
    this.queryTimes = [];
    this.queryResults = [];
    this.networkRequestTimes = [];
    this.cacheHitTimes = [];
    this.isTracking = false;
  }
}

/**
 * 표준화된 쿼리 완료 감지 헬퍼
 * 각 라이브러리의 상태 관리 방식에 관계없이 동일한 로직으로 완료를 감지
 */
export class QueryCompletionTracker {
  private startTime: number = 0;
  private hasCompleted: boolean = false;
  private wasEnabled: boolean = false;
  private wasFetching: boolean = false;
  private wasValidating: boolean = false;

  /**
   * 쿼리 추적 시작
   */
  startTracking(enabled: boolean): void {
    if (enabled && !this.hasCompleted && !this.startTime) {
      this.startTime = performance.now();
    }
    this.wasEnabled = enabled;
  }

  /**
   * 상태 업데이트 및 완료 감지
   * @param enabled 쿼리 활성화 상태
   * @param data 쿼리 데이터
   * @param error 쿼리 에러
   * @param isFetching 페칭 상태 (TanStack Query, Next Unified Query)
   * @param isValidating 검증 상태 (SWR)
   * @returns 완료 감지 시 { completed: true, duration: number, success: boolean }
   */
  updateAndCheckCompletion(
    enabled: boolean,
    data: any,
    error: any,
    isFetching?: boolean,
    isValidating?: boolean
  ): { completed: boolean; duration: number; success: boolean } | null {
    if (!enabled || this.hasCompleted) {
      return null;
    }

    const currentFetching = isFetching ?? false;
    const currentValidating = isValidating ?? false;

    // 공통 완료 조건: 이전에 로딩/검증 중이었다가 현재는 완료되고 데이터나 에러가 있는 경우
    const wasLoading = this.wasFetching || this.wasValidating;
    const isCurrentlyLoading = currentFetching || currentValidating;
    const hasResult = data || error;

    // SWR 특수 케이스: 이미 데이터가 있고 로딩/검증 중이 아닌 경우 즉시 완료로 간주
    // (stale-while-revalidate 패턴에서 캐시된 데이터 즉시 제공)
    if (hasResult && !isCurrentlyLoading && !wasLoading && this.startTime) {
      this.hasCompleted = true;
      const duration = performance.now() - this.startTime;
      const success = !!data && !error;

      return { completed: true, duration, success };
    }

    if (wasLoading && !isCurrentlyLoading && hasResult) {
      this.hasCompleted = true;
      const duration = performance.now() - (this.startTime || performance.now());
      const success = !!data && !error;

      return { completed: true, duration, success };
    }

    // 상태 업데이트
    this.wasFetching = currentFetching;
    this.wasValidating = currentValidating;
    this.wasEnabled = enabled;

    return null;
  }

  /**
   * 추적 상태 리셋
   */
  reset(): void {
    this.startTime = 0;
    this.hasCompleted = false;
    this.wasEnabled = false;
    this.wasFetching = false;
    this.wasValidating = false;
  }
}

/**
 * 라이브러리별 최적화 설정
 * 각 라이브러리의 설계 철학에 맞는 최적 성능 설정
 */
export const LIBRARY_OPTIMIZED_CONFIGS = {
  SWR: {
    dedupingInterval: 5 * 60 * 1000,  // 5분간 중복 제거
    revalidateOnFocus: false,         // 포커스 시 재검증 비활성화
    revalidateOnReconnect: false,     // 재연결 시 재검증 비활성화
    revalidateIfStale: false,         // stale 데이터 재검증 비활성화
    refreshInterval: 0,               // 자동 새로고침 비활성화
  },
  TANSTACK_QUERY: {
    staleTime: 5 * 60 * 1000,         // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000,           // 10분간 캐시 보관
    refetchOnMount: false,            // 마운트 시 재요청 비활성화
    refetchOnWindowFocus: false,      // 윈도우 포커스 시 재요청 비활성화
    refetchOnReconnect: false,        // 재연결 시 재요청 비활성화
    refetchInterval: false,           // 자동 재요청 비활성화
  },
  NEXT_UNIFIED_QUERY: {
    staleTime: 5 * 60 * 1000,         // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000,           // 10분간 캐시 보관
  }
} as const;

/**
 * 고급 성능 메트릭 인터페이스
 * 다층적 성능 측정을 위한 구조화된 메트릭
 */
export interface AdvancedPerformanceMetrics {
  // A. 사용자 체감 성능
  userExperience: {
    timeToFirstData: number;          // 첫 데이터까지 시간
    immediateDisplay: number;         // 즉시 표시 가능한 응답 수
    fastResponse: number;             // 빠른 응답 수 (<50ms)
    userPerceivedLoadingTime: number; // 사용자가 체감하는 로딩 시간
  };
  
  // B. 네트워크 효율성
  networkEfficiency: {
    actualNetworkRequests: number;    // 실제 네트워크 요청 수
    backgroundUpdates: number;        // 백그라운드 업데이트 수
    cacheMisses: number;              // 캐시 미스 수
    bandwidthSaved: number;           // 절약된 대역폭 (bytes)
  };
  
  // C. 라이브러리별 특화 메트릭
  librarySpecific: any;
  
  // D. 기본 메트릭 (호환성)
  basic: StandardizedPerformanceStats;
}

/**
 * Window Stats 표준화 헬퍼
 * 모든 라이브러리에서 동일한 형식으로 성능 통계를 window 객체에 노출
 */
export const exposeStandardizedStats = (
  libraryName: 'SWR' | 'TANSTACK_QUERY' | 'NEXT_UNIFIED_QUERY',
  stats: StandardizedPerformanceStats
): void => {
  const windowStatsKey = `__${libraryName}_PERFORMANCE_STATS__`;
  (window as any)[windowStatsKey] = stats;
  
  // 공통 형식으로도 노출 (호환성)
  (window as any).__BENCHMARK_PERFORMANCE_STATS__ = {
    ...stats,
    library: libraryName,
    timestamp: Date.now(),
  };
};

/**
 * 고급 메트릭 노출 헬퍼
 * 새로운 공정한 테스트 방법론에서 사용할 고급 성능 지표 노출
 */
export const exposeAdvancedMetrics = (
  libraryName: 'SWR' | 'TANSTACK_QUERY' | 'NEXT_UNIFIED_QUERY',
  metrics: AdvancedPerformanceMetrics
): void => {
  const advancedStatsKey = `__${libraryName}_ADVANCED_METRICS__`;
  (window as any)[advancedStatsKey] = metrics;
  
  // 공통 고급 메트릭 형식으로도 노출
  (window as any).__BENCHMARK_ADVANCED_METRICS__ = {
    ...metrics,
    library: libraryName,
    timestamp: Date.now(),
  };
};