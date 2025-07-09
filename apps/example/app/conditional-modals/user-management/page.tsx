"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";

interface UserDetails {
  id: number;
  name: string;
  email: string;
  lastLogin: string;
  profile: {
    department: string;
    position: string;
  };
}

interface UserPermissions {
  userId: number;
  permissions: string[];
  roles: string[];
}

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
}

export default function UserManagementPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "permissions">("details");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 사용자 목록 (항상 로드)
  const users: User[] = [
    { id: 1, name: "김철수", email: "chulsoo@example.com", status: "active" },
    { id: 2, name: "이영희", email: "younghee@example.com", status: "active" },
    { id: 3, name: "박민수", email: "minsoo@example.com", status: "inactive" },
    { id: 4, name: "최정애", email: "jungae@example.com", status: "active" },
  ];

  // 사용자 상세 정보 - 모달이 열리고 details 탭일 때만 로드
  const { data: userDetails, isLoading: detailsLoading } = useQuery<UserDetails>({
    cacheKey: ["users", selectedUserId, "details"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${selectedUserId}/details`);
      if (!response.ok) {
        throw new Error("사용자 상세 정보 로드 실패");
      }
      return response.json();
    },
    enabled: isModalOpen && selectedUserId !== null && activeTab === "details",
  });

  // 사용자 권한 정보 - 모달이 열리고 permissions 탭일 때만 로드
  const { data: userPermissions, isLoading: permissionsLoading } = useQuery<UserPermissions>({
    cacheKey: ["users", selectedUserId, "permissions"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${selectedUserId}/permissions`);
      if (!response.ok) {
        throw new Error("사용자 권한 정보 로드 실패");
      }
      return response.json();
    },
    enabled: isModalOpen && selectedUserId !== null && activeTab === "permissions",
  });

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
    setActiveTab("details"); // 모달 열 때 항상 details 탭부터 시작
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };

  const handleTabChange = (tab: "details" | "permissions") => {
    setActiveTab(tab);
  };

  const selectedUser = users.find(user => user.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            사용자 관리 (조건부 모달 쿼리)
          </h1>

          {/* 사용자 목록 */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">사용자 목록</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" data-testid="users-list">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.status === "active" 
                          ? "bg-green-100 text-green-600" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {user.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{user.email}</p>
                    <button
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm font-medium"
                      data-testid={`view-user-${user.id}-btn`}
                    >
                      상세 보기
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 쿼리 상태 표시 */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-3">쿼리 상태</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-600">사용자 상세 정보:</span>
                    <span className={`font-medium ${
                      !isModalOpen || selectedUserId === null || activeTab !== "details" ? "text-gray-500" : 
                      detailsLoading ? "text-blue-600" : 
                      userDetails ? "text-green-600" : "text-red-600"
                    }`}>
                      {!isModalOpen || selectedUserId === null || activeTab !== "details" ? "대기" : 
                       detailsLoading ? "로딩" : 
                       userDetails ? "완료" : "실패"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    모달 열림 AND details 탭 선택 시에만 로드
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-600">사용자 권한 정보:</span>
                    <span className={`font-medium ${
                      !isModalOpen || selectedUserId === null || activeTab !== "permissions" ? "text-gray-500" : 
                      permissionsLoading ? "text-blue-600" : 
                      userPermissions ? "text-green-600" : "text-red-600"
                    }`}>
                      {!isModalOpen || selectedUserId === null || activeTab !== "permissions" ? "대기" : 
                       permissionsLoading ? "로딩" : 
                       userPermissions ? "완료" : "실패"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    모달 열림 AND permissions 탭 선택 시에만 로드
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-600 text-sm">
                  <strong>조건부 모달 쿼리:</strong> 각 사용자의 데이터는 해당 사용자의 모달이 열릴 때만 로드됩니다.
                  탭 전환 시에도 해당 탭의 데이터만 선택적으로 로드됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 사용자 상세 모달 */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" data-testid="user-details-modal">
            {/* 모달 헤더 */}
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedUser.name} 상세 정보
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
                data-testid="close-modal-btn"
              >
                ×
              </button>
            </div>

            {/* 모달 탭 */}
            <div className="border-b px-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => handleTabChange("details")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "details"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  상세 정보
                  {userDetails && (
                    <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                      ✓
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange("permissions")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "permissions"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  data-testid="permissions-tab"
                >
                  권한 관리
                  {userPermissions && (
                    <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                      ✓
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* 모달 콘텐츠 */}
            <div className="p-6">
              {activeTab === "details" && (
                <div>
                  {detailsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">사용자 정보 로딩 중...</p>
                    </div>
                  ) : userDetails ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">기본 정보</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">이름:</span>
                              <span className="ml-2 font-medium" data-testid="modal-user-name">
                                {userDetails.name}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">이메일:</span>
                              <span className="ml-2 font-medium" data-testid="modal-user-email">
                                {userDetails.email}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">마지막 로그인:</span>
                              <span className="ml-2 font-medium">
                                {new Date(userDetails.lastLogin).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">조직 정보</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">부서:</span>
                              <span className="ml-2 font-medium">
                                {userDetails.profile.department}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">직책:</span>
                              <span className="ml-2 font-medium">
                                {userDetails.profile.position}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      사용자 정보를 불러올 수 없습니다
                    </div>
                  )}
                </div>
              )}

              {activeTab === "permissions" && (
                <div>
                  {permissionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">권한 정보 로딩 중...</p>
                    </div>
                  ) : userPermissions ? (
                    <div className="space-y-6" data-testid="user-permissions">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">권한 목록</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {userPermissions.permissions.map((permission, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm"
                              data-testid="permission-item"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">역할</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {userPermissions.roles.map((role, index) => (
                            <span
                              key={index}
                              className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      권한 정보를 불러올 수 없습니다
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}