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
  const [filter, setFilter] = useState<"all" | "efficient">("all");
  const [selectCallCount, setSelectCallCount] = useState(0);

  // select 함수를 메모이제이션하여 불필요한 재실행 방지
  const transformUserStats = useMemo(
    () =>
      (stats: UserStats): TransformedUserStats => {
        console.log("🔄 Transform function executing with filter:", filter);
        setSelectCallCount(prev => prev + 1);

        // 복잡한 계산 로직 (filter에 따라 달라짐)
        let productivityScore = Math.round(
          (stats.stats.projectsCompleted * 10 +
            stats.stats.tasksCompleted * 2 +
            stats.stats.hoursWorked * 0.5) *
            stats.stats.efficiency
        );

        // filter가 "efficient"일 때 보너스 점수 적용
        if (filter === "efficient" && stats.stats.efficiency >= 0.8) {
          productivityScore *= 1.2; // 20% 보너스
        }

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
          themeColor: "#f3f4f6", // 테마에 무관하게 고정
        };
      },
    [filter] // filter가 변경될 때만 재생성 (theme는 select에 영향 없음)
  );

  const { data, error, isLoading, refetch } = useQuery<UserStats, any>({
    cacheKey: ["user-stats"], // filter를 cacheKey에서 제거
    queryFn: async (fetcher) => {
      // 내장 fetcher 사용
      const response = await fetcher.get<UserStats>("/api/user-stats");
      return response.data;
    },
    select: transformUserStats,
    selectDeps: [filter], // selectDeps를 사용하여 select 함수 재실행 제어
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
            data-testid="stats-dashboard"
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">
                사용자 통계 데이터 변환 & 메모이제이션
              </h1>

              {/* Select 함수 호출 횟수 표시 */}
              <div className="text-right space-y-2">
                <div data-testid="select-call-count" className="text-sm">
                  Select 호출: {selectCallCount}회
                </div>
                {/* 테마 변경 버튼으로 리렌더링 최적화 테스트 */}
                <button
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className={`px-4 py-2 rounded transition-colors ${
                    theme === "light"
                      ? "bg-gray-800 text-white hover:bg-gray-700"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                  data-testid="toggle-theme-btn"
                >
                  {theme === "light" ? "🌙 다크모드" : "☀️ 라이트모드"}
                </button>
              </div>
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
                필터 변경 시에만 select 함수가 재실행됩니다. 테마 변경은 select에 영향을 주지 않습니다. 콘솔에서 transform
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
                      • <strong>selectDeps:</strong> filter 변경 시에만 재실행
                    </p>
                    <p>
                      • <strong>메모이제이션:</strong> useMemo로 불필요한 계산
                      방지
                    </p>
                    <p>
                      • <strong>캐시 키:</strong> 동일한 데이터 소스, select만 재실행
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
  [filter] // filter 변경 시에만 재생성
);

// useQuery에서 selectDeps 사용
selectDeps: [filter] // filter 변경 시에만 select 재실행`}
                </pre>
              </div>
            </div>

            {/* 테스트 버튼들 */}
            <div className="mt-6 flex gap-4 justify-center flex-wrap">
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
                🎨 테마 변경 (select 재실행 없음)
              </button>
              <button
                onClick={() => setFilter(filter === "all" ? "efficient" : "all")}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="change-filter-btn"
              >
                📊 필터 변경 ({filter}) - select 재실행
              </button>
            </div>

            <p className="text-xs text-center mt-4 opacity-75">
              필터 변경 시에만 콘솔에서 &quot;Transform function executing&quot; 로그를
              확인하세요 (테마 변경은 select 재실행 없음)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
