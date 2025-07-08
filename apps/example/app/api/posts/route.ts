import { NextRequest, NextResponse } from "next/server";
import { db } from "../db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "1";
  const category = searchParams.get("category");
  
  // Adding a small delay to simulate network latency
  await new Promise((res) => setTimeout(res, 500));
  
  let posts = db.posts.filter((p) => p.userId === userId);
  
  // category 필터링 적용
  if (category) {
    posts = posts.filter((p) => (p as any).category === category);
  }
  
  // 테스트에서 기대하는 형식으로 반환
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // content 또는 body 필드 모두 지원
  const content = body.content || body.body;
  
  if (!body.title || !content) {
    return NextResponse.json(
      { message: "Title and content are required" },
      { status: 400 }
    );
  }
  
  // 2초 지연으로 콜백 순서 테스트 지원
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const newPost = {
    id: Date.now(), // number 타입으로 변경
    userId: body.userId || "1",
    title: body.title,
    content: content, // content 필드로 통일
    body: content, // 하위 호환성을 위해 body도 유지
    category: body.category, // category 필드 추가
    createdAt: new Date().toISOString(), // createdAt 필드 추가
    publishedAt: new Date().toISOString(),
  };
  
  db.posts.push(newPost);
  return NextResponse.json(newPost, { status: 201 });
}
