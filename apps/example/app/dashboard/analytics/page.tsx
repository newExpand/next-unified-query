"use client";

import { useQuery } from "../../lib/query-client";

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: { path: string; views: number }[];
  timestamp: string;
}

/**
 * 대시보드 분석 페이지
 * 중첩 레이아웃과 상태 유지 테스트
 */
export default function DashboardAnalyticsPage() {
  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery<AnalyticsData>({
    cacheKey: ["analytics-data"],
    queryFn: async () => {
      // 시뮬레이션된 분석 데이터
      return {
        pageViews: Math.floor(Math.random() * 10000) + 5000,
        uniqueVisitors: Math.floor(Math.random() * 3000) + 1000,
        bounceRate: Math.random() * 0.4 + 0.3, // 30-70%
        avgSessionDuration: Math.floor(Math.random() * 300) + 120, // 2-7분
        topPages: [
          { path: "/", views: Math.floor(Math.random() * 1000) + 500 },
          { path: "/about", views: Math.floor(Math.random() * 800) + 200 },
          { path: "/products", views: Math.floor(Math.random() * 600) + 150 },
          { path: "/contact", views: Math.floor(Math.random() * 400) + 100 },
        ],
        timestamp: new Date().toISOString(),
      };
    },
    staleTime: 30000, // 30초
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">분석</h1>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">분석</h1>
        <div className="text-red-600">
          분석 데이터를 불러오는데 실패했습니다.
        </div>
      </div>
    );
  }

  return (
    <div data-testid="analytics-content">
      <h1 className="text-2xl font-bold mb-6">분석</h1>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600 mb-2">페이지 뷰</h3>
          <p className="text-3xl font-bold text-blue-900">
            {analyticsData?.pageViews.toLocaleString()}
          </p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-green-600 mb-2">
            고유 방문자
          </h3>
          <p className="text-3xl font-bold text-green-900">
            {analyticsData?.uniqueVisitors.toLocaleString()}
          </p>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-600 mb-2">이탈률</h3>
          <p className="text-3xl font-bold text-yellow-900">
            {((analyticsData?.bounceRate || 0) * 100).toFixed(1)}%
          </p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600 mb-2">
            평균 세션 시간
          </h3>
          <p className="text-3xl font-bold text-purple-900">
            {Math.floor((analyticsData?.avgSessionDuration || 0) / 60)}m{" "}
            {(analyticsData?.avgSessionDuration || 0) % 60}s
          </p>
        </div>
      </div>

      {/* 인기 페이지 */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">인기 페이지</h2>
        <div className="space-y-3">
          {analyticsData?.topPages.map((page, index) => (
            <div
              key={page.path}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </span>
                <span className="font-medium">{page.path}</span>
              </div>
              <span className="text-gray-600">
                {page.views.toLocaleString()} 뷰
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>
          마지막 업데이트:{" "}
          {new Date(analyticsData?.timestamp || "").toLocaleString()}
        </p>
        <p>이 페이지의 상태는 레이아웃에서 유지됩니다.</p>
      </div>
    </div>
  );
}
