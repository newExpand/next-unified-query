import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get("count") || "1000");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "1000");

  // 제품 데이터 생성
  const products = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: Math.round((Math.random() * 1000 + 10) * 100) / 100,
    category: ["Electronics", "Books", "Clothing", "Home", "Sports"][
      Math.floor(Math.random() * 5)
    ],
    tags: [
      `tag${Math.floor(Math.random() * 10)}`,
      `feature${Math.floor(Math.random() * 5)}`,
      `brand${Math.floor(Math.random() * 3)}`,
    ],
    metadata: {
      weight: Math.round((Math.random() * 5 + 0.1) * 100) / 100,
      dimensions: {
        width: Math.round((Math.random() * 100 + 1) * 100) / 100,
        height: Math.round((Math.random() * 100 + 1) * 100) / 100,
        depth: Math.round((Math.random() * 100 + 1) * 100) / 100,
      },
    },
    createdAt: new Date(
      Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));

  const bulkData = {
    products,
    total: count,
    page,
    pageSize,
  };

  return NextResponse.json(bulkData);
}
