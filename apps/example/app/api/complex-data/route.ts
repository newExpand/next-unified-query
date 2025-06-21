import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 복잡한 중첩 데이터 구조 반환
  const complexData = {
    id: 1,
    name: "Test User",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    tags: ["tag1", "tag2", "tag3"],
    skills: ["JavaScript", "TypeScript", "React"],
    profile: {
      bio: "Test bio content",
      avatar: "https://example.com/avatar.jpg",
      socialLinks: {
        github: "https://github.com/testuser",
        linkedin: "https://linkedin.com/in/testuser",
      },
    },
    preferences: {
      theme: "dark",
      notifications: true,
      language: "ko",
    },
    stats: {
      posts: 25,
      views: 1500,
      likes: 89,
    },
    metadata: {
      version: "1.0.0",
      lastLogin: "2023-12-01T10:30:00Z",
    },
  };

  return NextResponse.json(complexData);
}
