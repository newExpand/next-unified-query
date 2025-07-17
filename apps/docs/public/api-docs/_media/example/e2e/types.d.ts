/// <reference types="@playwright/test" />

declare global {
  interface Window {
    __NEXT_UNIFIED_QUERY_ENV__: "development" | "production";
    __SCHEMA_VALIDATION_ERRORS__: {
      path: string;
      message: string;
      code: string;
      timestamp?: string;
      endpoint?: string;
      detailedPath?: string;
    }[];
    __LAST_ORDER_DATA__: {
      id: number;
      customerId: number;
      items: Array<{
        id: number;
        productId: number;
        quantity: number;
        price: number;
        name: string;
      }>;
      total: number;
      status: string;
      createdAt: string;
    };
    __ANALYTICS_STATS__: {
      totalViews: number;
      conversionRate: number;
      isActive: boolean;
      lastUpdated: Date;
      categories: string[];
    };
    __RENDER_PERFORMANCE_STATS__: {
      renderTime: number;
    };
    __SCHEMA_VALIDATION_STATS__: {
      cacheHits: number;
      validationExecutions: number;
    };
    __MIGRATED_PRODUCT_DATA__: {
      id: number;
      name: string;
      price: number;
      category: string;
      isAvailable: boolean;
      createdAt: string;
    };
    __NEXT_UNIFIED_QUERY_CACHE_STATS__?: {
      cacheSize: number;
      maxSize: number;
      subscribersCount: number;
      listenersCount: number;
      activeGcTimersCount: number;
    };
    __placeholderDataParams?: {
      prevData: string;
      prevQuery: string;
      hasData: boolean;
    };
    // 표준화된 성능 측정 통계 (공통 인터페이스)
    __BENCHMARK_PERFORMANCE_STATS__: {
      completed: number;
      successful: number;
      failed: number;
      totalTime: number;
      averageTime: number;
      cacheHits: number;
      library: 'SWR' | 'TANSTACK_QUERY' | 'NEXT_UNIFIED_QUERY';
      timestamp: number;
    };
    
    // 라이브러리별 고유 성능 통계
    __NEXT_UNIFIED_QUERY_PERFORMANCE_STATS__: {
      completed: number;
      successful: number;
      failed: number;
      totalTime: number;
      averageTime: number;
      cacheHits: number;
    };
    __QUERY_PERFORMANCE_STATS__: {
      successful: number;
      failed: number;
      averageTime: number;
      cacheHits: number;
    };
    __TANSTACK_QUERY_PERFORMANCE_STATS__: {
      completed: number;
      successful: number;
      failed: number;
      totalTime: number;
      averageTime: number;
      cacheHits: number;
    };
    __SWR_PERFORMANCE_STATS__: {
      completed: number;
      successful: number;
      failed: number;
      totalTime: number;
      averageTime: number;
      cacheHits: number;
    };
    
    // 고급 다층적 성능 메트릭 (공정한 테스트 방법론)
    __BENCHMARK_ADVANCED_METRICS__: {
      userExperience: {
        timeToFirstData: number;
        immediateDisplay: number;
        fastResponse: number;
        userPerceivedLoadingTime: number;
      };
      networkEfficiency: {
        actualNetworkRequests: number;
        backgroundUpdates: number;
        cacheMisses: number;
        bandwidthSaved: number;
      };
      librarySpecific: any;
      basic: {
        completed: number;
        successful: number;
        failed: number;
        totalTime: number;
        averageTime: number;
        cacheHits: number;
      };
      library: 'SWR' | 'TANSTACK_QUERY' | 'NEXT_UNIFIED_QUERY';
      timestamp: number;
    };
    
    // 라이브러리별 고급 메트릭
    __SWR_ADVANCED_METRICS__: {
      userExperience: {
        timeToFirstData: number;
        immediateDisplay: number;
        fastResponse: number;
        userPerceivedLoadingTime: number;
      };
      networkEfficiency: {
        actualNetworkRequests: number;
        backgroundUpdates: number;
        cacheMisses: number;
        bandwidthSaved: number;
      };
      librarySpecific: {
        staleWhileRevalidateEfficiency: {
          immediateStaleServed: number;
          backgroundUpdateSpeed: number;
          stalenessAcceptability: number;
        };
      };
      basic: {
        completed: number;
        successful: number;
        failed: number;
        totalTime: number;
        averageTime: number;
        cacheHits: number;
      };
    };
    
    __TANSTACK_QUERY_ADVANCED_METRICS__: {
      userExperience: {
        timeToFirstData: number;
        immediateDisplay: number;
        fastResponse: number;
        userPerceivedLoadingTime: number;
      };
      networkEfficiency: {
        actualNetworkRequests: number;
        backgroundUpdates: number;
        cacheMisses: number;
        bandwidthSaved: number;
      };
      librarySpecific: {
        conditionalCacheEfficiency: {
          intelligentCacheHits: number;
          conditionalRefetches: number;
          staleTimeRespected: number;
        };
      };
      basic: {
        completed: number;
        successful: number;
        failed: number;
        totalTime: number;
        averageTime: number;
        cacheHits: number;
      };
    };
    
    __NEXT_UNIFIED_QUERY_ADVANCED_METRICS__: {
      userExperience: {
        timeToFirstData: number;
        immediateDisplay: number;
        fastResponse: number;
        userPerceivedLoadingTime: number;
      };
      networkEfficiency: {
        actualNetworkRequests: number;
        backgroundUpdates: number;
        cacheMisses: number;
        bandwidthSaved: number;
      };
      librarySpecific: {
        absoluteCacheEfficiency: {
          trueCacheHits: number;
          zeroNetworkRequests: number;
          cacheConsistency: number;
        };
      };
      basic: {
        completed: number;
        successful: number;
        failed: number;
        totalTime: number;
        averageTime: number;
        cacheHits: number;
      };
    };
    
    __LAYOUT_SHIFT_SCORE__: number;

    __CACHE_PERFORMANCE_STATS__: {
      firstLoad: {
        totalTime: number;
        networkRequests: number;
        cacheHits: number;
        totalRequests: number;
      };
      secondLoad: {
        totalTime: number;
        networkRequests: number;
        cacheHits: number;
        totalRequests: number;
      };
    };
    __INTERCEPTOR_LOGS__: string[];
    __INTERCEPTOR_CONTEXT__: {
      currentRequestId?: string;
      requestHistory: Array<{
        id: string;
        timestamp: number;
        type: string;
        url?: string;
        status?: number;
      }>;
    };
    __COMPLEX_DATA__?: {
      id: number;
      name: string;
      createdAt: string;
      profile: {
        bio: string;
        avatar: string;
        socialLinks: {
          github?: string;
          linkedin?: string;
        };
      };
      preferences: {
        theme: "light" | "dark";
        notifications: boolean;
        language: string;
      };
      stats: {
        posts: number;
        views: number;
        likes: number;
      };
      skills: string[];
      tags: string[];
      metadata: {
        version: string;
        lastLogin: string;
      };
    };
    
    // 디버깅용 성능 트래커 (실제 응답 시간 배열 접근)
    __TANSTACK_QUERY_PERFORMANCE_TRACKER__?: {
      queryTimes: number[];
      queryResults: Array<{ success: boolean; time: number }>;
      getStandardizedStats(): any;
      getAdvancedMetrics(libraryType: string): any;
    };
    
    __SWR_PERFORMANCE_TRACKER__?: {
      queryTimes: number[];
      queryResults: Array<{ success: boolean; time: number }>;
      getStandardizedStats(): any;
      getAdvancedMetrics(libraryType: string): any;
    };
    
    __NEXT_UNIFIED_QUERY_PERFORMANCE_TRACKER__?: {
      queryTimes: number[];
      queryResults: Array<{ success: boolean; time: number }>;
      getStandardizedStats(): any;
      getAdvancedMetrics(libraryType: string): any;
    };
    
    gc?: () => void;
  }

  interface Element {
    click(): void;
  }
}

export {};
