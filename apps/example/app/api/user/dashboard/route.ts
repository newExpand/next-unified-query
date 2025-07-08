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
    
    // 토큰 검증 시뮬레이션 (일반 사용자는 token으로도 허용)
    if (token === "null" || (!token.startsWith("access_token_") && token !== "token")) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // 일반 사용자 대시보드 데이터 반환
    return NextResponse.json({
      myTasks: 5,
      notifications: 3,
      recentProjects: [
        "Project A",
        "Project B",
        "Project C"
      ],
      upcomingDeadlines: [
        {
          project: "Project A",
          deadline: "2023-12-15T23:59:59.000Z",
          status: "in_progress"
        },
        {
          project: "Project D",
          deadline: "2023-12-20T23:59:59.000Z",
          status: "pending"
        }
      ],
      completedTasksThisWeek: 8,
      hoursLoggedThisWeek: 32.5,
      teamMembers: [
        { name: "Alice", avatar: "https://example.com/alice.jpg" },
        { name: "Bob", avatar: "https://example.com/bob.jpg" },
        { name: "Charlie", avatar: "https://example.com/charlie.jpg" }
      ],
      personalStats: {
        productivity: 87.5,
        tasksCompleted: 45,
        collaborations: 12,
        skillProgress: {
          javascript: 85,
          react: 78,
          typescript: 72
        }
      }
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}