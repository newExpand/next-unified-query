"use client";

import { useState } from "react";
import { useMutation } from "../../lib/query-client";

interface TaskCreationContext {
  optimisticId: string;
  startTime: number;
  action: string;
}

export default function TaskCreationMutationContextPage() {
  const [taskTitle, setTaskTitle] = useState("");
  const [contextData, setContextData] = useState<TaskCreationContext | null>(
    null
  );
  const [successContext, setSuccessContext] =
    useState<TaskCreationContext | null>(null);
  const [settledContext, setSettledContext] =
    useState<TaskCreationContext | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async (variables, fetcher) => {
      const response = await fetcher.request({
        url: "/api/tasks",
        method: "POST",
        data: variables,
      });
      return response.data;
    },
    onMutate: async (variables) => {
      const context: TaskCreationContext = {
        optimisticId: `temp-${Date.now()}`,
        startTime: Date.now(),
        action: "create-task",
      };

      setContextData(context);
      return context;
    },
    onSuccess: (data, variables, context) => {
      setSuccessContext(context as TaskCreationContext);
    },
    onSettled: (data, error, variables, context) => {
      setSettledContext(context as TaskCreationContext);
      if (context) {
        setExecutionTime(Date.now() - context.startTime);
      }
    },
  });

  const handleCreateTask = () => {
    mutation.mutate({ title: taskTitle });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Mutation Context Test</h1>

      <div className="space-y-4">
        <div>
          <input
            data-testid="task-title-input"
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Enter task title..."
            className="px-3 py-2 border border-gray-300 rounded-md w-full"
          />
        </div>

        <button
          data-testid="create-task-btn"
          onClick={handleCreateTask}
          disabled={mutation.isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {mutation.isPending ? "Creating..." : "Create Task"}
        </button>

        {contextData && (
          <div
            data-testid="mutate-context"
            className="p-4 bg-yellow-50 border border-yellow-200 rounded"
          >
            <h3 className="font-semibold">onMutate Context:</h3>
            <div data-testid="mutate-context-data" className="text-sm">
              {JSON.stringify(contextData)}
            </div>
          </div>
        )}

        {successContext && (
          <div
            data-testid="success-context"
            className="p-4 bg-green-50 border border-green-200 rounded"
          >
            <h3 className="font-semibold">onSuccess Context:</h3>
            <div data-testid="success-context-data" className="text-sm">
              {JSON.stringify(successContext)}
            </div>
          </div>
        )}

        {settledContext && (
          <div
            data-testid="settled-context"
            className="p-4 bg-gray-50 border border-gray-200 rounded"
          >
            <h3 className="font-semibold">onSettled Context:</h3>
            <div data-testid="settled-context-data" className="text-sm">
              {JSON.stringify(settledContext)}
            </div>
          </div>
        )}

        {executionTime && (
          <div
            data-testid="execution-time"
            className="p-4 bg-blue-50 border border-blue-200 rounded"
          >
            <h3 className="font-semibold">Execution Time:</h3>
            <div>{executionTime}ms</div>
          </div>
        )}

        {mutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800">Error:</h3>
            <div className="text-red-700">{mutation.error?.message}</div>
          </div>
        )}

        {mutation.isSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800">Success:</h3>
            <div className="text-green-700">
              Task created: {JSON.stringify(mutation.data)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
