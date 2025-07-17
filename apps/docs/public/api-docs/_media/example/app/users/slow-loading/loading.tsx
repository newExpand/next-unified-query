/**
 * 사용자 로딩 UI
 * Suspense 경계에서 표시되는 로딩 컴포넌트
 */
export default function UserLoading() {
  return (
    <div className="container mx-auto p-4">
      <div data-testid="user-loading" className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            {/* 제목 스켈레톤 */}
            <div className="h-8 bg-gray-200 rounded mb-6 w-1/3"></div>

            {/* 컨텐츠 스켈레톤 */}
            <div className="space-y-4">
              <div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>

              <div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>

              <div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-gray-500">
            <p>사용자 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
