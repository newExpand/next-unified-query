import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";

    // 검색 지연 시뮬레이션 (200ms)
    await new Promise(resolve => setTimeout(resolve, 200));

    // 검색 결과 생성
    const results: string[] = [];
    if (query.length >= 3) {
      results.push(
        `${query} Result 1 in ${category}`,
        `${query} Result 2 in ${category}`,
        `${query} Result 3 in ${category}`
      );
    }

    return NextResponse.json({
      query,
      category,
      results,
      totalCount: results.length,
      searchTime: Date.now(),
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}