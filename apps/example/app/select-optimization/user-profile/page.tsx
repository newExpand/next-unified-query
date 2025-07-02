"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useQuery } from "../../lib/query-client";

interface UserData {
  user: {
    id: number;
    name: string;
    email: string;
    profile: {
      bio: string;
      skills: string[];
    };
  };
  metadata: {
    lastLogin: string;
    preferences: { theme: string; language: string };
  };
}

interface SelectResult {
  displayName: string;
  skillsCount: number;
  bio: string;
  filteredName: boolean;
}

export default function UserProfileSelectOptimizationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [nameFilter, setNameFilter] = useState("");
  const [testMode, setTestMode] = useState<"with-memo" | "without-memo">("without-memo");
  const selectCallCountRef = useRef(0);

  // 버전 1: useMemo로 메모이제이션 (기존 방식)
  const selectFunctionWithMemo = useMemo(() => {
    console.log("🔄 Creating new select function with useMemo - nameFilter:", nameFilter);
    return (data: UserData) => {
      selectCallCountRef.current++;
      console.log(
        `🎯 Select function executing (call #${selectCallCountRef.current}) - nameFilter: ${nameFilter}`
      );

      return {
        displayName: `${data.user.name} (${data.user.email})`,
        skillsCount: data.user.profile.skills.length,
        bio: data.user.profile.bio,
        filteredName: nameFilter ? data.user.name.includes(nameFilter) : true,
      };
    };
  }, [nameFilter]);

  // 버전 2: 순수 함수 + selectDeps (라이브러리 최적화)
  const selectFunctionWithoutMemo = (data: UserData) => {
    selectCallCountRef.current++;
    console.log(
      `🎯 Select function executing (call #${selectCallCountRef.current}) - nameFilter: ${nameFilter}`
    );

    return {
      displayName: `${data.user.name} (${data.user.email})`,
      skillsCount: data.user.profile.skills.length,
      bio: data.user.profile.bio,
      filteredName: nameFilter ? data.user.name.includes(nameFilter) : true,
    };
  };

  const currentSelectFunction = testMode === "with-memo" ? selectFunctionWithMemo : selectFunctionWithoutMemo;

  const { data, isLoading } = useQuery({
    cacheKey: ["user-data"], // 동일한 cacheKey 사용 - 라이브러리의 실제 메모이제이션 테스트
    url: "/api/user-data",
    select: currentSelectFunction, // select 함수 참조가 변경될 때만 재실행되어야 함
    selectDeps: testMode === "without-memo" ? [nameFilter] : undefined, // selectDeps로 의존성 추적
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Select Function Optimization Test
      </h1>

      <div className="space-y-4">
        <div data-testid="select-call-count">
          Select function calls:{" "}
          <span data-testid="select-call-number">
            {selectCallCountRef.current}
          </span>
        </div>

        <div className="mb-4">
          <label className="font-semibold">테스트 모드: </label>
          <select 
            value={testMode} 
            onChange={(e) => {
              setTestMode(e.target.value as "with-memo" | "without-memo");
              selectCallCountRef.current = 0; // 카운터 리셋
            }}
            className="ml-2 p-1 border rounded"
          >
            <option value="with-memo">useMemo 사용 (기존 방식)</option>
            <option value="without-memo">순수 함수 + selectDeps (라이브러리 최적화)</option>
          </select>
        </div>

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
          {testMode === "with-memo" ? (
            <>
              <p>
                <strong>🔧 기존 방식:</strong> useMemo로 select 함수 메모이제이션
              </p>
              <p>nameFilter 변경 시에만 새로운 select 함수 생성</p>
            </>
          ) : (
            <>
              <p>
                <strong>✅ 라이브러리 최적화:</strong> 순수 함수 + selectDeps 사용
              </p>
              <p>라이브러리가 함수 참조와 selectDeps를 비교하여 자동 메모이제이션</p>
            </>
          )}
          <p className="mt-2">
            <strong>🎯 테스트:</strong> sidebar/theme 변경 시 select 함수 호출 없어야 함, nameFilter 변경 시에만 호출
          </p>
        </div>

        {/* 관련 없는 상태 변경 버튼들 */}
        <div className="space-x-4">
          <button
            data-testid="toggle-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Toggle Sidebar ({sidebarOpen ? "Open" : "Closed"})
          </button>

          <button
            data-testid="change-theme-btn"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Change Theme ({theme})
          </button>
        </div>

        {/* 데이터 관련 필터 변경 버튼 */}
        <div>
          <button
            data-testid="change-name-filter-btn"
            onClick={() => setNameFilter(nameFilter === "" ? "John" : "")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Toggle Name Filter ({nameFilter || "None"})
          </button>
        </div>

        {/* 사용자 프로필 데이터 */}
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div data-testid="user-profile">
            <div data-testid="user-display-name">
              {(data as any)?.displayName}
            </div>
            <div data-testid="skills-count">
              {(data as any)?.skillsCount} skills
            </div>
            <div>Bio: {(data as any)?.bio}</div>
            <div>
              Name Filter Match: {(data as any)?.filteredName ? "Yes" : "No"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
