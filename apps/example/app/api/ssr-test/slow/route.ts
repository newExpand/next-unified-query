import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  // 느린 응답 시뮬레이션 (1-3초)
  const delay = Math.floor(Math.random() * 2000) + 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const data = {
    message: "This is a slow response for testing purposes",
    delay,
    timestamp: Date.now(),
    type: "slow",
  };

  return NextResponse.json(data, {
    headers: {
      "X-Response-Type": "slow",
      "X-Response-Delay": delay.toString(),
      "X-Response-Timestamp": Date.now().toString(),
    },
  });
}
