import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  // 동적 권한 시뮬레이션
  const hasPermission = Math.random() > 0.3; // 70% 확률로 권한 부여

  const permissions = {
    canViewSensitiveData: hasPermission,
    canEditUsers: hasPermission,
    canDeletePosts: hasPermission && Math.random() > 0.5,
    role: hasPermission ? "admin" : "user",
    permissions: hasPermission
      ? ["read", "write", "delete", "admin"]
      : ["read"],
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(permissions);
}
