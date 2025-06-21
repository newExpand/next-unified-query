"use client";

import { useQuery } from "../../lib/query-client";

interface SlowUser {
  id: string;
  name: string;
  email: string;
  bio: string;
  joinDate: string;
}

/**
 * 느린 로딩 사용자 페이지
 * loading.js UI와 Suspense 경계 테스트
 */
export default function SlowLoadingUserPage() {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<SlowUser>({
    cacheKey: ["user", "slow-loading"],
    queryFn: async () => {
      // 의도적으로 느린 응답 시뮬레이션 (2초 대기)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        id: "slow-user",
        name: "느린 사용자",
        email: "slow@example.com",
        bio: "이 사용자 데이터는 의도적으로 느리게 로드됩니다.",
        joinDate: "2024-01-01",
      };
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div data-testid="user-loading">사용자 데이터 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-600">사용자 데이터 로딩 실패</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4" data-testid="user-content">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">{user?.name}</h1>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700">이메일</h3>
            <p>{user?.email}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">소개</h3>
            <p>{user?.bio}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">가입일</h3>
            <p>{user?.joinDate}</p>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>이 페이지는 의도적으로 2초의 지연이 있습니다.</p>
          <p>loading.js에서 정의한 로딩 UI가 표시되어야 합니다.</p>
        </div>
      </div>
    </div>
  );
}
