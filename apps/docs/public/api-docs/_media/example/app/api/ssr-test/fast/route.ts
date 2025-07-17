import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  // 빠른 응답 시뮬레이션 (10-50ms)
  const delay = Math.floor(Math.random() * 40) + 10;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const data = {
    message: "This is a fast response for testing purposes",
    delay,
    timestamp: Date.now(),
    type: "fast",
  };

  return NextResponse.json(data, {
    headers: {
      "X-Response-Type": "fast",
      "X-Response-Delay": delay.toString(),
      "X-Response-Timestamp": Date.now().toString(),
    },
  });
}
