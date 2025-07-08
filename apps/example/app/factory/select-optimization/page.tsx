"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";
import { z } from "zod";

// 대용량 데이터 스키마
const _largeDatasetSchema = z.object({
  users: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      profile: z.object({
        bio: z.string(),
        avatar: z.string(),
        preferences: z.object({
          theme: z.string(),
          language: z.string(),
          notifications: z.boolean(),
        }),
      }),
      posts: z.array(
        z.object({
          id: z.number(),
          title: z.string(),
          content: z.string(),
          tags: z.array(z.string()),
          createdAt: z.string(),
        })
      ),
    })
  ),
  metadata: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }),
});

type LargeDataset = z.infer<typeof _largeDatasetSchema>;

// 선택적 데이터 타입들
type NamesOnlyData = {
  names: Array<{
    id: number;
    name: string;
  }>;
  total: number;
};

type EmailsOnlyData = {
  emails: Array<{
    id: number;
    email: string;
  }>;
  total: number;
};

export default function SelectOptimization() {
  const [selectMode, setSelectMode] = useState<"full" | "names" | "emails">(
    "full"
  );
  const [performanceData, setPerformanceData] = useState<{
    queryTime: number;
    renderTime: number;
    dataSize: number;
  } | null>(null);

  // 전체 데이터 쿼리 (select 없음)
  const { data: fullData, isLoading: fullLoading } = useQuery<LargeDataset>({
    cacheKey: ["large-dataset", "full"],
    queryFn: async () => {
      const startTime = performance.now();
      const response = await fetch("/api/large-dataset");

      if (!response.ok) {
        throw new Error("Failed to fetch dataset");
      }

      const result = (await response.json()) as LargeDataset;
      const queryTime = performance.now() - startTime;

      // 성능 데이터 저장
      const renderStart = performance.now();
      setTimeout(() => {
        const renderTime = performance.now() - renderStart;
        setPerformanceData({
          queryTime,
          renderTime,
          dataSize: JSON.stringify(result).length,
        });
      }, 0);

      return result;
    },
    enabled: selectMode === "full",
  });

  // 이름만 선택하는 쿼리
  const { data: namesData, isLoading: namesLoading } = useQuery<NamesOnlyData>({
    cacheKey: ["large-dataset", "names"],
    queryFn: async () => {
      const startTime = performance.now();
      const response = await fetch("/api/large-dataset");

      if (!response.ok) {
        throw new Error("Failed to fetch dataset");
      }

      const fullResult = (await response.json()) as LargeDataset;

      // select 함수 시뮬레이션 - 이름만 추출
      const selectedData = {
        names: fullResult.users.map((user) => ({
          id: user.id,
          name: user.name,
        })),
        total: fullResult.metadata.total,
      };

      const queryTime = performance.now() - startTime;

      const renderStart = performance.now();
      setTimeout(() => {
        const renderTime = performance.now() - renderStart;
        setPerformanceData({
          queryTime,
          renderTime,
          dataSize: JSON.stringify(selectedData).length,
        });
      }, 0);

      return selectedData;
    },
    enabled: selectMode === "names",
  });

  // 이메일만 선택하는 쿼리
  const { data: emailsData, isLoading: emailsLoading } =
    useQuery<EmailsOnlyData>({
      cacheKey: ["large-dataset", "emails"],
      queryFn: async () => {
        const startTime = performance.now();
        const response = await fetch("/api/large-dataset");

        if (!response.ok) {
          throw new Error("Failed to fetch dataset");
        }

        const fullResult = (await response.json()) as LargeDataset;

        // select 함수 시뮬레이션 - 이메일만 추출
        const selectedData = {
          emails: fullResult.users.map((user) => ({
            id: user.id,
            email: user.email,
          })),
          total: fullResult.metadata.total,
        };

        const queryTime = performance.now() - startTime;

        const renderStart = performance.now();
        setTimeout(() => {
          const renderTime = performance.now() - renderStart;
          setPerformanceData({
            queryTime,
            renderTime,
            dataSize: JSON.stringify(selectedData).length,
          });
        }, 0);

        return selectedData;
      },
      enabled: selectMode === "emails",
    });

  const currentData =
    selectMode === "full"
      ? fullData
      : selectMode === "names"
      ? namesData
      : emailsData;
  const isLoading = fullLoading || namesLoading || emailsLoading;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Select 함수 최적화 테스트
          </h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Select 모드 선택
              </h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectMode("full")}
                  className={`px-4 py-2 rounded ${
                    selectMode === "full"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  data-testid="full-data-btn"
                >
                  전체 데이터
                </button>
                <button
                  onClick={() => setSelectMode("names")}
                  className={`px-4 py-2 rounded ${
                    selectMode === "names"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  data-testid="names-only-btn"
                >
                  이름만
                </button>
                <button
                  onClick={() => setSelectMode("emails")}
                  className={`px-4 py-2 rounded ${
                    selectMode === "emails"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  data-testid="emails-only-btn"
                >
                  이메일만
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                <strong>현재 모드:</strong> {selectMode}
              </p>
              <p>
                <strong>설명:</strong>{" "}
                {selectMode === "full"
                  ? "모든 사용자 데이터 (프로필, 게시물 포함)"
                  : selectMode === "names"
                  ? "사용자 ID와 이름만 선택"
                  : "사용자 ID와 이메일만 선택"}
              </p>
            </div>
          </div>
        </div>

        {/* 성능 데이터 */}
        {performanceData && (
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="performance-data"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              성능 측정 결과
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-medium text-blue-900 mb-1">쿼리 시간</h3>
                <p
                  className="text-2xl font-bold text-blue-700"
                  data-testid="query-time"
                >
                  {performanceData.queryTime.toFixed(2)}ms
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-medium text-green-900 mb-1">렌더링 시간</h3>
                <p
                  className="text-2xl font-bold text-green-700"
                  data-testid="render-time"
                >
                  {performanceData.renderTime.toFixed(2)}ms
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <h3 className="font-medium text-purple-900 mb-1">
                  데이터 크기
                </h3>
                <p
                  className="text-2xl font-bold text-purple-700"
                  data-testid="data-size"
                >
                  {(performanceData.dataSize / 1024).toFixed(1)}KB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 데이터 표시 */}
        {isLoading ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <p className="text-gray-500">데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : currentData ? (
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="selected-data"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              선택된 데이터
            </h2>

            {selectMode === "full" && fullData && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>총 사용자: {fullData.metadata.total}명</p>
                  <p>
                    첫 번째 사용자의 게시물:{" "}
                    {fullData.users[0]?.posts.length || 0}개
                  </p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {fullData.users.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className="border-b border-gray-200 pb-4 mb-4"
                    >
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        {user.profile.bio}
                      </p>
                      <p className="text-xs text-gray-400">
                        게시물 {user.posts.length}개
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectMode === "names" && namesData && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>총 사용자: {namesData.total}명 (이름만 표시)</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {namesData.names.slice(0, 12).map((user) => (
                    <div key={user.id} className="p-2 bg-gray-50 rounded">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">ID: {user.id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectMode === "emails" && emailsData && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>총 사용자: {emailsData.total}명 (이메일만 표시)</p>
                </div>
                <div className="space-y-2">
                  {emailsData.emails.slice(0, 10).map((user) => (
                    <div
                      key={user.id}
                      className="p-2 bg-gray-50 rounded flex justify-between"
                    >
                      <span className="text-sm">{user.email}</span>
                      <span className="text-xs text-gray-500">
                        ID: {user.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* 최적화 설명 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Select 함수 최적화 효과
          </h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              <strong>전체 데이터:</strong> 모든 필드를 포함하여 메모리 사용량과
              렌더링 시간이 많이 소요
            </p>
            <p>
              <strong>선택적 데이터:</strong> 필요한 필드만 추출하여 성능 개선
            </p>
            <p>
              <strong>실제 차이:</strong> 데이터 크기와 렌더링 시간을
              비교해보세요
            </p>
            <p>
              <strong>권장사항:</strong> 대용량 데이터에서는 select 함수를
              사용하여 필요한 데이터만 추출
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
