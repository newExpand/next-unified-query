import { NextRequest, NextResponse } from "next/server";

const mockPosts: Record<string, any[]> = {
  "1": [
    { id: "1", title: "Alice's First Post", content: "Hello from Alice!" },
    {
      id: "2",
      title: "Alice's Second Post",
      content: "Another post by Alice.",
    },
  ],
  "2": [
    { id: "3", title: "Bob's Adventures", content: "Bob's exciting journey." },
  ],
  "3": [
    {
      id: "4",
      title: "Charlie's Thoughts",
      content: "Deep thoughts by Charlie.",
    },
    { id: "5", title: "Charlie's Updates", content: "Latest from Charlie." },
    { id: "6", title: "Charlie's Review", content: "A review by Charlie." },
  ],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 네트워크 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 800));

  const posts = mockPosts[id] || [];

  // 에러 시뮬레이션 (특정 사용자)
  if (id === "error") {
    return NextResponse.json({ error: "Posts not found" }, { status: 404 });
  }

  return NextResponse.json(posts);
}
