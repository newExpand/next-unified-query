import { NextRequest, NextResponse } from "next/server";

// Mock posts data
const mockPosts = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  title: `Sample Post ${i + 1}`,
  excerpt: `This is the excerpt for post ${i + 1}. It gives a brief overview of the content.`,
  content: `Full content of post ${i + 1}. This would be a longer article with detailed information about the topic.`,
  author: `Author ${Math.floor(i / 10) + 1}`,
  createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
}));

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const posts = mockPosts.slice(startIndex, endIndex);
  
  return NextResponse.json(posts);
}
