"use client";

import { useQuery } from "../../lib/query-client";
import { notFound } from "next/navigation";

/**
 * 존재하지 않는 사용자 페이지 (999)
 * not-found.js 동작 테스트
 */
export default function User999Page() {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    cacheKey: ["user", "999"],
    queryFn: async () => {
      // 404 에러 시뮬레이션
      const response = new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          statusText: "Not Found",
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Next.js의 notFound() 함수 호출하여 not-found.js 트리거
          notFound();
        }
        throw new Error("사용자를 찾을 수 없습니다");
      }

      return response.json();
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
        <div className="text-red-600">
          에러: {error instanceof Error ? error.message : "알 수 없는 에러"}
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
