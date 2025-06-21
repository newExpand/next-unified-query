import Link from "next/link";

/**
 * 사용자 Not Found UI
 * 존재하지 않는 사용자 접근 시 표시되는 404 컴포넌트
 */
export default function UserNotFound() {
  return (
    <div className="container mx-auto p-4">
      <div
        data-testid="user-not-found"
        className="max-w-2xl mx-auto text-center"
      >
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            사용자를 찾을 수 없습니다
          </h1>
          <p className="text-gray-600 mb-6">
            요청하신 사용자가 존재하지 않거나 삭제되었습니다.
          </p>

          <div className="space-y-3">
            <Link
              data-testid="back-to-home"
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              홈으로 돌아가기
            </Link>

            <div>
              <Link
                href="/users"
                className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded"
              >
                사용자 목록 보기
              </Link>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>이 페이지는 not-found.js에서 정의한 404 UI입니다.</p>
            <p>존재하지 않는 사용자 ID로 접근했을 때 표시됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
