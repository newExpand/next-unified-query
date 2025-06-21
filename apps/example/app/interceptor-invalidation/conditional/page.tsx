"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "../../lib/query-client";

export default function ConditionalInvalidation() {
  const [selectedUserId, setSelectedUserId] = useState("1");
  const [conditionalLog, setConditionalLog] = useState<any[]>([]);
  const queryClient = useQueryClient();

  const { refetch: refetchNotifications } = useQuery({
    cacheKey: ["notifications", { userId: selectedUserId }],
    url: `/api/notifications?userId=${selectedUserId}`,
    enabled: false,
  });

  const { mutate: markAsRead } = useMutation({
    cacheKey: ["mark-read"],
    url: "/api/mark-read",
    method: "POST",
  });

  const registerConditionalInterceptor = () => {
    const fetcher = queryClient.getFetcher();

    fetcher.interceptors.response.use((response) => {
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

      <div data-testid="notifications-loaded">알림 로드 완료</div>

      <div data-testid="mark-read-complete">읽음 처리 완료</div>

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
                {log.action}: {log.queryKey} at{" "}
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
