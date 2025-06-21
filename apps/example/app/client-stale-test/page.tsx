"use client";

import { useQuery } from "../lib/query-client";

interface TestData {
  message: string;
  timestamp: number;
  random: number;
}

export default function ClientStaleTestPage() {
  const { data, isLoading, isStale, refetch } = useQuery<TestData>({
    cacheKey: ["stale-test-data"],
    url: "/api/test-data",
    staleTime: 5000, // 5초
    gcTime: 30000, // 30초
  });

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">StaleTime Test</h1>

      <div data-testid="client-data" className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Query Status</h2>
          <p>Loading: {isLoading ? "Yes" : "No"}</p>
          <p>Stale: {isStale ? "Yes" : "No"}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Data</h2>
          {data ? (
            <div>
              <p>
                <strong>Message:</strong> {data.message}
              </p>
              <p data-testid="data-timestamp">
                <strong>Timestamp:</strong>{" "}
                {new Date(data.timestamp).toLocaleString()}
              </p>
            </div>
          ) : null}
        </div>

        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Refetch Data
        </button>
      </div>
    </div>
  );
}
