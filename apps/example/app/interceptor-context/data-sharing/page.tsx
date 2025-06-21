"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

// 전역 컨텍스트 타입 정의
declare global {
  interface Window {
    __INTERCEPTOR_CONTEXT__: {
      currentRequestId?: string;
      requestHistory: Array<{
        id: string;
        timestamp: number;
        type: string;
        url?: string;
        status?: number;
      }>;
    };
  }
}

/**
 * 인터셉터 간 데이터 공유 테스트 페이지
 */
export default function InterceptorContextDataSharing() {
  const [contextData, setContextData] = useState<any>(null);
  const [globalContext, setGlobalContext] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, error, isLoading, refetch } = useQuery({
    cacheKey: ["shared-context-test"],
    url: "/api/shared-context",
    enabled: false, // 수동으로 트리거
  });

  // 컨텍스트 공유 인터셉터 등록
  const registerContextInterceptors = () => {
    // 전역 컨텍스트 초기화
    if (typeof window !== "undefined") {
      window.__INTERCEPTOR_CONTEXT__ = {
        requestHistory: [],
      };
    }

    const fetcher = queryClient.getFetcher();

    // Request 인터셉터 - 컨텍스트 설정
    fetcher.interceptors.request.use((config) => {
      const correlationId = `req-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const sharedData = "request-interceptor-data";
      const processingStartTime = Date.now();

      // 헤더에 컨텍스트 정보 추가
      config.headers = {
        ...config.headers,
        "x-correlation-id": correlationId,
        "x-shared-context": `${sharedData},processing-start:${processingStartTime}`,
        "x-processing-time": processingStartTime.toString(),
      };

      // 전역 컨텍스트 업데이트
      if (typeof window !== "undefined" && window.__INTERCEPTOR_CONTEXT__) {
        window.__INTERCEPTOR_CONTEXT__.currentRequestId = correlationId;
        window.__INTERCEPTOR_CONTEXT__.requestHistory.push({
          id: correlationId,
          timestamp: processingStartTime,
          type: "request-start",
          url: config.url,
        });
      }

      return config;
    });

    // Response 인터셉터 - 컨텍스트 확장
    fetcher.interceptors.response.use((response) => {
      const processingEndTime = Date.now();
      const correlationId = response.config?.headers?.["x-correlation-id"];
      const existingContext =
        response.config?.headers?.["x-shared-context"] || "";

      // 응답에 추가 컨텍스트 정보 추가
      if (response.data && typeof response.data === "object") {
        (response.data as any).enhancedBy = "response-interceptor";
        (response.data as any).metadata = {
          processedAt: new Date().toISOString(),
          processingTime: processingEndTime,
          correlationId,
        };
      }

      // 전역 컨텍스트 업데이트
      if (typeof window !== "undefined" && window.__INTERCEPTOR_CONTEXT__) {
        window.__INTERCEPTOR_CONTEXT__.requestHistory.push({
          id: correlationId || "unknown",
          timestamp: processingEndTime,
          type: "response-end",
          status: response.status,
        });
      }

      return response;
    });

    alert("컨텍스트 공유 인터셉터가 등록되었습니다!");
  };

  // 컨텍스트 요청 실행
  const makeContextRequest = async () => {
    try {
      await refetch();

      // 응답 받은 후 컨텍스트 데이터 업데이트
      if (data) {
        setContextData(data);
      }

      // 전역 컨텍스트 읽기
      if (typeof window !== "undefined" && window.__INTERCEPTOR_CONTEXT__) {
        setGlobalContext({ ...window.__INTERCEPTOR_CONTEXT__ });
      }
    } catch (err) {
      console.error("Context request failed:", err);
    }
  };

  useEffect(() => {
    if (data) {
      setContextData(data);
    }
  }, [data]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>인터셉터 간 데이터 공유 테스트</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          data-testid="register-context-interceptors-btn"
          onClick={registerContextInterceptors}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          컨텍스트 공유 인터셉터 등록
        </button>

        <button
          data-testid="make-context-request-btn"
          onClick={makeContextRequest}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          컨텍스트 요청 실행
        </button>
      </div>

      {isLoading && (
        <div data-testid="context-loading">컨텍스트 요청 처리 중...</div>
      )}

      {error && (
        <div data-testid="context-error" style={{ color: "red" }}>
          에러: {(error as any)?.message || "알 수 없는 오류"}
        </div>
      )}

      {data && (
        <div data-testid="context-response">
          <h3>✅ 컨텍스트 응답 완료</h3>
        </div>
      )}

      {contextData && (
        <div data-testid="shared-context-data" style={{ display: "none" }}>
          {JSON.stringify(contextData)}
        </div>
      )}

      {globalContext && (
        <div style={{ marginTop: "20px" }}>
          <h3>전역 인터셉터 컨텍스트</h3>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
          >
            <div>
              <strong>현재 요청 ID:</strong>{" "}
              {globalContext.currentRequestId || "없음"}
            </div>
            <div>
              <strong>요청 기록:</strong>
            </div>
            {globalContext.requestHistory?.map((record: any, index: number) => (
              <div key={index} style={{ marginLeft: "20px", marginTop: "5px" }}>
                {record.type}: {record.id} (시간:{" "}
                {new Date(record.timestamp).toLocaleTimeString()})
                {record.status && ` - 상태: ${record.status}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {contextData && (
        <div style={{ marginTop: "20px" }}>
          <h3>공유된 컨텍스트 데이터</h3>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
          >
            <div>
              <strong>상관관계 ID:</strong> {contextData.correlationId}
            </div>
            <div>
              <strong>공유 데이터:</strong> {contextData.sharedData}
            </div>
            <div>
              <strong>처리 시간:</strong> {contextData.processingTime}
            </div>
            <div>
              <strong>요청 ID:</strong> {contextData.requestId}
            </div>
            <div>
              <strong>타임스탬프:</strong> {contextData.timestamp}
            </div>
            {contextData.enhancedBy && (
              <div>
                <strong>향상됨:</strong> {contextData.enhancedBy}
              </div>
            )}
            {contextData.metadata && (
              <div>
                <strong>메타데이터:</strong>{" "}
                {JSON.stringify(contextData.metadata, null, 2)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
