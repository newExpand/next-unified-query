import { NextRequest, NextResponse } from "next/server";
import { db } from "../../db";

// Mock posts data (same as in page/route.ts)
const mockPosts = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  userId: "1", // 호환성을 위해 추가
  title: `Sample Post ${i + 1}`,
  body: `Full content of post ${
    i + 1
  }. This would be a longer article with detailed information about the topic.`,
  excerpt: `This is the excerpt for post ${
    i + 1
  }. It gives a brief overview of the content.`,
  author: `Author ${Math.floor(i / 10) + 1}`,
  createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
}));

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 먼저 db.posts에서 찾기 (실제 데이터)
  let post = db.posts.find((post) => post.id === id);

  // db.posts에 없으면 mockPosts에서 찾기
  if (!post) {
    const mockPost = mockPosts.find((post) => post.id === id);
    if (mockPost) {
      // mockPost를 db.posts 형식으로 변환
      post = {
        id: mockPost.id,
        userId: mockPost.userId,
        title: mockPost.title,
        body: mockPost.body,
      };
    }
  }

  if (post) {
    return NextResponse.json(post);
  } else {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postIndex = db.posts.findIndex((post) => post.id === id);

  if (postIndex !== -1) {
    const [deletedPost] = db.posts.splice(postIndex, 1);
    return NextResponse.json(deletedPost);
  } else {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
}
