"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "../../lib/query-client";

interface Notification {
  id: number;
  message: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [invalidationLog, setInvalidationLog] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // 사용자 1 알림
  const {
    data: user1Notifications,
    isLoading: user1Loading,
  } = useQuery({
    cacheKey: ["notifications", { userId: 1 }],
    url: "/api/users/1/notifications",
    enabled: currentUserId === 1,
  });

  // 사용자 2 알림
  const {
    data: user2Notifications,
    isLoading: user2Loading,
  } = useQuery({
    cacheKey: ["notifications", { userId: 2 }],
    url: "/api/users/2/notifications",
    enabled: currentUserId === 2,
  });

  // 알림 읽음 처리 mutation
  const markReadMutation = useMutation({
    url: "/api/notifications/1/read",
    method: "POST",
    onSuccess: (_data, _variables, _context) => {
      // 조건부 무효화: 현재 로그인한 사용자의 알림만 무효화
      if (currentUserId) {
        const invalidationKey = `user-${currentUserId}-notifications`;
        setInvalidationLog(prev => [...prev, invalidationKey]);
        
        // 현재 사용자의 알림만 무효화
        queryClient.invalidateQueries(["notifications", { userId: currentUserId }]);
        
        console.log(`Invalidated notifications for user ${currentUserId}`);
      }
    },
  });

  const handleLogin = (userId: number) => {
    setCurrentUserId(userId);
    setInvalidationLog([]); // 로그 초기화
  };

  const handleMarkRead = () => {
    markReadMutation.mutate({});
  };

  const handleRefreshPermissions = () => {
    // 권한 새로고침 시뮬레이션
    if (currentUserId) {
      queryClient.invalidateQueries(["notifications", { userId: currentUserId }]);
    }
  };

  const user1Data = user1Notifications as { notifications: Notification[] } | undefined;
  const user2Data = user2Notifications as { notifications: Notification[] } | undefined;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Notifications - Conditional Invalidation</h1>

      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">조건부 무효화 테스트</h3>
          <ul className="text-sm space-y-1">
            <li>• 알림 읽음 처리 시 현재 사용자의 알림만 무효화</li>
            <li>• 다른 사용자의 알림 쿼리는 영향받지 않음</li>
            <li>• 사용자별로 독립적인 캐시 키 사용</li>
          </ul>
        </div>

        {/* 사용자 로그인 버튼 */}
        <div className="space-x-4">
          <button
            data-testid="login-user-1-btn"
            onClick={() => handleLogin(1)}
            className={`px-4 py-2 rounded ${
              currentUserId === 1
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            사용자 1 로그인
          </button>
          <button
            data-testid="login-user-2-btn"
            onClick={() => handleLogin(2)}
            className={`px-4 py-2 rounded ${
              currentUserId === 2
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            사용자 2 로그인
          </button>
          <button
            data-testid="refresh-permissions-btn"
            onClick={handleRefreshPermissions}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            권한 새로고침
          </button>
        </div>

        {/* 현재 사용자 정보 */}
        {currentUserId && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold">현재 로그인: 사용자 {currentUserId}</h3>
            <div data-testid="permissions-loaded" className="text-sm text-blue-600 mt-1">
              권한 로드 완료
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 사용자 1 알림 */}
          <div className="bg-white p-4 border rounded-lg">
            <h3 className="font-semibold mb-4">사용자 1 알림</h3>
            {currentUserId === 1 && user1Loading ? (
              <div>알림 로딩 중...</div>
            ) : currentUserId === 1 && user1Data ? (
              <div data-testid="user-1-notifications" className="space-y-2">
                <div data-testid="unread-count" className="text-sm text-gray-600 mb-2">
                  읽지 않은 알림: {user1Data.notifications.filter(n => !n.read).length}개
                </div>
                {user1Data.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-2 rounded text-sm ${
                      notification.read ? "bg-gray-100" : "bg-yellow-50"
                    }`}
                  >
                    <div>{notification.message}</div>
                    <div className="text-xs text-gray-500">
                      {notification.read ? "읽음" : "읽지 않음"}
                    </div>
                  </div>
                ))}
                {user1Data.notifications.some(n => !n.read) ? (
                  <button
                    data-testid="mark-read-btn"
                    onClick={handleMarkRead}
                    disabled={markReadMutation.isPending}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {markReadMutation.isPending ? "처리 중..." : "모두 읽음 처리"}
                  </button>
                ) : (
                  <div data-testid="notification-read" className="text-green-600 text-sm">
                    모든 알림을 읽었습니다
                  </div>
                )}
              </div>
            ) : currentUserId !== 1 ? (
              <div className="text-gray-500">사용자 1로 로그인해주세요</div>
            ) : (
              <div data-testid="access-denied" className="text-red-600">
                알림 접근이 거부되었습니다
              </div>
            )}
          </div>

          {/* 사용자 2 알림 */}
          <div className="bg-white p-4 border rounded-lg">
            <h3 className="font-semibold mb-4">사용자 2 알림</h3>
            {currentUserId === 2 && user2Loading ? (
              <div>알림 로딩 중...</div>
            ) : currentUserId === 2 && user2Data ? (
              <div data-testid="user-2-notifications" className="space-y-2">
                <div className="text-sm text-gray-600 mb-2">
                  읽지 않은 알림: {user2Data.notifications.filter(n => !n.read).length}개
                </div>
                {user2Data.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-2 rounded text-sm ${
                      notification.read ? "bg-gray-100" : "bg-yellow-50"
                    }`}
                  >
                    <div>{notification.message}</div>
                    <div className="text-xs text-gray-500">
                      {notification.read ? "읽음" : "읽지 않음"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">사용자 2로 로그인해주세요</div>
            )}
          </div>
        </div>

        {/* 무효화 로그 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">무효화 로그</h3>
          <div data-testid="invalidation-log" className="text-sm space-y-1">
            {invalidationLog.length > 0 ? (
              invalidationLog.map((log, index) => (
                <div key={index} className="text-blue-600">
                  • {log} 무효화됨
                </div>
              ))
            ) : (
              <div className="text-gray-500">아직 무효화된 쿼리가 없습니다</div>
            )}
          </div>
        </div>

        {/* 상태 정보 */}
        <div className="bg-gray-50 p-4 rounded-lg text-sm">
          <h4 className="font-semibold mb-2">시스템 상태</h4>
          <div>현재 사용자: {currentUserId || "없음"}</div>
          <div>Mutation 상태: {markReadMutation.isPending ? "진행 중" : "대기"}</div>
          <div>무효화 횟수: {invalidationLog.length}회</div>
        </div>
      </div>
    </div>
  );
}