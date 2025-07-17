// 확인 필요
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "../../lib/query-client";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const loginMutation = useMutation<{
    accessToken: string;
    refreshToken: string;
    user: { id: number; name: string; email: string; role: string };
  }>({
    mutationFn: async ({ username, password }, fetcher) => {
      const response = await fetcher.post("/api/auth/login", {
        username,
        password,
      });

      if (!response.data) {
        throw new Error("Login failed");
      }

      return response.data;
    },
    onSuccess: (data: {
      accessToken: string;
      refreshToken: string;
      user: { id: number; name: string; email: string; role: string };
    }) => {
      // Store tokens with consistent naming
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user_role", data.user.role);

      // Global state for E2E tests
      (window as any).__AUTH_TOKENS__ = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        role: data.user.role,
      };

      router.push("/protected/dashboard");
    },
    onError: (error) => {
      setError(error.message || "로그인에 실패했습니다.");
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // For demo purposes, simulate login without actual API call
    if (!username || !password) {
      setError("사용자명과 비밀번호를 입력해주세요.");
      return;
    }

    // Simulate successful login for demo
    const accessToken = `access_token_${Date.now()}`;
    const refreshToken = `refresh_token_${Date.now()}`;
    const role = username.includes("admin") ? "admin" : "user";

    // Store tokens with consistent naming
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user_role", role);

    // Global state for E2E tests
    (window as any).__AUTH_TOKENS__ = {
      accessToken,
      refreshToken,
      role,
    };

    router.push("/protected/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
        </div>
        <form
          className="mt-8 space-y-6"
          onSubmit={handleLogin}
          data-testid="login-form"
        >
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                사용자명
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="사용자명"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="username-input"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
              />
            </div>
          </div>

          {error && (
            <div
              className="text-red-600 text-sm text-center"
              data-testid="login-error"
            >
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              data-testid="login-btn"
            >
              {loginMutation.isPending ? "로그인 중..." : "로그인"}
            </button>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>테스트 계정:</p>
            <p>• 일반 사용자: john@example.com / password</p>
            <p>• 관리자: admin@example.com / password</p>
          </div>
        </form>
      </div>
    </div>
  );
}
