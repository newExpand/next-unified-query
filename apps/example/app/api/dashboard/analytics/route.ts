import { NextResponse } from "next/server";

export async function GET() {
  // 느린 로딩 시뮬레이션 (1초 지연)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock analytics 데이터
  const analyticsData = {
    charts: ["Revenue Chart", "User Growth Chart"],
    metrics: { 
      conversion: 3.2, 
      retention: 85.5 
    }
  };

  return NextResponse.json(analyticsData);
}