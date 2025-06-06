import { NextRequest, NextResponse } from "next/server";
import { db } from "../../db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
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
