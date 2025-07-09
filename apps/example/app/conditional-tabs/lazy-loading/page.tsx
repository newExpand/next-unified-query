"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";
import { 
  conditionalQueries, 
  type OverviewData, 
  type AnalyticsData, 
  type SettingsData 
} from "../../lib/conditional-queries-factory";

type TabType = "overview" | "analytics" | "settings";

export default function LazyLoadingTabsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Overview 탭 데이터 (Factory 패턴 사용)
  const { data: overviewData, isLoading: overviewLoading } = useQuery<OverviewData>(
    conditionalQueries.dashboardOverview,
    {
      enabled: activeTab === "overview", // Overview 탭이 활성화되었을 때만 실행
    }
  );

  // Analytics 탭 데이터 (Factory 패턴 사용)
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsData>(
    conditionalQueries.dashboardAnalytics,
    {
      enabled: activeTab === "analytics", // Analytics 탭이 활성화되었을 때만 실행
    }
  );

  // Settings 탭 데이터 (Factory 패턴 사용)
  const { data: settingsData, isLoading: settingsLoading } = useQuery<SettingsData>(
    conditionalQueries.dashboardSettings,
    {
      enabled: activeTab === "settings", // Settings 탭이 활성화되었을 때만 실행
    }
  );

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Lazy Loading 탭 (조건부 쿼리)
          </h1>

          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                data-testid="overview-tab"
              >
                Overview
                {overviewData && (
                  <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                    ✓
                  </span>
                )}
              </button>
              
              <button
                onClick={() => handleTabChange("analytics")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "analytics"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                data-testid="analytics-tab"
              >
                Analytics
                {analyticsData && (
                  <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                    ✓
                  </span>
                )}
              </button>
              
              <button
                onClick={() => handleTabChange("settings")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "settings"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                data-testid="settings-tab"
              >
                Settings
                {settingsData && (
                  <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                    ✓
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="min-h-[400px]">
            {/* Overview 탭 */}
            {activeTab === "overview" && (
              <div>
                {overviewLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Overview 데이터 로딩 중...</p>
                  </div>
                ) : overviewData ? (
                  <div data-testid="overview-content">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">대시보드 개요</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-800 mb-2">요약</h3>
                        <p className="text-blue-700 text-sm">{overviewData.summary}</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-medium text-green-800 mb-2">통계</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-700">총 사용자:</span>
                            <span className="font-medium" data-testid="total-users">
                              {overviewData.stats.users}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">총 매출:</span>
                            <span className="font-medium">
                              ${overviewData.stats.sales.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Overview 데이터를 불러올 수 없습니다
                  </div>
                )}
              </div>
            )}

            {/* Analytics 탭 */}
            {activeTab === "analytics" && (
              <div>
                {analyticsLoading ? (
                  <div className="text-center py-12" data-testid="analytics-loading">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Analytics 데이터 로딩 중...</p>
                    <p className="mt-1 text-xs text-gray-500">
                      (느린 로딩 시뮬레이션 - 1초 지연)
                    </p>
                  </div>
                ) : analyticsData ? (
                  <div data-testid="analytics-content">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">분석 대시보드</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="font-medium text-purple-800 mb-2">차트</h3>
                        <div className="space-y-2">
                          {analyticsData.charts.map((chart, index) => (
                            <div key={index} className="bg-white p-2 rounded text-sm border">
                              {chart}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h3 className="font-medium text-orange-800 mb-2">주요 지표</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-orange-700">전환율:</span>
                            <span className="font-medium" data-testid="conversion-rate">
                              {analyticsData.metrics.conversion}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700">사용자 유지율:</span>
                            <span className="font-medium">
                              {analyticsData.metrics.retention}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Analytics 데이터를 불러올 수 없습니다
                  </div>
                )}
              </div>
            )}

            {/* Settings 탭 */}
            {activeTab === "settings" && (
              <div>
                {settingsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Settings 데이터 로딩 중...</p>
                  </div>
                ) : settingsData ? (
                  <div data-testid="settings-content">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">설정</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-800 mb-2">환경 설정</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700">테마:</span>
                            <span className="font-medium" data-testid="theme-setting">
                              {settingsData.preferences.theme}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">알림:</span>
                            <span className="font-medium">
                              {settingsData.preferences.notifications ? "활성화" : "비활성화"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-800 mb-2">프로필</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700">이름:</span>
                            <span className="font-medium">{settingsData.profile.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Settings 데이터를 불러올 수 없습니다
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 쿼리 상태 표시 */}
          <div className="mt-8 border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-3">쿼리 상태</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Overview:</span>
                    <span className={`font-medium ${
                      activeTab !== "overview" ? "text-gray-500" : 
                      overviewLoading ? "text-blue-600" : 
                      overviewData ? "text-green-600" : "text-red-600"
                    }`}>
                      {activeTab !== "overview" ? "대기" : 
                       overviewLoading ? "로딩" : 
                       overviewData ? "완료" : "실패"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {overviewData ? "캐시됨" : "미로드"}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Analytics:</span>
                    <span className={`font-medium ${
                      activeTab !== "analytics" ? "text-gray-500" : 
                      analyticsLoading ? "text-blue-600" : 
                      analyticsData ? "text-green-600" : "text-red-600"
                    }`}>
                      {activeTab !== "analytics" ? "대기" : 
                       analyticsLoading ? "로딩" : 
                       analyticsData ? "완료" : "실패"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {analyticsData ? "캐시됨" : "미로드"}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Settings:</span>
                    <span className={`font-medium ${
                      activeTab !== "settings" ? "text-gray-500" : 
                      settingsLoading ? "text-blue-600" : 
                      settingsData ? "text-green-600" : "text-red-600"
                    }`}>
                      {activeTab !== "settings" ? "대기" : 
                       settingsLoading ? "로딩" : 
                       settingsData ? "완료" : "실패"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {settingsData ? "캐시됨" : "미로드"}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-600 text-sm">
                  <strong>Lazy Loading 동작:</strong> 각 탭의 데이터는 해당 탭이 처음 활성화될 때만 로드됩니다.
                  한 번 로드된 데이터는 캐시되어 재방문 시 즉시 표시됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}