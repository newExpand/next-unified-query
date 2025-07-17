"use client";

import { useQuery } from "../lib/query-client";

interface ServerData {
  message: string;
  timestamp: number;
}

interface ClientData {
  userCount: number;
  activeUsers: number;
  serverLoad: number;
}

export default function DashboardPage() {
  // Server Component 데이터 (useQuery로 변경)
  const {
    data: serverData,
    isLoading: serverDataLoading,
    error: serverError,
  } = useQuery<ServerData>({
    cacheKey: ["dashboard", "server-data"],
    url: "/api/static-data", // 인증이 필요하지 않은 간단한 API 사용
    fetchConfig: {
      cache: "default", // Next.js 기본 캐시 동작
    },
    staleTime: 5000,
  });

  // Client Component 데이터 (useQuery 훅 사용)
  const {
    data: clientData,
    isLoading: clientLoading,
    error: clientError,
  } = useQuery<ClientData>({
    cacheKey: ["dashboard", "client-data"],
    queryFn: async () => {
      // 클라이언트 측에서 추가 데이터 로드
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 로딩 시뮬레이션

      return {
        userCount: Math.floor(Math.random() * 1000) + 100,
        activeUsers: Math.floor(Math.random() * 100) + 10,
        serverLoad: Math.floor(Math.random() * 100),
      };
    },
    staleTime: 10000,
  });

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">대시보드</h1>

      {/* Server Component 데이터 (즉시 표시) */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">서버 데이터</h2>
        {serverDataLoading ? (
          <div className="text-gray-500">서버 데이터 로딩 중...</div>
        ) : serverError ? (
          <div className="text-red-500">서버 데이터 로딩 실패</div>
        ) : (
          <div data-testid="server-data" className="bg-blue-50 p-4 rounded">
            <p className="font-medium">{serverData?.message}</p>
            <p className="text-sm text-gray-600">
              생성 시간:{" "}
              {serverData?.timestamp
                ? new Date(serverData.timestamp).toLocaleString()
                : "N/A"}
            </p>
          </div>
        )}
      </div>

      {/* Client Component 데이터 (로딩 후 표시) */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">클라이언트 데이터</h2>
        {clientLoading ? (
          <div data-testid="client-loading" className="text-gray-500">
            클라이언트 데이터 로딩 중...
          </div>
        ) : clientError ? (
          <div className="text-red-500">
            에러:{" "}
            {clientError instanceof Error
              ? clientError.message
              : "알 수 없는 에러"}
          </div>
        ) : (
          <div data-testid="client-data" className="bg-green-50 p-4 rounded">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {clientData?.userCount}
                </div>
                <div className="text-sm text-gray-600">총 사용자</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {clientData?.activeUsers}
                </div>
                <div className="text-sm text-gray-600">활성 사용자</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {clientData?.serverLoad}%
                </div>
                <div className="text-sm text-gray-600">서버 부하</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500">
        <p>
          이 페이지는 서버 데이터와 클라이언트 데이터를 혼합하여 표시합니다.
        </p>
        <p>
          서버 데이터는 즉시 표시되고, 클라이언트 데이터는 로딩 후 표시됩니다.
        </p>
      </div>
    </div>
  );
}
