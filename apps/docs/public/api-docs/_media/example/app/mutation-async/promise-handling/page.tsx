"use client";

import { useState } from "react";
import { useMutation } from "../../lib/query-client";

export default function PromiseHandlingPage() {
  const [promiseResult, setPromiseResult] = useState<any>(null);
  const [promiseError, setPromiseError] = useState<any>(null);
  const [thenChainExecuted, setThenChainExecuted] = useState(false);
  const [catchChainExecuted, setCatchChainExecuted] = useState(false);
  const [fireAndForgetContinued, setFireAndForgetContinued] = useState(false);
  const [_shouldFail, setShouldFail] = useState(false);

  const mutation = useMutation({
    mutationFn: async (variables: { shouldFail: boolean }, fetcher) => {
      const response = await fetcher.request({
        url: "/api/async-mutation",
        method: "POST",
        data: { shouldFail: variables.shouldFail },
      });
      return response.data;
    },
  });

  const handleAsyncSuccess = async () => {
    setShouldFail(false);
    try {
      const result = await mutation.mutateAsync({ shouldFail: false });
      setPromiseResult(result);
      setThenChainExecuted(true);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const handleAsyncError = async () => {
    setShouldFail(true);
    try {
      const result = await mutation.mutateAsync({ shouldFail: true });
      setPromiseResult(result);
    } catch (error) {
      setPromiseError(error);
      setCatchChainExecuted(true);
    }
  };

  const handleFireAndForget = () => {
    setShouldFail(false);
    mutation.mutate({ shouldFail: false });
    // mutate는 Promise를 반환하지 않으므로 즉시 다음 코드 실행
    setFireAndForgetContinued(true);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        MutateAsync vs Mutate Promise Handling
      </h1>

      <div className="space-y-4">
        <div className="space-x-4">
          <button
            data-testid="async-success-btn"
            onClick={handleAsyncSuccess}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            MutateAsync Success
          </button>

          <button
            data-testid="async-error-btn"
            onClick={handleAsyncError}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            MutateAsync Error
          </button>

          <button
            data-testid="fire-and-forget-btn"
            onClick={handleFireAndForget}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Fire and Forget
          </button>
        </div>

        {promiseResult && (
          <div
            data-testid="async-promise-resolved"
            className="p-4 bg-green-50 border border-green-200 rounded"
          >
            <h3 className="font-semibold text-green-800">Promise Resolved:</h3>
            <div
              data-testid="promise-result"
              className="text-green-700 text-sm"
            >
              {JSON.stringify(promiseResult)}
            </div>
          </div>
        )}

        {thenChainExecuted && (
          <div
            data-testid="then-chain-executed"
            className="p-4 bg-blue-50 border border-blue-200 rounded"
          >
            <span className="text-blue-800">Then chain executed ✓</span>
          </div>
        )}

        {promiseError && (
          <div
            data-testid="async-promise-rejected"
            className="p-4 bg-red-50 border border-red-200 rounded"
          >
            <h3 className="font-semibold text-red-800">Promise Rejected:</h3>
            <div data-testid="promise-error" className="text-red-700 text-sm">
              {(promiseError as any)?.response?.data?.error ||
                (promiseError as any)?.message ||
                JSON.stringify(promiseError)}
            </div>
          </div>
        )}

        {catchChainExecuted && (
          <div
            data-testid="catch-chain-executed"
            className="p-4 bg-orange-50 border border-orange-200 rounded"
          >
            <span className="text-orange-800">Catch chain executed ✓</span>
          </div>
        )}

        {fireAndForgetContinued && (
          <div
            data-testid="fire-and-forget-continued"
            className="p-4 bg-purple-50 border border-purple-200 rounded"
          >
            <span className="text-purple-800">
              Fire-and-forget continued immediately ✓
            </span>
          </div>
        )}

        {mutation.isPending && (
          <div className="text-blue-600">Processing mutation...</div>
        )}
      </div>
    </div>
  );
}
