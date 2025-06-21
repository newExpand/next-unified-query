"use client";

import { useQuery } from "../../lib/query-client";

interface CombinedUserData {
  user: {
    id: number;
    name: string;
    departmentId: number;
  };
  department: {
    id: number;
    name: string;
    location: string;
    manager: string;
  };
  stats: {
    projectCount: number;
    taskCount: number;
    completedTasks: number;
    efficiency: number;
  };
  combinedInfo: string;
}

export default function UserDetailsPage() {
  const { data, error, isLoading } = useQuery<CombinedUserData, any>({
    cacheKey: ["user-details", 1],
    queryFn: async () => {
      // 여러 API 호출을 조합하는 복잡한 queryFn
      try {
        // 1. 사용자 기본 정보 조회
        const userResponse = await fetch("/api/users/1");
        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }
        const userData = await userResponse.json();

        // 2. 부서 정보 조회
        const departmentResponse = await fetch(
          `/api/departments/${userData.departmentId}`
        );
        if (!departmentResponse.ok) {
          throw new Error("Failed to fetch department data");
        }
        const departmentData = await departmentResponse.json();

        // 3. 사용자 통계 조회
        const statsResponse = await fetch(`/api/users/1/stats`);
        if (!statsResponse.ok) {
          throw new Error("Failed to fetch stats data");
        }
        const statsData = await statsResponse.json();

        // 4. 데이터 조합 및 가공
        const combinedData: CombinedUserData = {
          user: userData,
          department: departmentData,
          stats: statsData,
          combinedInfo: `${userData.name}님은 ${departmentData.name} 부서 (${departmentData.location})에 소속되어 있으며, ${statsData.projectCount}개의 프로젝트와 ${statsData.taskCount}개의 작업을 담당하고 있습니다.`,
        };

        // 캐시 정보 저장
        (window as any).__COMBINED_USER_DATA_CACHED__ = true;

        return combinedData;
      } catch (error) {
        console.error("Error combining user data:", error);
        throw error;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>사용자 상세 정보를 조합하는 중...</p>
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
              데이터 조합 오류
            </h1>
            <p className="text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="user-details"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              사용자 상세 정보 (API 조합)
            </h1>

            {/* 조합된 정보 요약 */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">📋 종합 정보</h3>
              <p className="text-blue-700">{data.combinedInfo}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 사용자 기본 정보 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">👤 사용자 정보</h3>
                <div className="space-y-2">
                  <p data-testid="user-name">
                    <strong>이름:</strong> {data.user.name}
                  </p>
                  <p>
                    <strong>ID:</strong> {data.user.id}
                  </p>
                  <p>
                    <strong>부서 ID:</strong> {data.user.departmentId}
                  </p>
                </div>
              </div>

              {/* 부서 정보 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">🏢 부서 정보</h3>
                <div className="space-y-2">
                  <p data-testid="user-department">
                    <strong>부서:</strong> {data.department.name} (
                    {data.department.location})
                  </p>
                  <p>
                    <strong>관리자:</strong> {data.department.manager}
                  </p>
                  <p>
                    <strong>위치:</strong> {data.department.location}
                  </p>
                </div>
              </div>

              {/* 업무 통계 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">📊 업무 통계</h3>
                <div className="space-y-2">
                  <p data-testid="user-stats">
                    <strong>프로젝트:</strong> {data.stats.projectCount}개<br />
                    <strong>작업:</strong> {data.stats.taskCount}개
                  </p>
                  <p>
                    <strong>완료된 작업:</strong> {data.stats.completedTasks}개
                  </p>
                  <p>
                    <strong>효율성:</strong> {data.stats.efficiency}%
                  </p>
                </div>
              </div>
            </div>

            {/* API 조합 과정 */}
            <div className="mt-8 border-t pt-6">
              <h4 className="font-semibold mb-4">🔄 API 조합 과정</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded">
                  <h5 className="font-medium text-green-800 mb-2">
                    1단계: 사용자 기본 정보
                  </h5>
                  <p className="text-sm text-green-700">GET /api/users/1</p>
                  <p className="text-xs text-green-600 mt-1">✅ 성공</p>
                </div>
                <div className="bg-green-50 border border-green-200 p-4 rounded">
                  <h5 className="font-medium text-green-800 mb-2">
                    2단계: 부서 정보
                  </h5>
                  <p className="text-sm text-green-700">
                    GET /api/departments/{data.user.departmentId}
                  </p>
                  <p className="text-xs text-green-600 mt-1">✅ 성공</p>
                </div>
                <div className="bg-green-50 border border-green-200 p-4 rounded">
                  <h5 className="font-medium text-green-800 mb-2">
                    3단계: 통계 데이터
                  </h5>
                  <p className="text-sm text-green-700">
                    GET /api/users/1/stats
                  </p>
                  <p className="text-xs text-green-600 mt-1">✅ 성공</p>
                </div>
              </div>
            </div>

            {/* 캐시 정보 */}
            <div
              className="mt-6 p-4 bg-gray-100 rounded"
              data-testid="cache-info"
            >
              <h5 className="font-medium mb-2">💾 캐시 정보</h5>
              <p className="text-sm text-gray-600">
                Combined user data cached - 여러 API의 결과가 하나의 캐시 키로
                저장됨
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
