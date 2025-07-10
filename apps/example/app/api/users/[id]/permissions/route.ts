import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  const userId = parseInt(params.id);

  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  // Mock 사용자 권한 정보
  const userPermissions = {
    userId,
    permissions: ["read", "write", "admin"],
    roles: ["developer", "team-lead"],
  };

  return NextResponse.json(userPermissions);
}
