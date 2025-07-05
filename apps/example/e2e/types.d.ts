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
    __QUERY_PERFORMANCE_STATS__: {
      successful: number;
      failed: number;
      averageTime: number;
      cacheHits: number;
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
    gc?: () => void;
  }

  interface Element {
    click(): void;
  }
}

export {};
