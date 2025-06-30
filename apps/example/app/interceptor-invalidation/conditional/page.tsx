"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "../../lib/query-client";

export default function ConditionalInvalidation() {
  const [selectedUserId, setSelectedUserId] = useState("1");
  const [conditionalLog, setConditionalLog] = useState<any[]>([]);
  const [isNotificationsLoaded, setIsNotificationsLoaded] = useState(false);
  const [isMarkReadComplete, setIsMarkReadComplete] = useState(false);
  const [interceptorHandle, setInterceptorHandle] = useState<any>(null);
  const queryClient = useQueryClient();

  // 선택된 사용자의 알림을 가져오는 쿼리
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    cacheKey: ["notifications", { userId: selectedUserId }],
    url: `/api/notifications?userId=${selectedUserId}`,
    enabled: false,
  });

  // 알림 읽음 처리 mutation (조건부 무효화 포함)
  const { mutate: markAsRead, isSuccess: isMarkReadSuccess } = useMutation({
    cacheKey: ["mark-read"],
    url: "/api/mark-read",
    method: "POST",
    // 조건부 무효화: 특정 사용자의 알림만 무효화
    invalidateQueries: (data, variables) => {
      const affectedUserId = (data as any)?.affectedUserId;
      if (affectedUserId) {
        return [["notifications", { userId: affectedUserId.toString() }]];
      }
      return [];
    },
  });

  // 읽음 처리 완료 상태 감지
  useEffect(() => {
    if (isMarkReadSuccess) {
      setIsMarkReadComplete(true);
      // 3초 후 상태 리셋
      setTimeout(() => setIsMarkReadComplete(false), 3000);
    }
  }, [isMarkReadSuccess]);

  // 알림 로드 완료 상태 감지
  useEffect(() => {
    if (notifications) {
      setIsNotificationsLoaded(true);
      // 3초 후 상태 리셋
      setTimeout(() => setIsNotificationsLoaded(false), 3000);
    }
  }, [notifications]);

  const registerConditionalInterceptor = () => {
    const fetcher = queryClient.getFetcher();

    // Response 인터셉터에서 조건부 무효화 로깅
    const handle = fetcher.interceptors.response.use((response) => {
      if (response.config?.url?.includes("/api/mark-read")) {
        const responseData = response.data as any;
        const affectedUserId = responseData?.affectedUserId;

        if (affectedUserId) {
          const logEntry = {
            action: "invalidated",
            queryKey: `notifications-userId:${affectedUserId}`,
            timestamp: Date.now(),
          };
          setConditionalLog((prev) => [...prev, logEntry]);
        }
      }
      return response;
    });

    setInterceptorHandle(handle);
    alert("조건부 무효화 인터셉터가 등록되었습니다!");
  };

  const loadNotifications = async () => {
    await refetchNotifications();
  };

  const markNotificationRead = () => {
    markAsRead({
      userId: parseInt(selectedUserId),
      notificationId: 1,
    });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>조건부 쿼리 무효화 테스트</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          data-testid="register-conditional-interceptor-btn"
          onClick={registerConditionalInterceptor}
          style={{
            padding: "10px 15px",
            margin: "5px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          조건부 무효화 인터셉터 등록
        </button>

        <select
          data-testid="user-select"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          style={{ margin: "5px", padding: "8px" }}
        >
          <option value="1">사용자 1</option>
          <option value="2">사용자 2</option>
        </select>

        <button
          data-testid="load-notifications-btn"
          onClick={loadNotifications}
          style={{
            padding: "10px 15px",
            margin: "5px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          알림 로드
        </button>

        <button
          data-testid="mark-read-btn"
          onClick={markNotificationRead}
          style={{
            padding: "10px 15px",
            margin: "5px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          읽음 처리
        </button>
      </div>

      {/* 알림 데이터 표시 */}
      {notifications !== undefined && (
        <div style={{ marginBottom: "20px" }}>
          <h3>사용자 {selectedUserId}의 알림</h3>
          <div
            style={{
              backgroundColor: "#f0f0f0",
              padding: "10px",
              borderRadius: "4px",
            }}
          >
            <div>총 알림: {(notifications as any)?.totalCount || 0}</div>
            <div>
              읽지 않은 알림: {(notifications as any)?.unreadCount || 0}
            </div>
            <div>로드 시간: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      )}

      {/* E2E 테스트용 상태 표시 요소들 */}
      {isNotificationsLoaded && (
        <div
          data-testid="notifications-loaded"
          style={{
            backgroundColor: "#d4edda",
            color: "#155724",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "4px",
          }}
        >
          ✅ 알림 로드 완료
        </div>
      )}

      {isMarkReadComplete && (
        <div
          data-testid="mark-read-complete"
          style={{
            backgroundColor: "#d1ecf1",
            color: "#0c5460",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "4px",
          }}
        >
          ✅ 읽음 처리 완료
        </div>
      )}

      {conditionalLog.length > 0 && (
        <div>
          <h3>조건부 무효화 로그</h3>
          <div
            data-testid="conditional-invalidation-log"
            style={{ display: "none" }}
          >
            {JSON.stringify(conditionalLog)}
          </div>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
          >
            {conditionalLog.map((log, index) => (
              <div key={index}>
                {index + 1}. {log.action}: {log.queryKey} at{" "}
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "30px", fontSize: "14px", color: "#666" }}>
        <h4>테스트 시나리오:</h4>
        <ol>
          <li>조건부 무효화 인터셉터 등록</li>
          <li>사용자 1의 알림 로드</li>
          <li>사용자 2의 알림 로드</li>
          <li>사용자 1의 알림 읽음 처리</li>
          <li>사용자 1의 알림만 무효화되고 사용자 2는 영향 없음</li>
        </ol>
      </div>
    </div>
  );
}
