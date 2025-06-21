import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // 토큰 검증 시뮬레이션
    if (token === "null" || !token.startsWith("access_token_")) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // 대시보드 데이터 반환
    return NextResponse.json({
      stats: {
        totalUsers: 150,
        activeUsers: 89,
        totalRevenue: 125000,
        monthlyGrowth: 12.5,
      },
      recentActivity: [
        "User A logged in",
        "User B updated profile",
        "New order #12345 placed",
        "User C completed onboarding",
        "System backup completed",
      ],
      chartData: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Users",
            data: [120, 135, 140, 145, 148, 150],
          },
          {
            label: "Revenue",
            data: [95000, 105000, 110000, 115000, 120000, 125000],
          },
        ],
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}