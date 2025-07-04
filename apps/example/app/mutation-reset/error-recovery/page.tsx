"use client";

import { useMutation } from "../../lib/query-client";

export default function ErrorRecoveryResetPage() {
  const errorMutation = useMutation({
    mutationFn: async (_, fetcher) => {
      const response = await fetcher.request({
        url: "/api/error-mutation",
        method: "POST",
        data: { test: "error" },
      });
      return response.data;
    },
  });

  const successMutation = useMutation<{ message: string }>({
    mutationFn: async (_, fetcher) => {
      const response = await fetcher.request<{ message: string }>({
        url: "/api/success-after-reset",
        method: "POST",
        data: { test: "success" },
      });
      return response.data;
    },
  });

  const handleTriggerError = () => {
    errorMutation.mutate(undefined);
  };

  const handleResetError = () => {
    errorMutation.reset();
  };

  const handleSuccessAfterReset = () => {
    successMutation.mutate(undefined);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Error Recovery with Reset</h1>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            data-testid="trigger-error-btn"
            onClick={handleTriggerError}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Trigger Error
          </button>

          <button
            data-testid="reset-error-btn"
            onClick={handleResetError}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Reset Error State
          </button>

          <button
            data-testid="success-after-reset-btn"
            onClick={handleSuccessAfterReset}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Success After Reset
          </button>
        </div>

        {/* Error Mutation Status */}
        <div
          data-testid="mutation-status"
          className="p-4 bg-gray-50 border border-gray-200 rounded"
        >
          {errorMutation.isPending
            ? "pending"
            : errorMutation.isSuccess
            ? "success"
            : errorMutation.isError
            ? "error"
            : "idle"}
        </div>

        {/* Error State Display */}
        {errorMutation.isError && (
          <div
            data-testid="mutation-error"
            className="p-4 bg-red-50 border border-red-200 rounded"
          >
            <h3 className="font-semibold text-red-800">Error:</h3>
            <div data-testid="error-message" className="text-red-700">
              {errorMutation.error?.response?.data?.error ||
                errorMutation.error?.message ||
                "Validation error"}
            </div>
          </div>
        )}

        {/* Success After Reset Display */}
        {successMutation.isSuccess && (
          <div
            data-testid="success-after-reset"
            className="p-4 bg-green-50 border border-green-200 rounded"
          >
            <h3 className="font-semibold text-green-800">Success!</h3>
            <div data-testid="success-message" className="text-green-700">
              {successMutation.data?.message || "Success"}
            </div>
          </div>
        )}

        {/* Reset Status Indicator */}
        {!errorMutation.isPending &&
          !errorMutation.isSuccess &&
          !errorMutation.isError && (
            <div className="text-sm text-gray-500">
              Error state has been reset
            </div>
          )}
      </div>
    </div>
  );
}
