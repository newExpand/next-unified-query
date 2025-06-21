"use client";

/**
 * 대시보드 설정 페이지
 * 중첩 레이아웃 테스트용
 */
export default function DashboardSettingsPage() {
  return (
    <div data-testid="settings-content">
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">계정 설정</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자명
              </label>
              <input
                type="text"
                defaultValue="관리자"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                defaultValue="admin@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">알림 설정</h2>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              <span>이메일 알림 받기</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              <span>푸시 알림 받기</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>마케팅 이메일 받기</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            설정 저장
          </button>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>이 페이지는 대시보드 레이아웃을 공유합니다.</p>
        <p>사이드바와 헤더의 상태가 유지됩니다.</p>
      </div>
    </div>
  );
}
