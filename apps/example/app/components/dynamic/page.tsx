"use client";

import { useState, Suspense, lazy } from "react";

// Dynamic Import로 Heavy Component 로드
const HeavyComponent = lazy(() => import("./heavy-component"));

/**
 * Dynamic Import 테스트 페이지
 * Dynamic Import와 lazy loading 기능 테스트
 */
export default function ComponentsDynamicPage() {
  const [showHeavyComponent, setShowHeavyComponent] = useState(false);

  const handleLoadHeavyComponent = () => {
    setShowHeavyComponent(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dynamic Import 테스트</h1>

      <div data-testid="main-content" className="mb-6">
        <p className="mb-4">이 페이지는 즉시 로드됩니다.</p>
        <p className="mb-4">
          아래 버튼을 클릭하면 무거운 컴포넌트가 동적으로 로드됩니다.
        </p>

        <button
          data-testid="load-heavy-component"
          onClick={handleLoadHeavyComponent}
          disabled={showHeavyComponent}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {showHeavyComponent ? "로딩됨" : "무거운 컴포넌트 로드"}
        </button>
      </div>

      {showHeavyComponent && (
        <Suspense
          fallback={
            <div
              data-testid="dynamic-loading"
              className="p-4 bg-gray-100 rounded"
            >
              동적 컴포넌트 로딩 중...
            </div>
          }
        >
          <HeavyComponent />
        </Suspense>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>
          이 페이지는 Dynamic Import를 사용하여 필요할 때만 컴포넌트를
          로드합니다.
        </p>
        <p>
          무거운 컴포넌트와 관련된 쿼리는 컴포넌트가 로드될 때 함께 실행됩니다.
        </p>
      </div>
    </div>
  );
}
