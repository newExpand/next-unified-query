import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const comments = [
    {
      id: 1,
      content: "Great post!",
      authorId: 1,
      createdAt: new Date().toISOString(),
      likes: 5,
    },
    {
      id: 2,
      content: "Thanks for sharing",
      authorId: 2,
      createdAt: new Date().toISOString(),
      likes: 3,
    },
  ];

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const newComment = {
    id: Date.now(),
    content: body.content,
    authorId: body.authorId || 1,
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  return NextResponse.json(newComment, { status: 201 });
}
