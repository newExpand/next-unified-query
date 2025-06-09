import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const posts = Array.from({ length: 5 }, (_, i) => ({
    id: `${page}-${i}`,
    title: `Post ${page}-${i}`,
    body: `Body for post ${page}-${i}`,
  }));
  return NextResponse.json(posts);
}
