"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "../../lib/query-client";

export default function InterceptorAutoRefresh() {
  const [invalidationLog, setInvalidationLog] = useState<string[]>([]);
  const [isProfileAutoUpdated, setIsProfileAutoUpdated] = useState(false);
  const [interceptorHandle, setInterceptorHandle] = useState<any>(null);
  const [profileEnabled, setProfileEnabled] = useState(false);
  const queryClient = useQueryClient();

  const { data: userProfile, refetch: refetchProfile } = useQuery({
    cacheKey: ["user-profile"],
    url: "/api/user-profile?userId=1",
    enabled: profileEnabled,
  });

  // useMutation with invalidateQueries 옵션 사용
  const { mutate: updateUser, isSuccess: isMutationSuccess } = useMutation({
    cacheKey: ["update-user-profile"],
    url: "/api/user-profile",
    method: "PUT",
    // mutation 성공 시 자동으로 user-profile 쿼리 무효화
    invalidateQueries: [["user-profile"]],
  });

  // userProfile 데이터가 변경될 때마다 로그 기록
  useEffect(() => {
    if (userProfile && isMutationSuccess) {
      const logEntry = "user-profile auto-refreshed after invalidation";
      setInvalidationLog((prev) => [...prev, logEntry]);
      setIsProfileAutoUpdated(true);
    }
  }, [userProfile, isMutationSuccess]);

  const registerInvalidationInterceptor = () => {
    const fetcher = queryClient.getFetcher();

    // Response 인터셉터에서 특정 API 응답 시 추가 로깅
    const handle = fetcher.interceptors.response.use((response) => {
      if (
        response.config?.url?.includes("/api/user-profile") &&
        response.config?.method?.toUpperCase() === "PUT"
      ) {
        const logEntry =
          "user-profile invalidated triggered by user-profile PUT response";
        setInvalidationLog((prev) => [...prev, logEntry]);
      }
      return response;
    });

    setInterceptorHandle(handle);
    alert("자동 무효화 인터셉터가 등록되었습니다!");
  };

  const loadUserProfile = async () => {
    setProfileEnabled(true);
    refetchProfile();
  };

  const updateUserData = () => {
    // user-profile API에 PUT 요청을 보내서 실제로 버전을 증가시킴
    updateUser({
      userId: 1,
      name: "Updated User",
      email: "updated@example.com",
      profile: {
        bio: "업데이트된 사용자 프로필입니다.",
        location: "Seoul, Korea",
      },
    });
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
          <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
            버전: {(userProfile as any)?.version}, 업데이트:{" "}
            {(userProfile as any)?.updatedAt}
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
          <div data-testid="invalidation-log" style={{ display: "block" }}>
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
              <div key={index}>
                {index + 1}. {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "30px", fontSize: "14px", color: "#666" }}>
        <h4>테스트 시나리오:</h4>
        <ol>
          <li>자동 무효화 인터셉터 등록</li>
          <li>사용자 프로필 로드 (초기 데이터)</li>
          <li>사용자 업데이트 실행</li>
          <li>useMutation이 자동으로 user-profile 쿼리 무효화</li>
          <li>무효화된 쿼리가 자동으로 새 데이터 fetch</li>
          <li>프로필이 자동으로 업데이트됨</li>
        </ol>
      </div>
    </div>
  );
}
