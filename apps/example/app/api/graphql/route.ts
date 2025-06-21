import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { query, variables } = body;

  // GraphQL 쿼리 시뮬레이션
  if (query.includes("userProfile")) {
    const response = {
      data: {
        user: {
          id: variables?.userId || 1,
          name: "GraphQL User",
          email: "graphql@example.com",
          posts: [
            { id: 1, title: "GraphQL Post 1", content: "Content 1" },
            { id: 2, title: "GraphQL Post 2", content: "Content 2" },
          ],
          profile: {
            bio: "GraphQL enthusiast",
            avatar: "https://example.com/graphql-avatar.jpg",
          },
        },
      },
    };

    return NextResponse.json(response);
  }

  // 기본 응답
  return NextResponse.json({
    data: null,
    errors: [
      {
        message: "Query not supported in simulation",
        locations: [{ line: 1, column: 1 }],
      },
    ],
  });
}
