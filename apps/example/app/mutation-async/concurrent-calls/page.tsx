"use client";

import { useState } from "react";
import { useMutation } from "../../lib/query-client";

interface MutationResult {
  id: number;
  uniqueId: string;
  data: string;
  processedAt: number;
  requestTimestamp: number;
}

export default function ConcurrentMutateAsyncPage() {
  const [results, setResults] = useState<MutationResult[]>([]);
  const [executionOrder, setExecutionOrder] = useState<number[]>([]);
  const [completionOrder, setCompletionOrder] = useState<number[]>([]);
  const [allComplete, setAllComplete] = useState(false);

  const mutation1 = useMutation({
    mutationFn: async (variables, fetcher) => {
      const response = await fetcher.request<MutationResult>({
        url: "/api/concurrent-mutation",
        method: "POST",
        data: variables,
      });
      return response.data;
    },
  });

  const mutation2 = useMutation({
    mutationFn: async (variables, fetcher) => {
      const response = await fetcher.request<MutationResult>({
        url: "/api/concurrent-mutation",
        method: "POST",
        data: variables,
      });
      return response.data;
    },
  });

  const mutation3 = useMutation({
    mutationFn: async (variables, fetcher) => {
      const response = await fetcher.request<MutationResult>({
        url: "/api/concurrent-mutation",
        method: "POST",
        data: variables,
      });
      return response.data;
    },
  });

  const handleConcurrentMutations = async () => {
    // Reset state
    setResults([]);
    setExecutionOrder([]);
    setCompletionOrder([]);
    setAllComplete(false);

    // Track execution order - all start simultaneously
    setExecutionOrder([1, 2, 3]);

    // Track completion order with a ref to avoid state race conditions
    const completionTracker: number[] = [];

    // Start all mutations concurrently with unique identifiers
    const promises = [
      mutation1
        .mutateAsync({ data: "Mutation 1", delay: 1500 })
        .then((result) => {
          completionTracker.push(1);
          setCompletionOrder([...completionTracker]);
          return { ...result, mutationIndex: 1 };
        }),
      mutation2
        .mutateAsync({ data: "Mutation 2", delay: 500 })
        .then((result) => {
          completionTracker.push(2);
          setCompletionOrder([...completionTracker]);
          return { ...result, mutationIndex: 2 };
        }),
      mutation3
        .mutateAsync({ data: "Mutation 3", delay: 1000 })
        .then((result) => {
          completionTracker.push(3);
          setCompletionOrder([...completionTracker]);
          return { ...result, mutationIndex: 3 };
        }),
    ];

    // Wait for all to complete
    try {
      const allResults = await Promise.all(promises);
      setResults(allResults);
      setAllComplete(true);
    } catch (error) {
      console.error("Error in concurrent mutations:", error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Concurrent MutateAsync Calls</h1>

      <div className="space-y-4">
        <button
          data-testid="concurrent-mutations-btn"
          onClick={handleConcurrentMutations}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Concurrent Mutations
        </button>

        {executionOrder.length > 0 && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-semibold">Execution Order:</h3>
            <div data-testid="execution-order">{executionOrder.join(", ")}</div>
          </div>
        )}

        {completionOrder.length > 0 && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-semibold">Completion Order:</h3>
            <div data-testid="completion-order">
              {completionOrder.join(", ")}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Results:</h3>
            {results.map((result, index) => (
              <div
                key={result.uniqueId || index}
                data-testid="mutation-result"
                className="p-2 bg-green-50 border border-green-200 rounded"
              >
                <div className="font-mono text-sm">
                  ID: {result.id} | UniqueID: {result.uniqueId} | Data:{" "}
                  {result.data}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Processed: {new Date(result.processedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold">검증 정보:</h4>
              <div className="text-sm mt-1">
                <div>총 결과 수: {results.length}</div>
                <div>
                  고유 ID 수: {new Set(results.map((r) => r.uniqueId)).size}
                </div>
                <div>
                  모든 ID가 고유함:{" "}
                  {new Set(results.map((r) => r.uniqueId)).size ===
                  results.length
                    ? "✅"
                    : "❌"}
                </div>
              </div>
            </div>
          </div>
        )}

        {allComplete && (
          <div
            data-testid="all-mutations-complete"
            className="p-4 bg-blue-50 border border-blue-200 rounded"
          >
            All mutations completed successfully!
          </div>
        )}
      </div>
    </div>
  );
}
