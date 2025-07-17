"use client";

import { useQuery, useQueryClient } from "../lib/query-client";
import { useEffect, useState } from "react";

export default function DebugCachePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split("T")[1];
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  // Check cache state before query
  useEffect(() => {
    const cacheKey = ["debug-static-data"];
    const cached = queryClient.get(cacheKey);
    if (cached) {
      addLog(
        `Cache found: data exists, updatedAt: ${new Date(
          cached.updatedAt
        ).toISOString()}`
      );
      addLog(
        `Is stale? ${Date.now() - cached.updatedAt >= Infinity ? "Yes" : "No"}`
      );
    } else {
      addLog("No cache found");
    }
  }, [queryClient]);

  const { data, isLoading, error } = useQuery({
    cacheKey: ["debug-static-data"],
    queryFn: async () => {
      addLog("queryFn called!");
      const response = await fetch("/api/static-data");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result = await response.json();
      addLog(`Fetched data: ${JSON.stringify(result).substring(0, 50)}...`);
      return result;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Log when data changes
  useEffect(() => {
    if (data) {
      addLog(`Data loaded: ${JSON.stringify(data).substring(0, 50)}...`);
    }
  }, [data]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Cache Behavior</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Configuration</h2>
        <ul className="text-sm">
          <li>staleTime: Infinity</li>
          <li>gcTime: Infinity</li>
          <li>cacheKey: [&quot;debug-static-data&quot;]</li>
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Current State</h2>
        <div className="text-sm">
          <p>Loading: {isLoading ? "Yes" : "No"}</p>
          <p>Error: {error ? error.message : "None"}</p>
          <p>Data: {data ? "Loaded" : "Not loaded"}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-xs h-64 overflow-y-auto">
          {logs && logs.length > 0 ? (
            logs.map((log, index) => <div key={index}>{log}</div>)
          ) : (
            <div>No logs</div>
          )}
        </div>
      </div>

      <div className="space-x-2">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Hard Refresh
        </button>
        <button
          onClick={() => {
            addLog("Clearing logs...");
            setLogs([]);
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}
