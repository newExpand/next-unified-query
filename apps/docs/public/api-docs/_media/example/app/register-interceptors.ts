import type { NextTypeFetch } from "next-unified-query";

/**
 * fetcher에 공통 인터셉터를 등록합니다.
 * SSR/CSR 모두에서 재사용 가능합니다.
 */
export function registerInterceptors(fetcher: NextTypeFetch) {
  fetcher.interceptors.request.use((config) => {
    // Add test header
    config.headers = { ...config.headers, "X-Test-Header": "test-value" };

    // Add Authorization header if token exists (client-side only)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      // Add user role header for role-based access control
      const userRole = localStorage.getItem("user_role");
      if (userRole) {
        config.headers = {
          ...config.headers,
          "x-user-role": userRole,
        };
      }
    }

    return config;
  });
}

export function registerInterceptors2(fetcher: NextTypeFetch) {
  fetcher.interceptors.request.use((config) => {
    config.headers = { ...config.headers, "X-Custom-Header": "custom-value" };
    // console.log("registerInterceptors2", config.headers);
    return config;
  });
}

/**
 * Auth retry interceptor for token refresh
 */
export function registerAuthRetryInterceptor(fetcher) {
  // Shared refresh promise to prevent multiple concurrent refresh attempts
  let refreshPromise: Promise<{
    accessToken: string;
    refreshToken: string;
  }> | null = null;

  fetcher.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalConfig = error.config;

      if (
        error.response?.status === 401 &&
        originalConfig &&
        !originalConfig._retry
      ) {
        // Only retry auth errors in browser environment
        if (typeof window === "undefined") {
          throw error;
        }

        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          // No refresh token, clear all tokens and redirect
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user_role");
          delete (window as any).__AUTH_TOKENS__;
          window.location.href = "/auth/login";
          throw error;
        }

        // Mark request as retry to prevent infinite loops
        originalConfig._retry = true;

        try {
          // Prevent multiple concurrent refresh attempts
          if (!refreshPromise) {
            refreshPromise = (async () => {
              const refreshResponse = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
              });

              if (!refreshResponse.ok) {
                throw new Error("Refresh token expired");
              }

              const data = await refreshResponse.json();
              return data;
            })();
          }

          const { accessToken, refreshToken: newRefreshToken } =
            await refreshPromise;

          // Update tokens in localStorage
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          // Update global state for tests
          if ((window as any).__AUTH_TOKENS__) {
            (window as any).__AUTH_TOKENS__.accessToken = accessToken;
            (window as any).__AUTH_TOKENS__.refreshToken = newRefreshToken;
          }

          // Update the request headers with new token
          originalConfig.headers = {
            ...originalConfig.headers,
            Authorization: `Bearer ${accessToken}`,
          };

          // Reset refresh promise for next use
          refreshPromise = null;

          // Retry the original request
          return fetcher.request(originalConfig);
        } catch (refreshError) {
          // Refresh failed, clear all tokens and redirect
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user_role");
          delete (window as any).__AUTH_TOKENS__;
          refreshPromise = null;
          window.location.href = "/auth/login";
          throw refreshError;
        }
      }

      throw error;
    }
  );
}

/**
 * 모든 인터셉터를 한 번에 설정하는 공통 함수
 * 서버사이드와 클라이언트사이드에서 동일하게 사용됩니다.
 */
export function setupAllInterceptors(fetcher: NextTypeFetch) {
  registerInterceptors(fetcher);
  registerInterceptors2(fetcher);
  registerAuthRetryInterceptor(fetcher);
}
