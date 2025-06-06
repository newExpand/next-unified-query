import { NextRequest, NextResponse } from "next/server";
import { db } from "../db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "1";
  // Adding a small delay to simulate network latency
  await new Promise((res) => setTimeout(res, 500));
  const userPosts = db.posts.filter((p) => p.userId === userId);
  return NextResponse.json(userPosts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title || !body.body) {
    return NextResponse.json(
      { message: "Title and body are required" },
      { status: 400 }
    );
  }
  const newPost = {
    id: String(Date.now()),
    userId: body.userId || "1",
    title: body.title,
    body: body.body,
  };
  db.posts.push(newPost);
  return NextResponse.json(newPost, { status: 201 });
}
