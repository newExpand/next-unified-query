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

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  const {
    data: userProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery<UserProfile>({
    cacheKey: ["user", "profile"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      return response.json() as Promise<UserProfile>;
    },
    enabled: isAuthenticated,
  });

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery<DashboardData>({
    cacheKey: ["dashboard", "data"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/dashboard/data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      return response.json() as Promise<DashboardData>;
    },
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
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
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (profileError || dashboardError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>데이터를 불러오는데 실패했습니다.</p>
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
            <div className="mt-8">
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
