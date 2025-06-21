"use client";

import { FetchError } from "next-unified-query";
import { useQuery } from "../lib/query-client";
import Link from "next/link";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function UsersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: users,
    isLoading,
    error,
    refetch,
  } = useQuery<User[], FetchError>({
    cacheKey: ["users", refreshKey],
    url: "/api/users",
    staleTime: 30000, // 30초
  });

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div data-testid="loading">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div data-testid="error-message" className="text-red-600">
          Error loading users: {error.message}
        </div>
        <button
          data-testid="retry-btn"
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users List</h1>
        <button
          data-testid="refresh-btn"
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Refresh
        </button>
      </div>

      <div data-testid="users-list" className="space-y-4">
        {users?.map((user) => (
          <div
            key={user.id}
            data-testid={`user-item-${user.id}`}
            className="border p-4 rounded hover:bg-gray-50"
          >
            <Link href={`/users/${user.id}`} className="block">
              <div data-testid="user-name" className="font-semibold">
                {user.name}
              </div>
              <div className="text-gray-600">{user.email}</div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
