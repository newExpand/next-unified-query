"use client";

import { useState, useRef } from "react";
import { useQuery } from "../../lib/query-client";

export default function UserProfileSelectOptimizationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [nameFilter, setNameFilter] = useState("");
  const selectCallCountRef = useRef(0);

  const { data, isLoading } = useQuery({
    cacheKey: ["user-data"],
    url: "/api/user-data",
    select: (data: any) => {
      selectCallCountRef.current++;

      return {
        displayName: `${data.user.name} (${data.user.email})`,
        skillsCount: data.user.profile.skills.length,
        bio: data.user.profile.bio,
        filteredName: nameFilter ? data.user.name.includes(nameFilter) : true,
      };
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Select Function Optimization Test
      </h1>

      <div className="space-y-4">
        <div data-testid="select-call-count">
          Select function calls: {selectCallCountRef.current}
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
            <div data-testid="user-display-name">{data?.displayName}</div>
            <div data-testid="skills-count">{data?.skillsCount} skills</div>
            <div>Bio: {data?.bio}</div>
            <div>Name Filter Match: {data?.filteredName ? "Yes" : "No"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
