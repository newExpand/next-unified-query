"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "../../lib/query-client";

export default function InterceptorAutoRefresh() {
  const [invalidationLog, setInvalidationLog] = useState<string[]>([]);
  const [isProfileAutoUpdated, setIsProfileAutoUpdated] = useState(false);
  const queryClient = useQueryClient();

  const { data: userProfile, refetch: refetchProfile } = useQuery({
    cacheKey: ["user-profile", { userId: 1 }],
    url: "/api/user-profile?userId=1",
    enabled: false,
  });

  const { mutate: updateUser } = useMutation({
    cacheKey: ["update-user"],
    url: "/api/update-user",
    method: "POST",
  });

  const registerInvalidationInterceptor = () => {
    const fetcher = queryClient.getFetcher();

    // Response 인터셉터에서 특정 API 응답 시 쿼리 무효화
    fetcher.interceptors.response.use((response) => {
      if (response.config?.url?.includes("/api/update-user")) {
        // user-profile 쿼리 무효화
        queryClient.invalidateQueries(["user-profile"]);

        const logEntry =
          "user-profile invalidated triggered by update-user response";
        setInvalidationLog((prev) => [...prev, logEntry]);
        setIsProfileAutoUpdated(true);
      }
      return response;
    });

    alert("자동 무효화 인터셉터가 등록되었습니다!");
  };

  const loadUserProfile = async () => {
    await refetchProfile();
  };

  const updateUserData = () => {
    updateUser(
      { userId: 1, name: "Updated User", email: "updated@example.com" },
      {
        onSuccess: () => {
          // 인터셉터가 자동으로 프로필을 새로고침할 것임
          setTimeout(() => {
            refetchProfile(); // 무효화 후 자동 새로고침 시뮬레이션
          }, 100);
        },
      }
    );
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>자동 쿼리 무효화 테스트</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          data-testid="register-invalidation-interceptor-btn"
          onClick={registerInvalidationInterceptor}
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
          자동 무효화 인터셉터 등록
        </button>

        <button
          data-testid="load-user-profile-btn"
          onClick={loadUserProfile}
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
          사용자 프로필 로드
        </button>

        <button
          data-testid="update-user-btn"
          onClick={updateUserData}
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
          사용자 업데이트
        </button>
      </div>

      {userProfile !== undefined && (
        <div data-testid="user-profile">
          <h3>사용자 프로필</h3>
          <div data-testid="user-name">
            {(userProfile as any)?.name || "Unknown User"}
          </div>
        </div>
      )}

      {isProfileAutoUpdated && (
        <div data-testid="profile-auto-updated">
          <h3>✅ 프로필 자동 업데이트 완료</h3>
        </div>
      )}

      {invalidationLog.length > 0 && (
        <div>
          <h3>무효화 로그</h3>
          <div data-testid="invalidation-log" style={{ display: "none" }}>
            {invalidationLog.join(", ")}
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
            {invalidationLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
