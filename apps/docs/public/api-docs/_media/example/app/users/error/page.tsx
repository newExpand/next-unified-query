"use client";

import { useQuery } from "../../lib/query-client";

/**
 * 에러 테스트 사용자 페이지
 * error.js와 에러 경계 동작 테스트
 */
export default function ErrorUserPage() {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    cacheKey: ["user", "error"],
    queryFn: async () => {
      // 의도적으로 에러 발생 시뮬레이션
      throw new Error("API 에러가 발생했습니다");
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div>사용자 데이터 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div
          data-testid="user-error"
          className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6"
        >
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                사용자 데이터 로딩 실패
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {error instanceof Error
                    ? error.message
                    : "알 수 없는 에러가 발생했습니다"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex">
            <button
              data-testid="error-retry-btn"
              onClick={() => refetch()}
              className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded"
            >
              재시도
            </button>
          </div>

          <div className="mt-4 text-sm text-red-600">
            <p>이 페이지는 의도적으로 에러를 발생시킵니다.</p>
            <p>error.js에서 정의한 에러 UI가 표시되어야 합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div>사용자 데이터: {JSON.stringify(user)}</div>
    </div>
  );
}
