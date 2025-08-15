'use client';

import { useQuery, useMutation } from 'next-unified-query/react';
import { FetchError } from 'next-unified-query';
import { useState, useEffect } from 'react';

interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ProtectedData {
  message: string;
  timestamp: number;
  userId: number;
}

export default function InterceptorsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // 로컬 스토리지에서 토큰 확인
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // 로그인 mutation
  const login = useMutation({
    url: '/auth/login',
    method: 'POST',
    onSuccess: (data: AuthResponse) => {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      addLog(`✅ Login successful: ${data.user.name}`);
    },
    onError: (error: FetchError) => {
      addLog(`❌ Login failed: ${error.message}`);
    },
  });

  // 로그아웃 mutation
  const logout = useMutation({
    url: '/auth/logout',
    method: 'POST',
    onSuccess: () => {
      localStorage.removeItem('token');
      setToken(null);
      addLog('✅ Logout successful');
    },
  });

  // 보호된 데이터 요청 (interceptor가 자동으로 토큰 추가)
  const { data: protectedData, error, refetch } = useQuery<ProtectedData>({
    cacheKey: ['protected-data'],
    url: '/protected/data',
    enabled: !!token, // 토큰이 있을 때만 요청
  });

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 10));
  };

  useEffect(() => {
    if (error) {
      addLog(`❌ Protected request failed: ${error.message}`);
    }
    if (protectedData) {
      addLog(`✅ Protected data received: ${protectedData.message}`);
    }
  }, [error, protectedData]);

  const handleLogin = () => {
    login.mutate({
      email: 'user@example.com',
      password: 'password123',
    });
  };

  const handleLogout = () => {
    logout.mutate({});
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Interceptors Example</h1>
      <p className="mb-4 text-gray-600">
        This example demonstrates request/response interceptors for authentication and logging.
        The interceptors are configured in providers.tsx.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Authentication</h2>
          
          <div className="bg-gray-100 p-4 rounded mb-4">
            <p className="mb-2">
              Status: {token ? (
                <span className="text-green-600 font-semibold">Authenticated ✅</span>
              ) : (
                <span className="text-red-600 font-semibold">Not Authenticated ❌</span>
              )}
            </p>
            
            {token && (
              <p className="text-sm text-gray-600 mb-2">
                Token: {token.substring(0, 20)}...
              </p>
            )}

            <div className="flex gap-2">
              {!token ? (
                <button
                  onClick={handleLogin}
                  disabled={login.isPending}
                  className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                  {login.isPending ? 'Logging in...' : 'Login'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleLogout}
                    disabled={logout.isPending}
                    className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                  >
                    {logout.isPending ? 'Logging out...' : 'Logout'}
                  </button>
                  <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                  >
                    Fetch Protected Data
                  </button>
                </>
              )}
            </div>
          </div>

          {protectedData && (
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Protected Data</h3>
              <p className="text-sm">{protectedData.message}</p>
              <p className="text-xs text-gray-600">
                Timestamp: {new Date(protectedData.timestamp).toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">
                User ID: {protectedData.userId}
              </p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Interceptor Logs</h2>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-xs">
            <p className="mb-2 text-gray-400">// Request/Response logs from interceptors</p>
            {logs.length === 0 ? (
              <p className="text-gray-600">No logs yet. Try logging in...</p>
            ) : (
              logs.map((log, index) => (
                <p key={index} className="mb-1">{log}</p>
              ))
            )}
          </div>

          <div className="mt-4 bg-blue-50 p-3 rounded">
            <h3 className="font-semibold text-sm mb-1">How it works:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Request interceptor adds auth token to headers</li>
              <li>• Response interceptor logs successful requests</li>
              <li>• Error interceptor handles 401 errors</li>
              <li>• All configured in providers.tsx</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}