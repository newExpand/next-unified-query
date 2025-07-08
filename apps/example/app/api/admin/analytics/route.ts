import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const userRole = request.headers.get("x-user-role");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자 권한 확인
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // 토큰 검증 시뮬레이션
    if (
      token === "null" ||
      (!token.startsWith("access_token_") && token !== "token")
    ) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // 관리자 전용 분석 데이터 반환
    return NextResponse.json({
      totalRevenue: 125000,
      systemHealth: "good",
      userRegistrations: 45,
      serverMetrics: {
        cpu: 65.5,
        memory: 78.2,
        disk: 45.8,
        network: 89.3,
      },
      securityAlerts: [
        {
          id: 1,
          type: "warning",
          message: "Multiple failed login attempts detected",
          timestamp: "2023-12-01T10:30:00.000Z",
        },
        {
          id: 2,
          type: "info",
          message: "Security patch applied successfully",
          timestamp: "2023-12-01T09:15:00.000Z",
        },
      ],
      databaseStats: {
        totalRecords: 125000,
        queryPerformance: 95.2,
        backupStatus: "completed",
        lastBackup: "2023-12-01T02:00:00.000Z",
      },
      financialSummary: {
        totalRevenue: 125000,
        monthlyRevenue: 25000,
        yearOverYearGrowth: 15.8,
        topProducts: [
          { name: "Product A", revenue: 45000 },
          { name: "Product B", revenue: 35000 },
          { name: "Product C", revenue: 25000 },
        ],
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
