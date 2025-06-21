import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get("count") || "1000");
    const type = searchParams.get("type") || "list";
    const includeContent = searchParams.get("content") === "true";

    // 처리 시간 시뮬레이션 (크기에 따라 증가)
    const processingTime = Math.min(count * 0.1, 500); // 최대 500ms
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // 리스트 아이템 타입에 따른 데이터 생성
    if (type === "list") {
      const items = Array.from({ length: count }, (_, i) => {
        const baseItem = {
          id: i + 1,
          title: `List Item ${i + 1}`,
          description: `Description for item ${i + 1}`,
          status: ["active", "inactive", "pending"][i % 3],
          priority: ["high", "medium", "low"][i % 3],
          category: `Category ${(i % 10) + 1}`,
          tags: [`tag${(i % 5) + 1}`, `type${(i % 3) + 1}`],
          score: Math.floor(Math.random() * 100),
          createdAt: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 대용량 콘텐츠 추가 (메모리 사용량 테스트용)
        if (includeContent) {
          return {
            ...baseItem,
            content: `This is a large content block for item ${i + 1}. `.repeat(
              10
            ),
            metadata: {
              size: "large",
              wordCount: 100,
              characterCount: 500,
            },
            relatedItems: Array.from({ length: 5 }, (_, j) => ({
              id: `related-${i}-${j}`,
              title: `Related Item ${j + 1}`,
            })),
          };
        }

        return baseItem;
      });

      return NextResponse.json({
        type: "list",
        items,
        metadata: {
          total: items.length,
          requested: count,
          page: 1,
          pageSize: items.length,
          generatedAt: new Date().toISOString(),
          dataSize: JSON.stringify(items).length,
          processingTime: Math.round(processingTime),
          includesContent: includeContent,
        },
      });
    }

    // 사용자 데이터 타입 (기존 구현 유지하되 count 파라미터 적용)
    const users = Array.from({ length: Math.min(count, 10000) }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      profile: {
        bio: `This is the bio for User ${
          i + 1
        }. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        avatar: `https://example.com/avatar${i + 1}.jpg`,
        preferences: {
          theme: i % 2 === 0 ? "dark" : "light",
          language: i % 3 === 0 ? "ko" : "en",
          notifications: i % 2 === 0,
        },
      },
      posts: includeContent
        ? Array.from(
            { length: Math.floor(Math.random() * 10) + 1 },
            (_, j) => ({
              id: j + 1,
              title: `Post ${j + 1} by User ${i + 1}`,
              content: `This is the content of post ${j + 1} by User ${
                i + 1
              }. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
              tags: [`tag${j + 1}`, `user${i + 1}`, `category${(i + j) % 5}`],
              createdAt: new Date(
                Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
              ).toISOString(),
            })
          )
        : [],
      stats: {
        postsCount: Math.floor(Math.random() * 50),
        followersCount: Math.floor(Math.random() * 1000),
        followingCount: Math.floor(Math.random() * 500),
      },
    }));

    return NextResponse.json({
      type: "users",
      users,
      metadata: {
        total: users.length,
        requested: count,
        page: 1,
        pageSize: users.length,
        generatedAt: new Date().toISOString(),
        dataSize: JSON.stringify(users).length,
        processingTime: Math.round(processingTime),
        includesContent: includeContent,
        limits: {
          maxUsers: 10000,
          actualGenerated: users.length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate dataset",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
