"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

export default function CircuitBreaker() {
  const [circuitState, setCircuitState] = useState("CLOSED");
  const [failureCount, setFailureCount] = useState(0);
  const [failures, setFailures] = useState<number[]>([]);
  const [isCircuitOpen, setIsCircuitOpen] = useState(false);
  const [isHalfOpen, setIsHalfOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [openTime, setOpenTime] = useState<number | null>(null);
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
      setFailures([]);
      return response;
    });

    // Error 인터셉터로 실패 처리
    fetcher.interceptors.error.use((error) => {
      setFailureCount((currentCount) => {
        const newFailureCount = currentCount + 1;

        // 실패 목록에 추가
        setFailures((prev) => [...prev, newFailureCount]);

        if (newFailureCount >= 5) {
          setCircuitState("OPEN");
          setIsCircuitOpen(true);
          setOpenTime(Date.now());

          // 3초 후 Half-Open 상태로 전환
          setTimeout(() => {
            setCircuitState("HALF_OPEN");
            setIsCircuitOpen(false);
            setIsHalfOpen(true);
          }, 3000);
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
      setIsBlocked(true);
      alert("서킷 브레이커가 열려있어 요청이 차단되었습니다!");
      return;
    }

    try {
      // Half-Open 상태에서는 복구를 위해 API에 recover 플래그 전달
      if (isHalfOpen) {
        await fetch("/api/circuit-breaker-test?recover=true");

        // 성공 시 서킷 브레이커 닫기
        setCircuitState("CLOSED");
        setIsHalfOpen(false);
        setFailureCount(0);
        setFailures([]);
        setOpenTime(null);
      } else {
        await refetch();
      }
    } catch (error) {
      console.error("Request failed:", error);

      // Half-Open 상태에서 실패 시 다시 OPEN으로
      if (isHalfOpen) {
        setCircuitState("OPEN");
        setIsCircuitOpen(true);
        setIsHalfOpen(false);
        setOpenTime(Date.now());

        // 다시 3초 후 Half-Open 상태로 전환
        setTimeout(() => {
          setCircuitState("HALF_OPEN");
          setIsCircuitOpen(false);
          setIsHalfOpen(true);
        }, 3000);
      }
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

      {/* 실패 표시 */}
      {failures.map((failureNum) => (
        <div
          key={failureNum}
          data-testid={`failure-${failureNum}`}
          style={{
            backgroundColor: "#ffebee",
            color: "#c62828",
            padding: "10px",
            margin: "5px 0",
            borderRadius: "4px",
            border: "1px solid #e57373",
          }}
        >
          ❌ 실패 #{failureNum}
        </div>
      ))}

      {isCircuitOpen && (
        <div
          data-testid="circuit-breaker-open"
          style={{
            backgroundColor: "#fff3e0",
            color: "#f57c00",
            padding: "15px",
            margin: "10px 0",
            borderRadius: "6px",
            border: "1px solid #ffb74d",
          }}
        >
          ⚠️ 서킷 브레이커가 열렸습니다
        </div>
      )}

      {isHalfOpen && (
        <div
          data-testid="circuit-breaker-half-open"
          style={{
            backgroundColor: "#e3f2fd",
            color: "#1976d2",
            padding: "15px",
            margin: "10px 0",
            borderRadius: "6px",
            border: "1px solid #64b5f6",
          }}
        >
          🔄 서킷 브레이커가 Half-Open 상태입니다
        </div>
      )}

      {isBlocked && (
        <div
          data-testid="circuit-breaker-blocked"
          style={{
            backgroundColor: "#ffebee",
            color: "#d32f2f",
            padding: "15px",
            margin: "10px 0",
            borderRadius: "6px",
            border: "1px solid #f44336",
          }}
        >
          🚫 요청이 서킷 브레이커에 의해 차단되었습니다
        </div>
      )}

      {circuitState === "CLOSED" && failureCount === 0 && (
        <div
          data-testid="circuit-breaker-closed"
          style={{
            backgroundColor: "#e8f5e8",
            color: "#2e7d32",
            padding: "15px",
            margin: "10px 0",
            borderRadius: "6px",
            border: "1px solid #4caf50",
          }}
        >
          ✅ 서킷 브레이커가 닫혔습니다
        </div>
      )}

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
