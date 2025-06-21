"use client";

import { useQuery } from "../../lib/query-client";

interface User {
  id: string;
  name: string;
  timestamp: number;
  testHeader: string | null;
  customHeader: string | null;
}

// 같은 쿼리를 사용하는 여러 컴포넌트들
function UserCard1() {
  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery<User>({
    cacheKey: ["shared-user", "1"],
    url: "/api/user/1",
    staleTime: 30000,
  });

  return (
    <div
      data-testid="user-card-1"
      className="border p-4 rounded"
      data-loading={isLoading}
    >
      <h3 className="font-semibold">User Card 1</h3>
      {isLoading ? (
        <div data-testid="loading">Loading...</div>
      ) : (
        <div>
          <p data-testid="user-name">{user?.name}</p>
          <p className="text-gray-600">ID: {user?.id}</p>
        </div>
      )}
      <button
        data-testid="refresh-btn"
        onClick={() => refetch()}
        className="mt-2 px-2 py-1 bg-blue-600 text-white text-sm rounded"
      >
        Refresh
      </button>
    </div>
  );
}

function UserCard2() {
  const { data: user, isLoading } = useQuery<User>({
    cacheKey: ["shared-user", "1"],
    url: "/api/user/1",
    staleTime: 30000,
  });

  return (
    <div
      data-testid="user-card-2"
      className="border p-4 rounded"
      data-loading={isLoading}
    >
      <h3 className="font-semibold">User Card 2</h3>
      {isLoading ? (
        <div data-testid="loading">Loading...</div>
      ) : (
        <div>
          <p data-testid="user-name">{user?.name}</p>
          <p className="text-gray-600">ID: {user?.id}</p>
        </div>
      )}
    </div>
  );
}

function UserHeader() {
  const { data: user, isLoading } = useQuery<User>({
    cacheKey: ["shared-user", "1"],
    url: "/api/user/1",
    staleTime: 30000,
  });

  return (
    <div
      data-testid="user-header"
      className="border-b pb-4 mb-6"
      data-loading={isLoading}
    >
      <h1 className="text-2xl font-bold">
        {isLoading ? (
          <div data-testid="loading">Loading...</div>
        ) : (
          <span data-testid="user-name">{user?.name}'s Profile</span>
        )}
      </h1>
    </div>
  );
}

export default function MultipleComponentsPage() {
  return (
    <div className="container mx-auto p-8">
      <UserHeader />

      <div className="grid grid-cols-2 gap-4">
        <UserCard1 />
        <UserCard2 />
      </div>

      <div className="mt-6 text-sm text-gray-600">
        All three components share the same query state. Refreshing from one
        component should update all others.
      </div>
    </div>
  );
}
