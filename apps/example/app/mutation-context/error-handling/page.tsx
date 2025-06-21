"use client";

import { useState } from "react";
import { useMutation } from "../../lib/query-client";

export default function ErrorHandlingMutationContextPage() {
  const [taskInput, setTaskInput] = useState("");
  const [mutateError, setMutateError] = useState<any>(null);
  const [errorContext, setErrorContext] = useState<any>(null);
  const [settledContext, setSettledContext] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: async (variables: { title: string }, fetcher) => {
      // onMutate에서 에러를 던져서 테스트
      throw new Error("onMutate error occurred");
    },
    onMutate: async (variables) => {
      // 에러를 던지면 context가 전달되지 않음
      throw new Error("Mutation context error");
    },
    onError: (error, variables, context) => {
      setErrorContext(context);
    },
    onSettled: (data, error, variables, context) => {
      setSettledContext(context);
    },
  });

  const handleCreateErrorTask = () => {
    try {
      mutation.mutate({ title: taskInput });
    } catch (error) {
      setMutateError(error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Mutation Error Context Test</h1>

      <div className="space-y-4">
        <div>
          <input
            data-testid="task-input"
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Enter task title..."
            className="px-3 py-2 border border-gray-300 rounded-md w-full"
          />
        </div>

        <button
          data-testid="create-error-task-btn"
          onClick={handleCreateErrorTask}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Create Error Task
        </button>

        {mutateError && (
          <div
            data-testid="mutate-error"
            className="p-4 bg-red-50 border border-red-200 rounded"
          >
            <h3 className="font-semibold text-red-800">Mutate Error:</h3>
            <div className="text-red-700">{mutateError.message}</div>
          </div>
        )}

        {mutation.isError && (
          <div
            data-testid="error-callback"
            className="p-4 bg-orange-50 border border-orange-200 rounded"
          >
            <h3 className="font-semibold text-orange-800">onError Callback:</h3>
            <div className="text-orange-700">
              Error: {(mutation.error as any)?.message}
            </div>
            <div data-testid="error-context-data" className="text-sm mt-2">
              Context:{" "}
              {errorContext ? JSON.stringify(errorContext) : "undefined"}
            </div>
          </div>
        )}

        {settledContext !== null && (
          <div
            data-testid="settled-callback"
            className="p-4 bg-gray-50 border border-gray-200 rounded"
          >
            <h3 className="font-semibold">onSettled Callback:</h3>
            <div data-testid="settled-context-data" className="text-sm">
              Context:{" "}
              {settledContext ? JSON.stringify(settledContext) : "undefined"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
