"use client";

import { useQuery } from "../../lib/query-client";
import { useEffect, useState } from "react";

interface HeavyData {
  id: string;
  title: string;
  data: number[];
  processedData: number;
  timestamp: string;
}

/**
 * 무거운 컴포넌트
 * 동적으로 로드되며 복잡한 데이터 처리를 수행
 */
export default function HeavyComponent() {
  const [processedCount, setProcessedCount] = useState(0);

  // 무거운 컴포넌트와 연관된 쿼리
  const { data, isLoading, error } = useQuery<HeavyData>({
    cacheKey: ["heavy-component-data"],
    queryFn: async () => {
      // 시뮬레이션된 복잡한 데이터 처리
      const largeData = Array.from({ length: 10000 }, (_, i) => Math.random());
      const processedData = largeData.reduce((sum, val) => sum + val, 0);

      return {
        id: "heavy-1",
        title: "무거운 컴포넌트 데이터",
        data: largeData.slice(0, 10), // 처음 10개만 표시
        processedData,
        timestamp: new Date().toISOString(),
      };
    },
  });

  // 컴포넌트 로드 시 처리 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setProcessedCount((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-100 rounded">
        무거운 컴포넌트 데이터 로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 rounded">무거운 컴포넌트 로딩 실패</div>
    );
  }

  return (
    <div data-testid="heavy-component" className="p-4 bg-green-100 rounded">
      <h2 className="text-lg font-semibold mb-4">무거운 컴포넌트 로딩 완료!</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium">처리 진행도</h3>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processedCount}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{processedCount}% 완료</p>
        </div>

        {data && (
          <div data-testid="heavy-component-data">
            <h3 className="font-medium">처리된 데이터</h3>
            <p className="text-sm">제목: {data.title}</p>
            <p className="text-sm">
              처리된 값: {data.processedData.toFixed(2)}
            </p>
            <p className="text-sm">
              샘플 데이터:{" "}
              {data.data
                .slice(0, 5)
                .map((n) => n.toFixed(3))
                .join(", ")}
              ...
            </p>
            <p className="text-sm text-gray-500">
              타임스탬프: {data.timestamp}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>이 컴포넌트는 동적으로 로드되었습니다.</p>
        <p>복잡한 데이터 처리와 쿼리를 함께 수행합니다.</p>
      </div>
    </div>
  );
}
