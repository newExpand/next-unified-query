"use client";

import { useState } from "react";
import { useMutation } from "../../lib/query-client";

export default function StateManagementResetPage() {
  const [dataInput, setDataInput] = useState("");

  const mutation = useMutation({
    mutationFn: async (variables: { data: string }, fetcher) => {
      const response = await fetcher.request({
        url: "/api/reset-test",
        method: "POST",
        data: variables,
      });
      return response.data;
    },
  });

  const handleSubmit = () => {
    mutation.mutate({ data: dataInput });
  };

  const handleReset = () => {
    mutation.reset();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Mutation Reset State Management
      </h1>

      <div className="space-y-4">
        <div>
          <input
            data-testid="data-input"
            type="text"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            placeholder="Enter data..."
            className="px-3 py-2 border border-gray-300 rounded-md w-full"
          />
        </div>

        <div className="space-x-4">
          <button
            data-testid="submit-btn"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Submit
          </button>

          <button
            data-testid="reset-btn"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
        </div>

        {/* State Display */}
        <div className="space-y-2">
          <div data-testid="is-pending">
            isPending: {mutation.isPending.toString()}
          </div>
          <div data-testid="is-success">
            isSuccess: {mutation.isSuccess.toString()}
          </div>
          <div data-testid="is-error">
            isError: {mutation.isError.toString()}
          </div>
          <div data-testid="mutation-data">
            data: {mutation.data ? JSON.stringify(mutation.data) : "undefined"}
          </div>
        </div>

        {/* Status Display */}
        <div data-testid="mutation-status" className="p-4 bg-gray-100 rounded">
          Status:{" "}
          {mutation.isPending
            ? "pending"
            : mutation.isSuccess
            ? "success"
            : mutation.isError
            ? "error"
            : "idle"}
        </div>

        {mutation.isSuccess && (
          <div
            data-testid="mutation-success"
            className="p-4 bg-green-50 border border-green-200 rounded"
          >
            <h3 className="font-semibold text-green-800">Success!</h3>
            <div className="text-green-700">
              {JSON.stringify(mutation.data)}
            </div>
          </div>
        )}

        {mutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800">Error:</h3>
            <div className="text-red-700">
              {(mutation.error as any)?.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
