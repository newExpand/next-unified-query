"use client";

import { useMutation } from "../../lib/query-client";

export default function StateIsolationPage() {
  const slowMutation = useMutation({
    mutationFn: async (variables: { type: string }, fetcher) => {
      const response = await fetcher.request({
        url: "/api/slow-mutation",
        method: "POST",
        data: variables,
      });
      return response.data;
    },
  });

  const fastMutation = useMutation({
    mutationFn: async (variables: { type: string }, fetcher) => {
      const response = await fetcher.request({
        url: "/api/fast-mutation",
        method: "POST",
        data: variables,
      });
      return response.data;
    },
  });

  const errorMutation = useMutation({
    mutationFn: async (variables: { type: string }, fetcher) => {
      const response = await fetcher.request({
        url: "/api/error-mutation",
        method: "POST",
        data: variables,
      });
      return response.data;
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Concurrent Mutations State Isolation
      </h1>

      <div className="space-y-4">
        <div className="space-x-4">
          <button
            data-testid="start-slow-mutation-btn"
            onClick={() => slowMutation.mutate({ type: "slow" })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start Slow Mutation (2s)
          </button>

          <button
            data-testid="start-fast-mutation-btn"
            onClick={() => fastMutation.mutate({ type: "fast" })}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Start Fast Mutation (0.5s)
          </button>

          <button
            data-testid="start-error-mutation-btn"
            onClick={() => errorMutation.mutate({ type: "error" })}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Start Error Mutation (1s)
          </button>
        </div>

        {/* Slow Mutation Status */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold">Slow Mutation (2s):</h3>
          <div data-testid="slow-mutation-status" className="text-sm">
            {slowMutation.isPending
              ? "pending"
              : slowMutation.isSuccess
              ? "success"
              : slowMutation.isError
              ? "error"
              : "idle"}
          </div>
          {slowMutation.isSuccess && (
            <div
              data-testid="slow-mutation-success"
              className="text-green-600 text-sm"
            >
              ✓ Completed: {JSON.stringify(slowMutation.data)}
            </div>
          )}
        </div>

        {/* Fast Mutation Status */}
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold">Fast Mutation (0.5s):</h3>
          <div data-testid="fast-mutation-status" className="text-sm">
            {fastMutation.isPending
              ? "pending"
              : fastMutation.isSuccess
              ? "success"
              : fastMutation.isError
              ? "error"
              : "idle"}
          </div>
          {fastMutation.isSuccess && (
            <div
              data-testid="fast-mutation-success"
              className="text-green-600 text-sm"
            >
              ✓ Completed: {JSON.stringify(fastMutation.data)}
            </div>
          )}
        </div>

        {/* Error Mutation Status */}
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold">Error Mutation (1s):</h3>
          <div data-testid="error-mutation-status" className="text-sm">
            {errorMutation.isPending
              ? "pending"
              : errorMutation.isSuccess
              ? "success"
              : errorMutation.isError
              ? "error"
              : "idle"}
          </div>
          {errorMutation.isError && (
            <div
              data-testid="error-mutation-failed"
              className="text-red-600 text-sm"
            >
              ✗ Failed: {errorMutation.error?.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
