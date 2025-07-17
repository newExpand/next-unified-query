"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useQuery, useQueryClient } from "../../../lib/query-client";

interface ProjectData {
  projectId: number;
  view: string;
  data: string;
  timestamp: number;
}

export default function ConditionalRoutingProjectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  // URL에서 프로젝트 ID 추출
  const projectId = parseInt(params.id as string) || 1;
  const [view, setView] = useState("overview");

  // URL 파라미터 동기화
  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam) {
      setView(viewParam);
    }
  }, [searchParams]);

  // URL 파라미터 기반 동적 쿼리 키
  const {
    data: projectData,
    isLoading,
    error,
  } = useQuery<ProjectData>({
    cacheKey: ["projects", projectId, "data", view],
    queryFn: async () => {
      // optimistic update: 뷰 변경 시 즉시 로딩 상태 표시
      queryClient.setQueryData(
        ["projects", projectId, "data", view],
        (old: ProjectData | undefined) => ({
          ...old,
          projectId,
          view,
          data: "로딩 중...",
          timestamp: Date.now(),
        })
      );

      const response = await fetch(
        `/api/projects/${projectId}/data?view=${view}`
      );
      if (!response.ok) {
        throw new Error(`프로젝트 데이터 로드 실패: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!projectId && !!view, // 프로젝트 ID와 뷰가 모두 있을 때만 실행
    staleTime: 1000 * 60 * 5, // 5분 동안 stale하지 않음 (캐시 테스트용)
  });

  const handleViewChange = (newView: string) => {
    setView(newView);
    // URL 업데이트
    router.push(`/conditional-routing/project/${projectId}?view=${newView}`);
  };

  const handleProjectChange = (newProjectId: number) => {
    // URL 업데이트
    router.push(`/conditional-routing/project/${newProjectId}?view=${view}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            조건부 라우팅 프로젝트 페이지
          </h1>

          {/* 프로젝트 및 뷰 선택 */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 프로젝트 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                프로젝트 선택
              </label>
              <select
                value={projectId}
                onChange={(e) => handleProjectChange(Number(e.target.value))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>프로젝트 1</option>
                <option value={2}>프로젝트 2</option>
                <option value={3}>프로젝트 3</option>
              </select>
            </div>

            {/* 뷰 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                뷰 선택
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewChange("overview")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === "overview"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => handleViewChange("tasks")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === "tasks"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  data-testid="tasks-view-btn"
                >
                  Tasks
                </button>
                <button
                  onClick={() => handleViewChange("analytics")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === "analytics"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Analytics
                </button>
              </div>
            </div>
          </div>

          {/* 현재 URL 정보 */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">현재 URL 정보</h3>
            <div className="text-sm text-blue-700">
              <p>
                프로젝트 ID: <span className="font-mono">{projectId}</span>
              </p>
              <p>
                뷰: <span className="font-mono">{view}</span>
              </p>
              <p>
                쿼리 키:{" "}
                <span className="font-mono">
                  [&quot;projects&quot;, {projectId}, &quot;data&quot;, &quot;
                  {view}&quot;]
                </span>
              </p>
            </div>
          </div>

          {/* 프로젝트 데이터 표시 */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">프로젝트 데이터</h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">데이터 로딩 중...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">에러 발생</p>
                <p className="text-red-600 text-sm mt-1">{error.message}</p>
              </div>
            ) : projectData ? (
              <div
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                data-testid="project-data"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">
                      프로젝트 정보
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-gray-600">ID:</span>{" "}
                        {projectData.projectId}
                      </p>
                      <p>
                        <span className="text-gray-600">뷰:</span>{" "}
                        {projectData.view}
                      </p>
                      <p>
                        <span className="text-gray-600">타임스탬프:</span>{" "}
                        {new Date(projectData.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">콘텐츠</h4>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm" data-testid="project-content">
                        {projectData.data}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                데이터를 불러올 수 없습니다
              </div>
            )}
          </div>

          {/* 쿼리 상태 및 캐시 정보 */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-3">쿼리 상태</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">상태:</span>
                  <span
                    className={`ml-2 font-medium ${
                      isLoading
                        ? "text-blue-600"
                        : error
                        ? "text-red-600"
                        : projectData
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {isLoading
                      ? "로딩 중"
                      : error
                      ? "에러"
                      : projectData
                      ? "완료"
                      : "대기"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">쿼리 키:</span>
                  <span className="ml-2 font-mono text-xs">
                    projects.{projectId}.data.{view}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">캐시 시간:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    5분 (staleTime)
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-600 text-sm">
                  <strong>조건부 쿼리 동작:</strong> 프로젝트 ID와 뷰 파라미터가
                  모두 있을 때만 쿼리가 실행됩니다. URL 변경 시 새로운 쿼리 키로
                  데이터를 다시 로드하며, 캐시된 데이터는 5분간 유지됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 테스트 시나리오 */}
          <div className="mt-6 border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-3">테스트 시나리오</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                <li>뷰 버튼을 클릭하여 URL과 쿼리 키 변경 확인</li>
                <li>프로젝트를 변경하여 새로운 데이터 로드 확인</li>
                <li>이전 프로젝트로 돌아가서 캐시 동작 확인</li>
                <li>브라우저 뒤로가기/앞으로가기 테스트</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
