"use client";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 사용자 에러 UI
 * 에러 경계에서 표시되는 에러 컴포넌트
 */
export default function UserError({ error, reset }: ErrorProps) {
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
              오류가 발생했습니다
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error.message || "알 수 없는 오류가 발생했습니다"}</p>
              {error.digest && (
                <p className="mt-1 text-xs text-red-600">
                  오류 ID: {error.digest}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            data-testid="error-retry-btn"
            onClick={reset}
            className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded"
          >
            다시 시도
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded"
          >
            홈으로 이동
          </button>
        </div>

        <div className="mt-4 text-sm text-red-600">
          <p>이 페이지는 error.js에서 정의한 에러 UI입니다.</p>
          <p>의도적으로 발생한 에러를 처리하여 표시합니다.</p>
        </div>
      </div>
    </div>
  );
}
