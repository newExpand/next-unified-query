"use client";

import { useState } from "react";
import { revalidateTag } from "next/cache";

/**
 * 관리자 재검증 페이지
 * 태그 기반 재검증을 트리거하는 페이지
 */
export default function AdminRevalidatePage() {
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [message, setMessage] = useState("");

  const handleRevalidateUserData = async () => {
    setIsRevalidating(true);
    setMessage("");

    try {
      // Next.js의 revalidateTag는 Server Actions에서만 동작하므로
      // 여기서는 API 라우트를 통해 재검증을 트리거합니다.
      const response = await fetch("/api/admin/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag: "user-data" }),
      });

      if (response.ok) {
        setMessage("재검증이 성공적으로 완료되었습니다.");
      } else {
        setMessage("재검증 중 오류가 발생했습니다.");
      }
    } catch (error) {
      setMessage("재검증 중 오류가 발생했습니다.");
    } finally {
      setIsRevalidating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">관리자 재검증 페이지</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">캐시 재검증 관리</h2>

        <div className="space-y-4">
          <div>
            <button
              data-testid="revalidate-user-data"
              onClick={handleRevalidateUserData}
              disabled={isRevalidating}
              className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
            >
              {isRevalidating ? "재검증 중..." : "User Data 태그 재검증"}
            </button>
          </div>

          {message && (
            <div
              data-testid={
                message.includes("성공")
                  ? "revalidation-success"
                  : "revalidation-error"
              }
              className={`p-3 rounded ${
                message.includes("성공")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p>이 페이지에서 특정 태그로 태그된 캐시를 재검증할 수 있습니다.</p>
          <p>
            "User Data 태그 재검증" 버튼을 클릭하면 "user-data" 태그가 있는 모든
            캐시가 무효화됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
