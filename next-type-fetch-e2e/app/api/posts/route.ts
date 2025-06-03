import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "1";
  // 예시 데이터
  const posts = [
    { id: "1", userId, title: "First Post", body: "Hello world" },
    { id: "2", userId, title: "Second Post", body: "Another post" },
  ];
  return NextResponse.json(posts);
}
