import { NextResponse } from "next/server";

export async function GET() {
  // Mock 사용자 대시보드 데이터
  const userDashboardData = {
    myTasks: 5,
    notifications: 3,
    recentProjects: ["Project A", "Project B"]
  };

  return NextResponse.json(userDashboardData);
}