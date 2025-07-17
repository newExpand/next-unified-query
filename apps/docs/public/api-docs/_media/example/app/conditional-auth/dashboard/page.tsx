"use client";

import { useState, useEffect } from "react";
import { useQuery } from "../../lib/query-client";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface DashboardData {
  stats: {
    totalUsers: number;
    activeUsers: number;
  };
  recentActivity: string[];
}

export default function ConditionalAuthDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // 초기 로그인 상태 확인
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
  }, []);

  // 로그인 상태에서만 활성화되는 쿼리들
  const { data: userProfile, isLoading: profileLoading } =
    useQuery<UserProfile>({
      cacheKey: ["user", "profile"],
      queryFn: async () => {
        const token = localStorage.getItem("access_token");
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token || "null"}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        return response.json() as Promise<UserProfile>;
      },
      enabled: isLoggedIn, // 로그인 상태에서만 실행
    });

  const { data: dashboardData, isLoading: dashboardLoading } =
    useQuery<DashboardData>({
      cacheKey: ["dashboard", "data"],
      queryFn: async () => {
        const token = localStorage.getItem("access_token");
        const response = await fetch("/api/dashboard/data", {
          headers: {
            Authorization: `Bearer ${token || "null"}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        return response.json() as Promise<DashboardData>;
      },
      enabled: isLoggedIn, // 로그인 상태에서만 실행
    });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 토큰 시뮬레이션
    const accessToken = `access_token_${Date.now()}`;
    const refreshToken = `refresh_token_${Date.now()}`;

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem(
      "user_role",
      username.includes("admin") ? "admin" : "user"
    );

    // 글로벌 상태에 토큰 저장
    (window as any).__AUTH_TOKENS__ = {
      accessToken,
      refreshToken,
      role: username.includes("admin") ? "admin" : "user",
    };

    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    delete (window as any).__AUTH_TOKENS__;
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              조건부 인증 테스트
            </h2>
          </div>
          <form
            className="mt-8 space-y-6"
            onSubmit={handleLogin}
            data-testid="login-form"
          >
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="사용자명 (예: john@example.com)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  data-testid="username-input"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="password-input"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                data-testid="login-btn"
              >
                로그인
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard-content">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">조건부 인증 대시보드</h1>
            </div>
            <div className="flex items-center space-x-4">
              {userProfile && (
                <div
                  className="flex items-center space-x-2"
                  data-testid="user-profile"
                >
                  <span data-testid="user-name">{userProfile.name}</span>
                  <span className="text-gray-500">({userProfile.role})</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                data-testid="logout-btn"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {profileLoading || dashboardLoading ? (
            <div className="text-center">
              <p>로딩 중...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">U</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          총 사용자
                        </dt>
                        <dd
                          className="text-lg font-medium text-gray-900"
                          data-testid="total-users"
                        >
                          {dashboardData?.stats.totalUsers || 0}
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
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">A</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          활성 사용자
                        </dt>
                        <dd
                          className="text-lg font-medium text-gray-900"
                          data-testid="active-users"
                        >
                          {dashboardData?.stats.activeUsers || 0}
                        </dd>
                      </dl>
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
                  쿼리 실행 상태
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    사용자 프로필 쿼리:{" "}
                    {profileLoading ? "실행 중" : userProfile ? "완료" : "대기"}
                  </p>
                  <p>
                    대시보드 데이터 쿼리:{" "}
                    {dashboardLoading
                      ? "실행 중"
                      : dashboardData
                      ? "완료"
                      : "대기"}
                  </p>
                  <p className="text-gray-500">
                    위 쿼리들은 로그인 상태({isLoggedIn ? "true" : "false"}
                    )에서만 실행됩니다.
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
