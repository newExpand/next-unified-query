"use client";

import { useQuery } from "../../lib/query-client";
import { z } from "zod";

const AnalyticsStatsSchema = z.object({
  totalViews: z.coerce.number(),
  conversionRate: z.coerce.number(),
  isActive: z.coerce.boolean(),
  lastUpdated: z.coerce.date(),
  categories: z.string().transform((str) => str.split(",")),
  metadata: z.object({
    version: z.string(),
    flags: z.string().transform((str) => str.split(",")),
  }),
});

type AnalyticsStats = z.infer<typeof AnalyticsStatsSchema>;

export default function TypeCoercionValidation() {
  const { data, error, isLoading } = useQuery<AnalyticsStats>({
    cacheKey: ["analytics", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const rawData = await response.json();
      const validatedData = AnalyticsStatsSchema.parse(rawData);

      // coercion 후 타입 확인을 위해 글로벌에 저장
      (window as any).__ANALYTICS_STATS__ = validatedData;

      return validatedData;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        오류 발생
      </div>
    );
  }

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="analytics-stats"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              분석 통계 (타입 변환)
            </h1>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  총 조회수 (문자열 → 숫자)
                </label>
                <p className="text-lg text-gray-900" data-testid="total-views">
                  {data.totalViews.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  전환율 (문자열 → 숫자)
                </label>
                <p
                  className="text-lg text-gray-900"
                  data-testid="conversion-rate"
                >
                  {data.conversionRate}%
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  활성 상태 (문자열 → 불린)
                </label>
                <p
                  className="text-lg text-gray-900"
                  data-testid="active-status"
                >
                  {data.isActive ? "활성" : "비활성"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  마지막 업데이트 (문자열 → Date)
                </label>
                <p className="text-lg text-gray-900">
                  {data.lastUpdated.toLocaleDateString("en-US")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  카테고리 (문자열 → 배열)
                </label>
                <p
                  className="text-lg text-gray-900"
                  data-testid="categories-count"
                >
                  {data.categories.length}개
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {category.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  플래그 (문자열 → 배열)
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.metadata.flags.map((flag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
                    >
                      {flag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h3 className="font-medium text-blue-900 mb-2">
                타입 변환 (Coercion) 완료
              </h3>
              <p className="text-sm text-blue-700">
                서버에서 문자열로 전송된 데이터가 적절한 타입으로 자동
                변환되었습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
