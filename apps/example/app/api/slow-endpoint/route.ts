import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 2-5초 랜덤 지연
  const delay = Math.floor(Math.random() * 3000) + 2000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const response = {
    data: "slow response",
    delay: `${delay}ms`,
    timestamp: new Date().toISOString(),
    message:
      "This endpoint intentionally has a slow response time for testing timeout and retry scenarios",
  };

  return NextResponse.json(response);
}
