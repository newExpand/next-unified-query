import { NextRequest, NextResponse } from "next/server";

let consecutiveFailures = 0;
let isRecovered = false;

/**
 * 서킷 브레이커 패턴 테스트용 API
 */
export async function GET(request: NextRequest) {
  // 강제 복구 플래그 확인
  const { searchParams } = new URL(request.url);
  const forceRecover = searchParams.get("recover") === "true";

  if (forceRecover) {
    isRecovered = true;
    consecutiveFailures = 0;
  }

  // 5번 연속 실패 후 서킷 브레이커 동작
  if (!isRecovered && consecutiveFailures < 5) {
    consecutiveFailures++;

    return NextResponse.json(
      {
        error: "Server Error",
        consecutiveFailures,
        message: "서버에 문제가 발생했습니다.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  // 복구된 상태에서는 성공 응답
  return NextResponse.json({
    data: "Service recovered",
    message: "서비스가 정상 복구되었습니다.",
    totalFailuresBeforeRecovery: consecutiveFailures,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case "reset":
      consecutiveFailures = 0;
      isRecovered = false;
      return NextResponse.json({
        success: true,
        message: "Circuit breaker state reset",
        consecutiveFailures,
        isRecovered,
      });

    case "recover":
      isRecovered = true;
      return NextResponse.json({
        success: true,
        message: "Service manually recovered",
        consecutiveFailures,
        isRecovered,
      });

    case "status":
      return NextResponse.json({
        consecutiveFailures,
        isRecovered,
        shouldFail: !isRecovered && consecutiveFailures < 5,
        circuitState:
          consecutiveFailures >= 5 && !isRecovered ? "OPEN" : "CLOSED",
      });

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}

// 상태 리셋용
export async function DELETE() {
  consecutiveFailures = 0;
  isRecovered = false;

  return NextResponse.json({
    success: true,
    message: "Circuit breaker completely reset",
    state: {
      consecutiveFailures,
      isRecovered,
    },
  });
}
