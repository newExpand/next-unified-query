import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  const userStats = {
    user: {
      id: 1,
      name: "Test User",
    },
    posts: [
      { id: 1, views: 120 },
      { id: 2, views: 85 },
      { id: 3, views: 200 },
      { id: 4, views: 150 },
    ],
    comments: [
      { id: 1, likes: 15 },
      { id: 2, likes: 8 },
      { id: 3, likes: 22 },
      { id: 4, likes: 5 },
      { id: 5, likes: 12 },
    ],
  };

  return NextResponse.json(userStats);
}
