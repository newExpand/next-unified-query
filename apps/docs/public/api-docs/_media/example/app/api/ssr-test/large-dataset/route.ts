import { NextRequest, NextResponse } from "next/server";

// 대용량 데이터 생성 함수
function generateLargeDataset(size: number = 1000) {
  return Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    description: `This is a detailed description for item ${i + 1}. `.repeat(3),
    category: `Category ${Math.floor(i / 100) + 1}`,
    price: Math.floor(Math.random() * 1000) + 10,
    tags: [`tag${i % 10}`, `tag${(i + 1) % 10}`, `tag${(i + 2) % 10}`],
    metadata: {
      created: new Date(Date.now() - Math.random() * 86400000 * 365).toISOString(),
      updated: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      views: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 1000),
    },
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = parseInt(searchParams.get("size") || "1000");
  
  const startTime = Date.now();
  const dataset = generateLargeDataset(size);
  const endTime = Date.now();
  
  return NextResponse.json(dataset, {
    headers: {
      "X-Response-Dataset-Size": size.toString(),
      "X-Response-Generation-Time": (endTime - startTime).toString(),
      "X-Response-Data-Length": JSON.stringify(dataset).length.toString(),
      "X-Response-Timestamp": Date.now().toString(),
    },
  });
}