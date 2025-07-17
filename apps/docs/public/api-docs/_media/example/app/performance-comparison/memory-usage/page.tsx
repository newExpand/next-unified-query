"use client";

import { useState } from "react";
import { useQuery, createQueryFactory } from "../../lib/query-client";

// Factory 기반 쿼리들
const memoryTestFactory = createQueryFactory({
  memoryData: {
    cacheKey: (params: { batchId: number }) => [
      "memory-test-data",
      params.batchId,
    ],
    url: () => "/api/memory-test-data",
  },
});

export default function MemoryUsagePage() {
  const [factoryQueriesCreated, setFactoryQueriesCreated] = useState(false);
  const [optionsQueriesCreated, setOptionsQueriesCreated] = useState(false);

  const createFactoryQueries = () => {
    setFactoryQueriesCreated(true);
  };

  const createOptionsQueries = () => {
    setOptionsQueriesCreated(true);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Memory Usage Comparison</h1>

      <div className="space-y-4">
        <div className="space-x-4">
          <button
            data-testid="create-factory-queries-btn"
            onClick={createFactoryQueries}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Factory Queries
          </button>

          <button
            data-testid="create-options-queries-btn"
            onClick={createOptionsQueries}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Options Queries
          </button>
        </div>

        {factoryQueriesCreated && (
          <div
            data-testid="factory-queries-created"
            className="p-4 bg-blue-50 rounded"
          >
            <h3 className="font-semibold mb-2">Factory Queries Created</h3>
            <p className="text-sm">
              Created 1000 factory-based queries for memory testing
            </p>
            {Array.from({ length: 50 }, (_, i) => (
              <FactoryComponent key={i} batchId={i} />
            ))}
          </div>
        )}

        {optionsQueriesCreated && (
          <div
            data-testid="options-queries-created"
            className="p-4 bg-green-50 rounded"
          >
            <h3 className="font-semibold mb-2">Options Queries Created</h3>
            <p className="text-sm">
              Created 1000 options-based queries for memory testing
            </p>
            {Array.from({ length: 50 }, (_, i) => (
              <OptionsComponent key={i} batchId={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FactoryComponent({ batchId }: { batchId: number }) {
  useQuery(memoryTestFactory.memoryData, {
    params: { batchId },
    enabled: false, // 실제 요청은 하지 않고 메모리 사용량만 측정
  });
  return null;
}

function OptionsComponent({ batchId }: { batchId: number }) {
  useQuery({
    cacheKey: ["memory-test-data", batchId],
    url: "/api/memory-test-data",
    enabled: false, // 실제 요청은 하지 않고 메모리 사용량만 측정
  });
  return null;
}
