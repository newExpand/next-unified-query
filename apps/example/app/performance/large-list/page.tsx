"use client";

import { useState, useEffect } from "react";
import { useQuery } from "../../lib/query-client";

interface ListItem {
  id: number;
  name: string;
  description: string;
  value: number;
}

export default function LargeListPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [layoutShiftScore, setLayoutShiftScore] = useState(0);

  // 1000개 아이템 로드
  const { data: listData, isLoading } = useQuery<ListItem[]>({
    cacheKey: ["large-list"],
    url: `/api/large-dataset`,
    params: { count: 1000, type: "list" },
    select: (data: any) => {
      // 새로운 API 응답 구조에 맞게 데이터 변환
      const items = data?.items || [];
      return Array.isArray(items)
        ? items.map((item: any, index: number) => ({
            id: item.id || index + 1,
            name: item.title || item.name || `아이템 ${index + 1}`,
            description: item.description || `설명 ${index + 1}`,
            value: item.score || Math.floor(Math.random() * 1000),
          }))
        : [];
    },
  });

  // 레이아웃 시프트 측정
  useEffect(() => {
    let cumulativeScore = 0;

    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (
            entry.entryType === "layout-shift" &&
            !(entry as any).hadRecentInput
          ) {
            cumulativeScore += (entry as any).value;
          }
        }
        setLayoutShiftScore(cumulativeScore);
        window.__LAYOUT_SHIFT_SCORE__ = cumulativeScore;
      });

      observer.observe({ entryTypes: ["layout-shift"] });

      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!isLoading && listData && listData.length > 0) {
      setIsLoaded(true);
    }
  }, [isLoading, listData]);

  const updateList = () => {
    // 리스트 업데이트 시뮬레이션 (리렌더링 트리거)
    setIsUpdated(true);
    setTimeout(() => setIsUpdated(false), 100);
  };

  const ListItem = ({ item }: { item: ListItem }) => (
    <div
      className={`p-4 border rounded mb-2 transition-colors ${
        isUpdated ? "bg-yellow-50" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{item.name}</h3>
          <p className="text-gray-600 text-sm mt-1">{item.description}</p>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-blue-600">{item.value}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        대량 리스트 렌더링 성능 테스트
      </h1>

      <div className="flex gap-4 mb-6">
        <button
          data-testid="load-large-list"
          onClick={() => window.location.reload()}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? "로딩 중..." : "1000개 아이템 새로고침"}
        </button>

        <button
          data-testid="update-list"
          onClick={updateList}
          disabled={!isLoaded}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          리스트 업데이트
        </button>
      </div>

      {isLoaded && (
        <div data-testid="list-loaded" className="mb-4">
          <p className="text-green-600 font-semibold">
            리스트가 로드되었습니다!
          </p>
        </div>
      )}

      {isUpdated && (
        <div data-testid="list-updated" className="mb-4">
          <p className="text-blue-600 font-semibold">
            리스트가 업데이트되었습니다!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-100 rounded">
          <h3 className="font-semibold text-blue-800">아이템 수</h3>
          <p className="text-2xl font-bold text-blue-600">
            {listData?.length || 0}
          </p>
        </div>

        <div className="p-4 bg-green-100 rounded">
          <h3 className="font-semibold text-green-800">로딩 상태</h3>
          <p className="text-2xl font-bold text-green-600">
            {isLoading ? "로딩 중" : "완료"}
          </p>
        </div>

        <div className="p-4 bg-purple-100 rounded">
          <h3 className="font-semibold text-purple-800">CLS 점수</h3>
          <p className="text-2xl font-bold text-purple-600">
            {layoutShiftScore.toFixed(4)}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">성능 메트릭:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>목표 CLS 점수: 0.1 이하 (Good)</li>
          <li>렌더링 시간: 가능한 빠르게</li>
          <li>메모리 사용량: 적절한 수준 유지</li>
          <li>스크롤 성능: 부드러운 스크롤</li>
        </ul>
      </div>

      {/* 대량 리스트 렌더링 */}
      <div className="max-h-96 overflow-y-auto border rounded p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">데이터를 로딩 중입니다...</div>
          </div>
        ) : listData && listData.length > 0 ? (
          <div>
            {listData.map((item) => (
              <ListItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            데이터를 불러올 수 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
