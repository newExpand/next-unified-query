"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

export default function CircuitBreaker() {
  const [circuitState, setCircuitState] = useState("CLOSED");
  const [failureCount, setFailureCount] = useState(0);
  const [isCircuitOpen, setIsCircuitOpen] = useState(false);
  const [isHalfOpen, setIsHalfOpen] = useState(false);
  const queryClient = useQueryClient();

  const { refetch } = useQuery({
    cacheKey: ["circuit-breaker-test"],
    url: "/api/circuit-breaker-test",
    enabled: false,
  });

  const registerCircuitBreaker = () => {
    const fetcher = queryClient.getFetcher();

    // Response 인터셉터로 성공 처리
    fetcher.interceptors.response.use((response) => {
      // 성공 시 서킷 브레이커 닫기
      setCircuitState("CLOSED");
      setIsCircuitOpen(false);
      setIsHalfOpen(false);
      setFailureCount(0);
      return response;
    });

    // Error 인터셉터로 실패 처리
    fetcher.interceptors.error.use((error) => {
      setFailureCount((currentCount) => {
        const newFailureCount = currentCount + 1;

        if (newFailureCount >= 5) {
          setCircuitState("OPEN");
          setIsCircuitOpen(true);
        }

        return newFailureCount;
      });

      return Promise.reject(error);
    });

    alert("서킷 브레이커가 등록되었습니다!");
  };

  const makeRequest = async () => {
    if (isCircuitOpen) {
      // 서킷 브레이커가 열려있으면 요청 차단
      alert("서킷 브레이커가 열려있어 요청이 차단되었습니다!");
      return;
    }

    try {
      await refetch();
    } catch (error) {
      console.error("Request failed:", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>서킷 브레이커 패턴 테스트</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          data-testid="register-circuit-breaker-btn"
          onClick={registerCircuitBreaker}
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
          서킷 브레이커 등록
        </button>

        <button
          data-testid="make-request-btn"
          onClick={makeRequest}
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
          요청 실행
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>서킷 브레이커 상태</h3>
        <div
          data-testid="circuit-state"
          style={{
            padding: "10px",
            backgroundColor: circuitState === "OPEN" ? "#ffebee" : "#e8f5e8",
            borderRadius: "4px",
            fontWeight: "bold",
          }}
        >
          {circuitState}
        </div>
      </div>

      {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
        <div
          key={num}
          data-testid={`failure-${num}`}
          style={{ display: "none" }}
        >
          실패 #{num}
        </div>
      ))}

      {isCircuitOpen && (
        <div data-testid="circuit-breaker-open">
          ⚠️ 서킷 브레이커가 열렸습니다
        </div>
      )}

      {isHalfOpen && (
        <div data-testid="circuit-breaker-half-open">
          🔄 서킷 브레이커가 Half-Open 상태입니다
        </div>
      )}

      <div data-testid="circuit-breaker-blocked" style={{ display: "none" }}>
        요청이 서킷 브레이커에 의해 차단되었습니다
      </div>

      <div data-testid="circuit-breaker-closed" style={{ display: "none" }}>
        서킷 브레이커가 닫혔습니다
      </div>

      <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
        <h4>사용법:</h4>
        <ol>
          <li>서킷 브레이커 등록</li>
          <li>요청 실행을 5번 클릭하여 연속 실패 발생</li>
          <li>서킷 브레이커가 OPEN 상태로 변경되는지 확인</li>
          <li>추가 요청이 차단되는지 확인</li>
        </ol>
      </div>
    </div>
  );
}
