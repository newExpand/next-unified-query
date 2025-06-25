"use client";

import { useState } from "react";
import { useQuery, createQueryFactory } from "../../lib/query-client";
import { z } from "next-unified-query";

const schema = z.object({
  data: z.object({
    id: z.number(),
    name: z.string(),
  }),
});

type PerformanceTestData = z.infer<typeof schema>;

// Factory 기반 쿼리 정의
const queryFactory = createQueryFactory({
  performanceTest: {
    cacheKey: (params: { id: number }) => ["performance-test-data", params.id],
    url: (params: { id: number }) => `/api/performance-test-data`,
  },
});

// Factory 기반 컴포넌트
function FactoryBasedComponent({ id }: { id: number }) {
  const { data } = useQuery(queryFactory.performanceTest, {
    params: { id },
  });
  return (
    <div>
      Factory Item {id}: {data?.data?.[id]?.name || "Loading..."}
    </div>
  );
}

// Options 기반 컴포넌트
function OptionsBasedComponent({ id }: { id: number }) {
  const { data } = useQuery({
    cacheKey: ["performance-test-data", id],
    url: "/api/performance-test-data",
    schema,
  });
  return (
    <div>
      Options Item {id}: {data?.data?.[id]?.name || "Loading..."}
    </div>
  );
}

export default function FactoryVsOptionsPerformancePage() {
  const [factoryRendered, setFactoryRendered] = useState(false);
  const [optionsRendered, setOptionsRendered] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<{
    factoryTime: number;
    optionsTime: number;
  } | null>(null);

  const renderFactoryComponents = async () => {
    const startTime = performance.now();
    setFactoryRendered(true);

    // 렌더링 완료를 위해 다음 틱 대기
    await new Promise((resolve) => setTimeout(resolve, 100));

    const endTime = performance.now();
    setPerformanceStats(
      (prev) =>
        ({
          ...prev,
          factoryTime: endTime - startTime,
        } as any)
    );
  };

  const renderOptionsComponents = async () => {
    const startTime = performance.now();
    setOptionsRendered(true);

    // 렌더링 완료를 위해 다음 틱 대기
    await new Promise((resolve) => setTimeout(resolve, 100));

    const endTime = performance.now();
    setPerformanceStats(
      (prev) =>
        ({
          ...prev,
          optionsTime: endTime - startTime,
        } as any)
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Factory vs Options Performance Test
      </h1>

      <div className="space-y-4">
        <div className="space-x-4">
          <button
            data-testid="render-factory-components-btn"
            onClick={renderFactoryComponents}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Render Factory Components
          </button>

          <button
            data-testid="render-options-components-btn"
            onClick={renderOptionsComponents}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Render Options Components
          </button>
        </div>

        {performanceStats && (
          <div
            data-testid="performance-stats"
            className="p-4 bg-gray-100 rounded"
          >
            <h3 className="font-semibold mb-2">Performance Results:</h3>
            {performanceStats.factoryTime && (
              <div>Factory: {performanceStats.factoryTime.toFixed(2)}ms</div>
            )}
            {performanceStats.optionsTime && (
              <div>Options: {performanceStats.optionsTime.toFixed(2)}ms</div>
            )}
          </div>
        )}

        {factoryRendered && (
          <div data-testid="factory-components-rendered" className="space-y-2">
            <h3 className="font-semibold">Factory-based Components:</h3>
            {Array.from({ length: 100 }, (_, i) => (
              <FactoryBasedComponent key={i} id={i} />
            ))}
          </div>
        )}

        {optionsRendered && (
          <div data-testid="options-components-rendered" className="space-y-2">
            <h3 className="font-semibold">Options-based Components:</h3>
            {Array.from({ length: 100 }, (_, i) => (
              <OptionsBasedComponent key={i} id={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
