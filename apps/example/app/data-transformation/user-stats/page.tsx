"use client";

import { useQuery } from "../../lib/query-client";
import { useState, useMemo } from "react";

interface UserStats {
  userId: number;
  username: string;
  stats: {
    projectsCompleted: number;
    hoursWorked: number;
    tasksCompleted: number;
    efficiency: number;
  };
  performance: {
    lastWeek: number;
    lastMonth: number;
    averageRating: number;
  };
  preferences: {
    theme: string;
    notifications: boolean;
  };
}

interface TransformedUserStats {
  userId: number;
  displayName: string;
  productivityScore: number;
  performanceGrade: string;
  totalContribution: number;
  isEfficient: boolean;
  themeColor: string;
}

export default function UserStatsTransformationPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // select 함수를 메모이제이션하여 불필요한 재실행 방지
  const transformUserStats = useMemo(
    () =>
      (stats: UserStats): TransformedUserStats => {
        console.log("🔄 Transform function executing with theme:", theme);

        // 복잡한 계산 로직
        const productivityScore = Math.round(
          (stats.stats.projectsCompleted * 10 +
            stats.stats.tasksCompleted * 2 +
            stats.stats.hoursWorked * 0.5) *
            stats.stats.efficiency
        );

        const performanceGrade =
          stats.performance.averageRating >= 4.5
            ? "A+"
            : stats.performance.averageRating >= 4.0
            ? "A"
            : stats.performance.averageRating >= 3.5
            ? "B"
            : "C";

        const totalContribution =
          stats.stats.projectsCompleted +
          stats.stats.tasksCompleted +
          Math.floor(stats.stats.hoursWorked / 8);

        return {
          userId: stats.userId,
          displayName: `@${stats.username}`,
          productivityScore,
          performanceGrade,
          totalContribution,
          isEfficient: stats.stats.efficiency >= 0.8,
          themeColor: theme === "dark" ? "#374151" : "#f3f4f6",
        };
      },
    [theme] // theme이 변경될 때만 재생성
  );

  const { data, error, isLoading, refetch } = useQuery<UserStats, any>({
    cacheKey: ["user-stats", { theme }], // theme을 cacheKey에 포함
    queryFn: async (fetcher) => {
      // 내장 fetcher 사용
      const response = await fetcher.get<UserStats>("/api/user-stats");
      return response.data;
    },
    select: transformUserStats,
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지
  });

  // data는 select 함수에 의해 TransformedUserStats로 변환됨
  const transformedData = data as unknown as TransformedUserStats;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>사용자 통계를 변환하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-900 mb-4">
              데이터 조회 오류
            </h1>
            <p className="text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (transformedData) {
    return (
      <div
        className="min-h-screen py-12 px-4"
        style={{
          backgroundColor: theme === "dark" ? "#1f2937" : "#f9fafb",
          color: theme === "dark" ? "#f9fafb" : "#1f2937",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div
            className="shadow rounded-lg p-6"
            style={{ backgroundColor: transformedData.themeColor }}
            data-testid="user-stats-transformation"
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">
                사용자 통계 데이터 변환 & 메모이제이션
              </h1>

              {/* 테마 변경 버튼으로 리렌더링 최적화 테스트 */}
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className={`px-4 py-2 rounded transition-colors ${
                  theme === "light"
                    ? "bg-gray-800 text-white hover:bg-gray-700"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
                data-testid="theme-toggle"
              >
                {theme === "light" ? "🌙 다크모드" : "☀️ 라이트모드"}
              </button>
            </div>

            {/* 메모이제이션 설명 */}
            <div
              className={`border-l-4 p-4 mb-6 ${
                theme === "light"
                  ? "bg-blue-50 border-blue-400"
                  : "bg-blue-900 border-blue-500"
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  theme === "light" ? "text-blue-800" : "text-blue-200"
                }`}
              >
                🧠 메모이제이션 최적화 테스트
              </h3>
              <p
                className={`text-sm ${
                  theme === "light" ? "text-blue-700" : "text-blue-300"
                }`}
              >
                테마 변경 시에만 select 함수가 재실행됩니다. 콘솔에서 transform
                function 실행 로그를 확인해보세요.
              </p>
            </div>

            {/* 변환된 사용자 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div
                className={`p-4 rounded-lg ${
                  theme === "light" ? "bg-white" : "bg-gray-800"
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">👤 사용자 정보</h3>
                <div className="space-y-2">
                  <p>
                    <strong>ID:</strong> {transformedData.userId}
                  </p>
                  <p>
                    <strong>표시명:</strong> {transformedData.displayName}
                  </p>
                  <p>
                    <strong>효율성:</strong>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${
                        transformedData.isEfficient
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transformedData.isEfficient
                        ? "⚡ 효율적"
                        : "📈 개선 필요"}
                    </span>
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  theme === "light" ? "bg-white" : "bg-gray-800"
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">📊 성과 점수</h3>
                <div className="space-y-2">
                  <p>
                    <strong>생산성 점수:</strong>
                    <span className="text-2xl font-bold text-purple-600 ml-2">
                      {transformedData.productivityScore}
                    </span>
                  </p>
                  <p>
                    <strong>성과 등급:</strong>
                    <span
                      className={`ml-2 px-3 py-1 rounded font-bold text-lg ${
                        transformedData.performanceGrade === "A+"
                          ? "bg-green-100 text-green-800"
                          : transformedData.performanceGrade === "A"
                          ? "bg-blue-100 text-blue-800"
                          : transformedData.performanceGrade === "B"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transformedData.performanceGrade}
                    </span>
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  theme === "light" ? "bg-white" : "bg-gray-800"
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">🎯 기여도</h3>
                <div className="space-y-2">
                  <p>
                    <strong>총 기여도:</strong>
                    <span className="text-xl font-bold text-indigo-600 ml-2">
                      {transformedData.totalContribution}
                    </span>
                  </p>
                  <div className="mt-3">
                    <div
                      className={`w-full rounded-full h-2 ${
                        theme === "light" ? "bg-gray-200" : "bg-gray-600"
                      }`}
                    >
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (transformedData.totalContribution / 100) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">기여도 진행률</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 변환 로직 설명 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                ⚙️ 변환 로직 및 최적화
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  className={`p-4 rounded-lg ${
                    theme === "light" ? "bg-gray-50" : "bg-gray-700"
                  }`}
                >
                  <h4 className="font-medium mb-3">🔄 select 함수 최적화</h4>
                  <div className="text-sm space-y-2">
                    <p>
                      • <strong>의존성:</strong> theme 변경 시에만 재생성
                    </p>
                    <p>
                      • <strong>메모이제이션:</strong> useMemo로 불필요한 계산
                      방지
                    </p>
                    <p>
                      • <strong>캐시 키:</strong> theme을 포함하여 적절한 캐싱
                    </p>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${
                    theme === "light" ? "bg-gray-50" : "bg-gray-700"
                  }`}
                >
                  <h4 className="font-medium mb-3">📊 계산 공식</h4>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong>생산성 점수:</strong> (프로젝트×10 + 작업×2 +
                      시간×0.5) × 효율성
                    </p>
                    <p>
                      <strong>성과 등급:</strong> 평균 평점 기준 A+/A/B/C
                    </p>
                    <p>
                      <strong>총 기여도:</strong> 프로젝트 + 작업 + (시간÷8)
                    </p>
                  </div>
                </div>
              </div>

              {/* 실제 변환 코드 */}
              <div
                className={`mt-6 p-4 rounded-lg ${
                  theme === "light" ? "bg-gray-100" : "bg-gray-800"
                }`}
              >
                <h4 className="font-medium mb-3">🔧 실제 변환 코드</h4>
                <pre className="text-xs overflow-x-auto">
                  {`const transformUserStats = useMemo(
  () => (stats: UserStats): TransformedUserStats => {
    const productivityScore = Math.round(
      (stats.stats.projectsCompleted * 10 + 
       stats.stats.tasksCompleted * 2 + 
       stats.stats.hoursWorked * 0.5) * 
      stats.stats.efficiency
    );
    // ... 기타 변환 로직
  },
  [theme] // theme 변경 시에만 재생성
);`}
                </pre>
              </div>
            </div>

            {/* 테스트 버튼들 */}
            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={() => refetch()}
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                🔄 데이터 새로고침
              </button>
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                🎨 테마 변경 (재변환 트리거)
              </button>
            </div>

            <p className="text-xs text-center mt-4 opacity-75">
              테마 변경 시 콘솔에서 "Transform function executing" 로그를
              확인하세요
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
