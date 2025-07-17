import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  // 로딩 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 800));

  return Response.json({
    query,
    results: [`Result for "${query}" #1`, `Result for "${query}" #2`],
    timestamp: Date.now(),
  });
}
