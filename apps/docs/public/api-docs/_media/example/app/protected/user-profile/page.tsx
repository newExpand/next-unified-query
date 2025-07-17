"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "../../lib/query-client";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  joinDate?: string;
  lastActive?: string;
}

export default function UserProfilePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // SSR 호환성을 위해 클라이언트에서만 localStorage 접근
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      setAuthToken(token);
      setIsAuthenticated(true);

      // Storage event listener for multi-tab logout synchronization
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "accessToken" && e.newValue === null) {
          // Token was removed in another tab, redirect to login
          router.push("/auth/login");
        }
      };

      window.addEventListener("storage", handleStorageChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, [router]);

  const {
    data: userProfile,
    isLoading,
    error,
  } = useQuery<UserProfile>({
    cacheKey: ["user", "profile"],
    url: "/api/user/profile",
    fetchConfig: {
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {},
    },
    enabled: isAuthenticated && !!authToken,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async (_, fetcher) => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      const response = await fetcher.post("/api/auth/logout", {
        accessToken,
        refreshToken,
      });

      return response.data;
    },
    onSuccess: () => {
      // Clear tokens and redirect on successful logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.push("/auth/login");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Still clear tokens and redirect even if server logout fails
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.push("/auth/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Failed to load profile: {error.message}</p>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className={`mt-4 px-4 py-2 rounded text-white ${
              logoutMutation.isPending
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">User Profile</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className={`px-4 py-2 rounded text-white ${
                  logoutMutation.isPending
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                data-testid="logout-btn"
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="user-profile"
          >
            <div className="flex items-center space-x-6 mb-6">
              {userProfile?.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="h-24 w-24 rounded-full"
                />
              )}
              <div>
                <h2
                  className="text-2xl font-bold text-gray-900"
                  data-testid="user-name"
                >
                  {userProfile?.name}
                </h2>
                <p className="text-gray-600" data-testid="user-email">
                  {userProfile?.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                <p
                  className="mt-1 text-lg text-gray-900"
                  data-testid="user-role"
                >
                  {userProfile?.role}
                </p>
              </div>

              {userProfile?.joinDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Member Since
                  </h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {new Date(userProfile.joinDate).toLocaleDateString("en-US")}
                  </p>
                </div>
              )}

              {userProfile?.lastActive && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Last Active
                  </h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {new Date(userProfile.lastActive).toLocaleDateString(
                      "en-US"
                    )}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500">User ID</h3>
                <p className="mt-1 text-lg text-gray-900" data-testid="user-id">
                  {userProfile?.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
