"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

interface MemorySnapshot {
  iteration: number;
  used: number;
  total: number;
  limit: number;
  timestamp: number;
}

export default function MemoryMonitorPage() {
  const [snapshots, setSnapshots] = useState<MemorySnapshot[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [batchCount, setBatchCount] = useState(0);
  const queryClient = useQueryClient();

  // 메모리 정보 수집
  const collectMemoryInfo = (): MemorySnapshot | null => {
    if (typeof window !== "undefined" && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        iteration: batchCount,
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
    }
    return null;
  };

  // 쿼리 배치 생성 컴포넌트
  const QueryBatch = ({
    batchId,
    count,
  }: {
    batchId: number;
    count: number;
  }) => {
    const queries = Array.from({ length: count }, (_, i) => `${batchId}-${i}`);

    return (
      <>
        {queries.map((id) => (
          <QueryItem key={id} id={id} />
        ))}
      </>
    );
  };

  const QueryItem = ({ id }: { id: string }) => {
    const { data } = useQuery({
      cacheKey: ["memory-test", id],
      url: `/api/test-data`,
      params: { id, size: "small" },
    });

    return null;
  };

  const createQueriesBatch = () => {
    const newBatchCount = batchCount + 1;
    setBatchCount(newBatchCount);

    // 메모리 스냅샷 수집
    const snapshot = collectMemoryInfo();
    if (snapshot) {
      setSnapshots((prev) => [...prev, snapshot]);
    }
  };

  const cleanupCache = () => {
    queryClient.clear();

    // 가비지 컬렉션 실행 (가능한 경우)
    if (window.gc) {
      window.gc();
    }

    // 정리 후 메모리 스냅샷
    setTimeout(() => {
      const snapshot = collectMemoryInfo();
      if (snapshot) {
        setSnapshots((prev) => [...prev, { ...snapshot, iteration: -1 }]); // -1은 정리 후를 의미
      }
    }, 100);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    setSnapshots([]);
    setBatchCount(0);

    // 초기 메모리 상태
    const initialSnapshot = collectMemoryInfo();
    if (initialSnapshot) {
      setSnapshots([initialSnapshot]);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  // 메모리 통계 계산
  const getMemoryStats = () => {
    if (snapshots.length === 0) return null;

    const validSnapshots = snapshots.filter((s) => s.iteration >= 0);
    if (validSnapshots.length === 0) return null;

    const initialMemory = validSnapshots[0]?.used || 0;
    const maxMemory = Math.max(...validSnapshots.map((s) => s.used));
    const finalMemory = validSnapshots[validSnapshots.length - 1]?.used || 0;
    const cleanupSnapshot = snapshots.find((s) => s.iteration === -1);

    return {
      initialMB: initialMemory / (1024 * 1024),
      maxMB: maxMemory / (1024 * 1024),
      finalMB: finalMemory / (1024 * 1024),
      cleanupMB: cleanupSnapshot ? cleanupSnapshot.used / (1024 * 1024) : null,
      cleanupEffective: cleanupSnapshot
        ? cleanupSnapshot.used < maxMemory * 0.8
        : false,
    };
  };

  const memoryStats = getMemoryStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">메모리 사용량 모니터링</h1>

      <div className="flex gap-4 mb-6">
        <button
          data-testid="start-monitoring"
          onClick={startMonitoring}
          disabled={isMonitoring}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          모니터링 시작
        </button>

        <button
          data-testid="create-queries-batch"
          onClick={createQueriesBatch}
          disabled={!isMonitoring}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          쿼리 배치 생성 ({batchCount})
        </button>

        <button
          data-testid="cleanup-cache"
          onClick={cleanupCache}
          disabled={!isMonitoring}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
        >
          캐시 정리
        </button>

        <button
          data-testid="stop-monitoring"
          onClick={stopMonitoring}
          disabled={!isMonitoring}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
        >
          모니터링 종료
        </button>
      </div>

      {memoryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-100 rounded">
            <h3 className="font-semibold text-blue-800">초기 메모리</h3>
            <p className="text-xl font-bold text-blue-600">
              {memoryStats.initialMB.toFixed(1)}MB
            </p>
          </div>

          <div className="p-4 bg-red-100 rounded">
            <h3 className="font-semibold text-red-800">최대 메모리</h3>
            <p className="text-xl font-bold text-red-600">
              {memoryStats.maxMB.toFixed(1)}MB
            </p>
          </div>

          <div className="p-4 bg-green-100 rounded">
            <h3 className="font-semibold text-green-800">현재 메모리</h3>
            <p className="text-xl font-bold text-green-600">
              {memoryStats.finalMB.toFixed(1)}MB
            </p>
          </div>

          <div
            className={`p-4 rounded ${
              memoryStats.cleanupEffective ? "bg-green-100" : "bg-yellow-100"
            }`}
          >
            <h3
              className={`font-semibold ${
                memoryStats.cleanupEffective
                  ? "text-green-800"
                  : "text-yellow-800"
              }`}
            >
              정리 효과
            </h3>
            <p
              className={`text-xl font-bold ${
                memoryStats.cleanupEffective
                  ? "text-green-600"
                  : "text-yellow-600"
              }`}
            >
              {memoryStats.cleanupEffective ? "효과적" : "미흡"}
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">메모리 스냅샷 기록:</h3>
        <div className="bg-gray-100 rounded p-4 max-h-64 overflow-y-auto">
          {snapshots.length > 0 ? (
            <div className="space-y-2">
              {snapshots.map((snapshot, index) => (
                <div key={index} className="text-sm font-mono">
                  <span
                    className={
                      snapshot.iteration === -1 ? "text-red-600 font-bold" : ""
                    }
                  >
                    {snapshot.iteration === -1
                      ? "정리 후"
                      : `배치 ${snapshot.iteration}`}
                    :
                  </span>{" "}
                  {(snapshot.used / (1024 * 1024)).toFixed(1)}MB 사용 (총{" "}
                  {(snapshot.total / (1024 * 1024)).toFixed(1)}MB)
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">모니터링을 시작하세요.</div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">테스트 방법:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>모니터링 시작 버튼을 클릭합니다.</li>
          <li>
            쿼리 배치 생성 버튼을 여러 번 클릭하여 메모리 사용량을 증가시킵니다.
          </li>
          <li>중간에 캐시 정리 버튼을 클릭하여 정리 효과를 확인합니다.</li>
          <li>메모리 패턴을 분석하고 효율성을 평가합니다.</li>
        </ol>
      </div>

      {/* 쿼리 컴포넌트들 (숨겨짐) */}
      {isMonitoring && batchCount > 0 && (
        <div className="hidden">
          {Array.from({ length: batchCount }, (_, i) => (
            <QueryBatch key={i} batchId={i + 1} count={50} />
          ))}
        </div>
      )}
    </div>
  );
}
