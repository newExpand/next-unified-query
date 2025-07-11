// Factory definitions for conditional queries tests
import { createQueryFactory } from "./query-client";

// 조건부 쿼리용 Factory 정의
export const conditionalQueries = createQueryFactory({
  // 사용자 관련 쿼리들
  userProfile: {
    cacheKey: () => ["user", "profile"],
    url: () => "/api/user/profile",
  },
  userDashboard: {
    cacheKey: () => ["user", "dashboard"],
    url: () => "/api/user/dashboard",
  },

  // 관리자 관련 쿼리들
  adminAnalytics: {
    cacheKey: () => ["admin", "analytics"],
    url: () => "/api/admin/analytics",
  },

  // 주소 관련 의존성 체인 쿼리들
  addressLookup: {
    cacheKey: (zipCode: string) => ["address", "lookup", zipCode],
    url: (zipCode: string) => `/api/address/lookup?zipCode=${zipCode}`,
  },
  neighborhoodInfo: {
    cacheKey: (city: string) => ["neighborhood", "info", city],
    url: (city: string) => `/api/neighborhood/info?city=${city}`,
  },

  // 제품 관련 의존성 체인 쿼리들
  productBrands: {
    cacheKey: (category: string) => ["brands", category],
    url: (category: string) => `/api/brands?category=${category}`,
  },
  productModels: {
    cacheKey: (params: [string, string]) => ["models", params[0], params[1]],
    url: (params: [string, string]) =>
      `/api/models?category=${params[0]}&brand=${params[1]}`,
  },
  productSpecs: {
    cacheKey: (model: string) => ["product", "specs", model],
    url: (model: string) => `/api/product/specs?model=${model}`,
  },

  // 검색 관련 쿼리들
  searchRealTime: {
    cacheKey: ({ query, category }: { query: string; category: string }) => [
      "search",
      query,
      category,
    ],
    url: ({ query, category }: { query: string; category: string }) =>
      `/api/search?q=${query}&category=${category}`,
  },
  searchProducts: {
    cacheKey: (filters: Record<string, string>) => [
      "products",
      "search",
      filters,
    ],
    url: (filters: Record<string, string>) => {
      const params = new URLSearchParams(filters);
      return `/api/products/search?${params}`;
    },
  },

  // 대시보드 탭 관련 쿼리들
  dashboardOverview: {
    cacheKey: () => ["dashboard", "overview"],
    url: () => "/api/dashboard/overview",
  },
  dashboardAnalytics: {
    cacheKey: () => ["dashboard", "analytics"],
    url: () => "/api/dashboard/analytics",
  },
  dashboardSettings: {
    cacheKey: () => ["dashboard", "settings"],
    url: () => "/api/dashboard/settings",
  },

  // 사용자 상세 정보 관련 쿼리들 (모달용)
  userDetailsInfo: {
    cacheKey: (userId: string) => ["users", userId, "details"],
    url: (userId: string) => `/api/users/${userId}/details`,
  },
  userPermissions: {
    cacheKey: (userId: string) => ["users", userId, "permissions"],
    url: (userId: string) => `/api/users/${userId}/permissions`,
  },

  // 프로젝트 관련 동적 라우팅 쿼리들
  projectData: {
    cacheKey: ({ projectId, view }: { projectId: number; view: string }) => [
      "projects",
      projectId,
      "data",
      view,
    ],
    url: ({ projectId, view }: { projectId: number; view: string }) =>
      `/api/projects/${projectId}/data?view=${view}`,
  },
});

// 타입 정의들
export interface AdminData {
  totalRevenue: number;
  systemHealth: string;
  userRegistrations: number;
}

export interface UserDashboardData {
  myTasks: number;
  notifications: number;
  recentProjects: string[];
}

export interface AddressLookupData {
  zipCode: string;
  city: string;
  state: string;
  suggestions: string[];
}

export interface NeighborhoodData {
  city: string;
  neighborhoods: string[];
  averageRent: number;
}

export interface BrandsData {
  category: string;
  brands: string[];
}

export interface ModelsData {
  brand: string;
  category: string;
  models: string[];
}

export interface ProductSpecsData {
  model: string;
  price: number;
  specs: {
    ram: string;
    storage: string;
    display: string;
  };
  availability: string;
}

export interface SearchResult {
  query: string;
  category: string;
  results: string[];
  totalCount: number;
}

export interface OverviewData {
  summary: string;
  stats: {
    users: number;
    sales: number;
  };
}

export interface AnalyticsData {
  charts: string[];
  metrics: {
    conversion: number;
    retention: number;
  };
}

export interface SettingsData {
  preferences: {
    theme: string;
    notifications: boolean;
  };
  profile: {
    name: string;
  };
}

export interface UserDetailsData {
  id: number;
  name: string;
  email: string;
  lastLogin: string;
  profile: {
    department: string;
    position: string;
  };
}

export interface UserPermissionsData {
  userId: number;
  permissions: string[];
  roles: string[];
}

export interface ProjectData {
  projectId: number;
  view: string;
  data: string;
  timestamp: number;
}
