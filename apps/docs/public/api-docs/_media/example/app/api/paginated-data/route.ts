import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");

  // 로딩 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return Response.json({
    data: [`Page ${page} Item 1`, `Page ${page} Item 2`],
    page: page,
    hasNext: page < 3,
  });
}
