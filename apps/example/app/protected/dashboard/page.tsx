"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ProtectedDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // SSR 호환성을 위해 클라이언트에서만 localStorage 접근
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      setAuthToken(token);
      setIsAuthenticated(true);

      // Storage event listener for multi-tab logout synchronization
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "accessToken" && e.newValue === null) {
          // Token was removed in another tab, redirect to login
          router.push("/auth/login");
        }
      };

      window.addEventListener("storage", handleStorageChange);
      
      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, [router]);

  const {
    data: userProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery<UserProfile>({
    cacheKey: ["user", "profile"],
    url: "/api/user/profile",
    fetchConfig: {
      headers: authToken ? {
        Authorization: `Bearer ${authToken}`,
      } : {},
    },
    enabled: isAuthenticated && !!authToken,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery<DashboardData>({
    cacheKey: ["dashboard", "data"],
    url: "/api/dashboard/data",
    fetchConfig: {
      headers: authToken ? {
        Authorization: `Bearer ${authToken}`,
      } : {},
    },
    enabled: isAuthenticated && !!authToken,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const handleLogout = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken, refreshToken }),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear tokens and redirect
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user_role");
    delete (window as any).__AUTH_TOKENS__;
    router.push("/auth/login");
  };

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="login-form"
      >
        <div className="text-center">
          <p>로그인이 필요합니다...</p>
        </div>
      </div>
    );
  }

  if (profileLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" data-testid="loading-indicator"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (profileError || dashboardError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>데이터를 불러오는데 실패했습니다.</p>
          <div className="mt-4">
            <p data-testid="offline-message">오프라인 상태입니다.</p>
            <button
              onClick={() => refetchDashboard()}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              data-testid="retry-btn"
            >
              재시도
            </button>
          </div>
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
              <h1 className="text-xl font-semibold">대시보드</h1>
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
                onClick={() => refetchDashboard()}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 mr-2"
                data-testid="refresh-data-btn"
              >
                새로고침
              </button>
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
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="existing-data">
              <div className="bg-white overflow-hidden shadow rounded-lg" data-testid="dashboard-data">
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
                          {dashboardData.stats.totalUsers}
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
                          {dashboardData.stats.activeUsers}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {dashboardData && dashboardData.recentActivity.length > 0 && (
            <div className="mt-8" data-testid="updated-data">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    최근 활동
                  </h3>
                  <ul className="space-y-2" data-testid="recent-activity">
                    {dashboardData.recentActivity.map((activity, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
