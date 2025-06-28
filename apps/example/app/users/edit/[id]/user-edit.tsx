"use client";

import { FetchError } from "next-unified-query";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "../../../lib/query-client";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  timestamp: number;
  testHeader: string | null;
  customHeader: string | null;
}

interface UserEditProps {
  userId: string;
}

export default function UserEdit({ userId }: UserEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<User, FetchError>({
    cacheKey: ["user", userId],
    url: `/api/user/${userId}`,
    staleTime: 300000, // 5분
    gcTime: 600000, // 10분
  });

  const updateUserMutation = useMutation<
    User,
    FetchError,
    { name: string },
    { previousUser: User | undefined }
  >({
    mutationFn: async ({ name }) => {
      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      return response.json();
    },
    onMutate: async ({ name }) => {
      // Optimistic update: 즉시 UI 업데이트
      const previousUser = user;

      // 편집 모드 즉시 종료 (optimistic update)
      setIsEditing(false);

      // QueryClient의 setQueryData를 사용해서 캐시를 즉시 업데이트
      queryClient.setQueryData<User>(["user", userId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          name,
          timestamp: Date.now(),
        };
      });

      return { previousUser };
    },
    onError: (error, variables, context) => {
      // 에러 발생 시 이전 상태로 롤백
      console.error("Update failed, rolling back:", error);

      // 이전 데이터로 롤백
      if (context?.previousUser) {
        queryClient.setQueryData<User>(["user", userId], context.previousUser);
      }

      setIsEditing(true);
      setEditedName(variables.name);
    },
    onSuccess: (data) => {
      // 성공 시 편집 모드 종료
      setIsEditing(false);
      setEditedName("");

      // 서버 응답으로 최종 데이터 업데이트
      queryClient.setQueryData<User>(["user", userId], data);
    },
  });

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedName(user?.name || "");
  };

  const handleSave = () => {
    if (editedName.trim()) {
      updateUserMutation.mutate({ name: editedName.trim() });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName("");
  };

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div data-testid="error-message" className="text-red-600">
          Error: {error.message}
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div data-testid="loading">Loading user...</div>
      </div>
    );
  }

  // setQueryData로 캐시가 즉시 업데이트되므로 user?.name을 바로 사용
  const displayName = user?.name || "Unknown User";

  return (
    <div className="container mx-auto p-8" data-testid="user-detail">
      <h1 className="text-2xl font-bold mb-6">Edit User {userId}</h1>

      <div className="space-y-6">
        <div className="border p-6 rounded-lg">
          <h2 className="font-semibold mb-4">User Information</h2>

          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <p data-testid="user-name" className="text-lg font-medium">
                  {displayName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <p className="text-gray-600">{user?.id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-600">
                  {new Date(user?.timestamp || 0).toLocaleString()}
                </p>
              </div>

              <button
                data-testid="edit-user-btn"
                onClick={handleEditClick}
                disabled={updateUserMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {updateUserMutation.isPending ? "Saving..." : "Edit User"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  data-testid="user-name-input"
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user name"
                />
              </div>

              <div className="flex gap-2">
                <button
                  data-testid="save-btn"
                  onClick={handleSave}
                  disabled={updateUserMutation.isPending || !editedName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {updateUserMutation.isPending ? "Saving..." : "Save"}
                </button>

                <button
                  data-testid="cancel-btn"
                  onClick={handleCancel}
                  disabled={updateUserMutation.isPending}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mutation Status */}
        <div className="border p-4 rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">Mutation Status</h3>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Status:</strong>{" "}
              {updateUserMutation.isPending
                ? "🟡 Updating..."
                : updateUserMutation.isError
                ? "🔴 Failed"
                : updateUserMutation.isSuccess
                ? "🟢 Success"
                : "⚪ Idle"}
            </p>

            {updateUserMutation.isError && (
              <p className="text-red-600">
                <strong>Error:</strong> {updateUserMutation.error?.message}
              </p>
            )}

            {updateUserMutation.isPending && (
              <p className="text-blue-600">
                <strong>Optimistic Update:</strong> UI updated immediately
              </p>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="border p-4 rounded-lg bg-blue-50">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Current Time:</strong> {new Date().toLocaleString()}
            </p>
            <p>
              <strong>User Timestamp:</strong>{" "}
              {new Date(user?.timestamp || 0).toLocaleString()}
            </p>
            <p>
              <strong>Is Editing:</strong> {isEditing ? "Yes" : "No"}
            </p>
            <p>
              <strong>Mutation Pending:</strong>{" "}
              {updateUserMutation.isPending ? "Yes" : "No"}
            </p>
            <p>
              <strong>Display Name:</strong> {displayName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
