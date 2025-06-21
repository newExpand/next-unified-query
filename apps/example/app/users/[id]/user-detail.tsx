"use client";

import { FetchError } from "next-unified-query";
import { useQuery, useMutation } from "../../lib/query-client";
import { useQueryClient } from "../../lib/query-client";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  timestamp: number;
  testHeader: string | null;
  customHeader: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
}

interface UserDetailProps {
  userId: string;
}

export default function UserDetail({ userId }: UserDetailProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<User, FetchError>({
    cacheKey: ["user", userId],
    url: `/api/user/${userId}`,
    staleTime: 30000,
  });

  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery<Post[]>({
    cacheKey: ["user", userId, "posts"],
    url: `/api/user/${userId}/posts`,
    enabled: activeTab === "posts",
  });

  const updateUserMutation = useMutation({
    mutationKey: ["updateUser", userId],
    mutationFn: async (newName: string) => {
      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: Failed to update user`
        );
      }
      return response.json();
    },
    onMutate: async (newName: string) => {
      setSuccessMessage("");
      setErrorMessage("");

      const cacheKey = ["user", userId];

      const previousUser = queryClient.get<User>(cacheKey)?.data;

      queryClient.setQueryData<User>(cacheKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          name: newName,
          timestamp: Date.now(),
        };
      });

      return { previousUser };
    },
    onSuccess: (data, variables) => {
      setIsEditing(false);
      setSuccessMessage(
        `사용자 이름이 "${variables}"(으)로 성공적으로 업데이트되었습니다!`
      );

      queryClient.invalidateQueries(["user", userId]);

      queryClient.invalidateQueries(["users"]);

      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err, newName, context) => {
      console.error("Update failed:", err);

      if (context?.previousUser) {
        const cacheKey = ["user", userId];
        queryClient.setQueryData<User>(cacheKey, context.previousUser);
      }

      const errorMsg =
        err instanceof Error
          ? err.message
          : "사용자 업데이트 중 오류가 발생했습니다.";
      setErrorMessage(errorMsg);

      setTimeout(() => setErrorMessage(""), 5000);
    },
    onSettled: () => {
      queryClient.invalidateQueries(["user", userId]);
    },
  });

  const handleEdit = () => {
    setEditName(user?.name || "");
    setIsEditing(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSave = () => {
    if (editName.trim() && editName.trim() !== user?.name) {
      updateUserMutation.mutate(editName.trim());
    } else if (editName.trim() === user?.name) {
      setIsEditing(false);
      setErrorMessage("이름이 변경되지 않았습니다.");
      setTimeout(() => setErrorMessage(""), 3000);
    } else {
      setErrorMessage("이름을 입력해주세요.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName("");
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div data-testid="loading">Loading user details...</div>
      </div>
    );
  }

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

  return (
    <div className="container mx-auto p-8" data-testid="user-detail">
      {successMessage && (
        <div
          data-testid="success-message"
          className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
        >
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div
          data-testid="error-toast"
          className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
        >
          {errorMessage}
        </div>
      )}

      <div className="mb-6">
        {isEditing ? (
          <div className="space-y-4">
            <input
              data-testid="user-name-input"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyPress}
              className="text-2xl font-bold border-b-2 border-blue-600 outline-none bg-transparent"
              placeholder="사용자 이름을 입력하세요"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                data-testid="save-btn"
                onClick={handleSave}
                disabled={updateUserMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400 transition-colors"
              >
                {updateUserMutation.isPending ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                disabled={updateUserMutation.isPending}
                className="px-4 py-2 bg-gray-600 text-white rounded disabled:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
            {updateUserMutation.isPending && (
              <div data-testid="saving" className="text-blue-600">
                Saving changes...
              </div>
            )}
            <div className="text-xs text-gray-500">
              <p>💡 팁: Enter키로 저장, Esc키로 취소할 수 있습니다.</p>
            </div>
          </div>
        ) : (
          <div>
            <h1 data-testid="user-name" className="text-2xl font-bold">
              {user?.name}
            </h1>
            <p className="text-gray-600">User ID: {user?.id}</p>
            <div className="mt-2 space-x-2">
              <button
                data-testid="edit-user-btn"
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Edit User
              </button>
              <button
                data-testid="refresh-btn"
                onClick={() => refetch()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-b mb-6">
        <div className="flex space-x-4">
          <button
            data-testid="profile-tab"
            onClick={() => setActiveTab("profile")}
            className={`py-2 px-4 ${
              activeTab === "profile" ? "border-b-2 border-blue-600" : ""
            }`}
          >
            Profile
          </button>
          <button
            data-testid="posts-tab"
            onClick={() => setActiveTab("posts")}
            className={`py-2 px-4 ${
              activeTab === "posts" ? "border-b-2 border-blue-600" : ""
            }`}
          >
            Posts
          </button>
        </div>
      </div>

      {activeTab === "profile" && (
        <div data-testid="user-profile">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-2">
            <p>
              <strong>ID:</strong> {user?.id}
            </p>
            <p>
              <strong>Name:</strong> {user?.name}
            </p>
            <p>
              <strong>Test Header:</strong> {user?.testHeader || "None"}
            </p>
            <p>
              <strong>Last Updated:</strong>{" "}
              {new Date(user?.timestamp || 0).toLocaleString("en-US")}
            </p>
          </div>
        </div>
      )}

      {activeTab === "posts" && (
        <div>
          {postsError ? (
            <div data-testid="posts-error" className="text-red-600">
              Error loading posts:{" "}
              {postsError instanceof Error
                ? postsError.message
                : "Unknown error"}
            </div>
          ) : postsLoading ? (
            <div data-testid="posts-loading">Loading posts...</div>
          ) : (
            <div data-testid="posts-list">
              <h2 className="text-xl font-semibold mb-4">User Posts</h2>
              {posts?.length ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border p-4 rounded">
                      <h3 className="font-semibold">{post.title}</h3>
                      <p className="text-gray-600">{post.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No posts found.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
