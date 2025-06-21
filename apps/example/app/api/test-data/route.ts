import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "1";
  const size = searchParams.get("size") || "medium";

  // 크기에 따른 데이터 생성
  const generateData = (size: string) => {
    const baseData = {
      id: parseInt(id),
      name: `Test Item ${id}`,
      timestamp: Date.now(),
      random: Math.random(),
    };

    switch (size) {
      case "small":
        return {
          ...baseData,
          data: Array.from({ length: 10 }, (_, i) => ({
            key: i,
            value: Math.random(),
          })),
        };
      case "large":
        return {
          ...baseData,
          data: Array.from({ length: 1000 }, (_, i) => ({
            key: i,
            value: Math.random(),
            description: `Large data item ${i} for testing memory usage`,
          })),
        };
      default: // medium
        return {
          ...baseData,
          data: Array.from({ length: 100 }, (_, i) => ({
            key: i,
            value: Math.random(),
            type: "medium",
          })),
        };
    }
  };

  // 네트워크 지연 시뮬레이션 (크기에 따라 다름)
  const delay = size === "large" ? 300 : size === "small" ? 50 : 150;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return NextResponse.json({
    message: `Test data for ${size} size`,
    ...generateData(size),
    metadata: {
      requestId: id,
      size,
      delay,
      generatedAt: new Date().toISOString(),
    },
  });
}
