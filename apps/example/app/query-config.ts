import type { QueryClientOptions } from "next-unified-query";

// 서버와 클라이언트에서 공유하는 설정
export const queryConfig: QueryClientOptions = {
  baseURL: "http://localhost:3001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  interceptors: {
    request: (config) => {
      // 인증 토큰 추가 예시 (클라이언트에서만 작동)
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    },
    response: (response) => {
      // 성공 응답 로깅
      if (typeof window !== "undefined") {
        console.log("Response:", response.config?.url, response.status);
      }
      return response;
    },
    error: (error) => {
      // 에러 처리
      if (error.response?.status === 401) {
        // 인증 에러 처리 (클라이언트에서만)
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    },
  },
};
