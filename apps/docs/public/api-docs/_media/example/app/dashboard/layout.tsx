"use client";

import { useQuery } from "../lib/query-client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * 대시보드 레이아웃
 * 중첩 레이아웃과 상태 유지 테스트
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 사용자 프로필 쿼리 (레이아웃 레벨에서 유지)
  const { data: userProfile, isLoading } = useQuery<UserProfile>({
    cacheKey: ["user-profile"],
    queryFn: async () => {
      return {
        id: "user-1",
        name: "관리자",
        email: "admin@example.com",
        avatar: "https://picsum.photos/40/40?random=user",
      };
    },
  });

  return (
    <div data-testid="dashboard-layout" className="min-h-screen bg-gray-100">
      {/* 상단 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">대시보드</h1>

            {/* 사용자 아바타 */}
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              ) : (
                <div
                  data-testid="user-avatar"
                  className="flex items-center space-x-2"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    {userProfile?.name?.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-700">
                    {userProfile?.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* 사이드바 */}
          <nav
            data-testid="layout-sidebar"
            className="w-64 bg-white rounded-lg shadow p-6 mr-6"
          >
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className={`block px-4 py-2 rounded-md ${
                    pathname === "/dashboard"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  개요
                </Link>
              </li>
              <li>
                <Link
                  data-testid="nav-analytics"
                  href="/dashboard/analytics"
                  className={`block px-4 py-2 rounded-md ${
                    pathname === "/dashboard/analytics"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  분석
                </Link>
              </li>
              <li>
                <Link
                  data-testid="nav-settings"
                  href="/dashboard/settings"
                  className={`block px-4 py-2 rounded-md ${
                    pathname === "/dashboard/settings"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  설정
                </Link>
              </li>
            </ul>
          </nav>

          {/* 메인 컨텐츠 */}
          <main className="flex-1 bg-white rounded-lg shadow p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
