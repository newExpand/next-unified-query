import type { QueryClientOptions } from "next-unified-query";

// 서버와 클라이언트에서 공유하는 설정
export const queryConfig: QueryClientOptions = {
  baseURL: "http://localhost:3001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  // 공통 인터셉터 (모든 환경에서 실행)
  interceptors: {
    request: (config) => {
      // 공통 헤더 추가
      config.headers = {
        ...config.headers,
        "X-App-Version": "1.0.0",
      };
      return config;
    },
    response: (response) => {
      // 공통 응답 로깅 (서버/클라이언트 모두)
      console.log(`[${response.config?.method}] ${response.config?.url} - ${response.status}`);
      return response;
    },
  },
  // 클라이언트 전용 인터셉터 (typeof window 체크 불필요!)
  clientInterceptors: {
    request: (config) => {
      // localStorage 직접 접근 가능
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    },
    response: (response) => {
      // 브라우저 전용 로깅
      console.log("Client Response:", response.config?.url, response.status);
      return response;
    },
    error: (error) => {
      // 에러 처리 - window 객체 직접 사용 가능
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    },
  },
  // 서버 전용 인터셉터
  serverInterceptors: {
    request: (config) => {
      // 서버 전용 헤더 설정
      config.headers = {
        ...config.headers,
        "X-Server-Region": process.env.REGION || "us-east-1",
        "X-Server-Instance": process.env.INSTANCE_ID || "default",
      };
      return config;
    },
    response: (response) => {
      // 서버 전용 로깅 (파일 시스템이나 외부 로깅 서비스 사용 가능)
      console.log(`[Server] ${response.config?.url} - ${response.status}`);
      return response;
    },
  },
};
