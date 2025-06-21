"use client";

import { useState, useEffect } from "react";
import { useQuery } from "../../lib/query-client";

interface AdminData {
  totalRevenue: number;
  systemHealth: string;
  userRegistrations: number;
}

interface UserDashboardData {
  myTasks: number;
  notifications: number;
  recentProjects: string[];
}

type UserRole = "user" | "admin";

export default function RoleBasedPermissions() {
  const [currentRole, setCurrentRole] = useState<UserRole>("user");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 초기 상태 설정
    setIsLoggedIn(true);
    localStorage.setItem("user_role", currentRole);
  }, []);

  // 관리자 전용 데이터 (role이 admin일 때만 실행)
  const { data: adminData, isLoading: adminLoading } = useQuery<AdminData>({
    cacheKey: ["admin", "analytics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/analytics", {
        headers: {
          Authorization: "Bearer token",
          "X-User-Role": currentRole,
        },
      });

      if (!response.ok) {
        throw new Error("Forbidden");
      }

      return response.json() as Promise<AdminData>;
    },
    enabled: isLoggedIn && currentRole === "admin",
  });

  // 일반 사용자 데이터 (항상 실행)
  const { data: userDashboardData, isLoading: userLoading } =
    useQuery<UserDashboardData>({
      cacheKey: ["user", "dashboard"],
      queryFn: async () => {
        const response = await fetch("/api/user/dashboard", {
          headers: {
            Authorization: "Bearer token",
            "X-User-Role": currentRole,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user dashboard");
        }

        return response.json() as Promise<UserDashboardData>;
      },
      enabled: isLoggedIn,
    });

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    localStorage.setItem("user_role", newRole);

    // 글로벌 상태 업데이트 (E2E 테스트용)
    (window as any).__CURRENT_USER_ROLE__ = newRole;
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem("access_token", `token_${Date.now()}`);
    localStorage.setItem("user_role", currentRole);
  };

  const handleChangeRole = () => {
    // 역할 변경 시뮬레이션 (기존 로그인 상태 유지)
    handleRoleChange(currentRole);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">권한별 접근 제어 테스트</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={currentRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="border border-gray-300 rounded px-3 py-1"
                data-testid="role-select"
              >
                <option value="user">일반 사용자</option>
                <option value="admin">관리자</option>
              </select>
              {!isLoggedIn ? (
                <button
                  onClick={handleLogin}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  data-testid="simulate-login-btn"
                >
                  로그인 시뮬레이션
                </button>
              ) : (
                <button
                  onClick={handleChangeRole}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  data-testid="change-role-btn"
                >
                  역할 변경 적용
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-medium text-blue-900 mb-2">
                현재 권한 정보
              </h2>
              <p className="text-blue-700">
                역할: <strong>{currentRole}</strong>
              </p>
              <p className="text-blue-700">
                로그인 상태:{" "}
                <strong>{isLoggedIn ? "로그인됨" : "로그아웃됨"}</strong>
              </p>
            </div>
          </div>

          {/* 일반 사용자 대시보드 (항상 표시) */}
          {userDashboardData && (
            <div className="mb-8" data-testid="user-dashboard">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                사용자 대시보드
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-semibold">T</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            내 작업
                          </dt>
                          <dd
                            className="text-lg font-medium text-gray-900"
                            data-testid="my-tasks"
                          >
                            {userDashboardData.myTasks}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-semibold">N</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            알림
                          </dt>
                          <dd
                            className="text-lg font-medium text-gray-900"
                            data-testid="notifications-count"
                          >
                            {userDashboardData.notifications}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    최근 프로젝트
                  </h4>
                  <ul className="space-y-1">
                    {userDashboardData.recentProjects.map((project, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {project}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 관리자 전용 분석 (admin 권한일 때만 표시) */}
          {currentRole === "admin" && adminData && (
            <div className="mb-8" data-testid="admin-analytics">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                관리자 분석
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-semibold">$</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            총 수익
                          </dt>
                          <dd
                            className="text-lg font-medium text-gray-900"
                            data-testid="total-revenue"
                          >
                            ${adminData.totalRevenue.toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-semibold">S</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            시스템 상태
                          </dt>
                          <dd
                            className="text-lg font-medium text-gray-900"
                            data-testid="system-health"
                          >
                            {adminData.systemHealth}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-semibold">U</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            신규 가입
                          </dt>
                          <dd
                            className="text-lg font-medium text-gray-900"
                            data-testid="user-registrations"
                          >
                            {adminData.userRegistrations}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  API 호출 상태
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    사용자 대시보드 API:{" "}
                    {userLoading
                      ? "로딩 중"
                      : userDashboardData
                      ? "완료"
                      : "대기"}
                  </p>
                  <p>
                    관리자 분석 API:{" "}
                    {currentRole === "admin"
                      ? adminLoading
                        ? "로딩 중"
                        : adminData
                        ? "완료"
                        : "대기"
                      : "비활성화 (권한 없음)"}
                  </p>
                  <p className="text-gray-500">
                    관리자 API는 역할이 'admin'일 때만 호출됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
