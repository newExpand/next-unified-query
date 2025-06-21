import { NextRequest, NextResponse } from "next/server";

let attemptCount = 0;

/**
 * 불안정한 API 엔드포인트 (재시도 및 백오프 테스트용)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceFailure = searchParams.get("forceFailure") === "true";
  const attempt = parseInt(searchParams.get("attempt") || "1");

  try {
    // 인위적인 지연 추가 (불안정성 시뮬레이션)
    const delay = Math.random() * 2000 + 500; // 0.5~2.5초
    await new Promise((resolve) => setTimeout(resolve, delay));

    // 실패 시뮬레이션
    if (forceFailure) {
      // 첫 번째와 두 번째 시도는 항상 실패
      if (attempt <= 2) {
        const errors = [
          "Network timeout",
          "Service temporarily unavailable",
          "Internal server error",
          "Rate limit exceeded",
        ];
        const randomError = errors[Math.floor(Math.random() * errors.length)];

        return NextResponse.json(
          {
            success: false,
            message: randomError,
            attempt,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }

      // 세 번째 시도는 50% 확률로 성공
      if (attempt === 3 && Math.random() < 0.5) {
        return NextResponse.json(
          {
            success: false,
            message: "Final attempt also failed",
            attempt,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    }

    // 성공 응답
    const response = {
      success: true,
      data: `Successfully retrieved data on attempt ${attempt}`,
      timestamp: new Date().toISOString(),
      delay: Math.round(delay),
      source: "unstable-endpoint",
    };

    // 간헐적인 실패 시뮬레이션 (forceFailure가 false일 때도 20% 확률로 실패)
    if (!forceFailure && Math.random() < 0.2) {
      return NextResponse.json(
        {
          success: false,
          message: "Random failure occurred",
          attempt,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unstable endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        attempt,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const failureCount = body.failureCount || 3;

  attemptCount++;

  if (attemptCount <= failureCount) {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        attemptNumber: attemptCount,
        expectedFailures: failureCount,
      },
      { status: 500 }
    );
  }

  const response = {
    success: true,
    data: body,
    totalAttempts: attemptCount,
    failureCount,
  };

  attemptCount = 0; // 리셋

  return NextResponse.json(response);
}

// 카운터 리셋용 엔드포인트
export async function DELETE() {
  attemptCount = 0;

  return NextResponse.json({
    success: true,
    message: "Attempt counter reset",
    currentAttempts: attemptCount,
  });
}
