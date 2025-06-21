import { NextRequest, NextResponse } from "next/server";

interface ImageMetadata {
  id: string;
  likes: number;
  views: number;
  tags: string[];
  uploadedBy: string;
  uploadDate: string;
  fileSize: string;
  dimensions: string;
}

/**
 * 이미지 메타데이터 API
 * GET /api/image-metadata/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 시뮬레이션된 이미지 메타데이터 생성
    const imageMetadata: ImageMetadata = {
      id,
      likes: Math.floor(Math.random() * 1000) + 100,
      views: Math.floor(Math.random() * 10000) + 1000,
      tags: getTagsForImage(id),
      uploadedBy: getRandomPhotographer(),
      uploadDate: getRandomDate(),
      fileSize: `${(Math.random() * 5 + 0.5).toFixed(1)}MB`,
      dimensions: getDimensionsForImage(id),
    };

    // 약간의 지연 시뮬레이션 (실제 API 호출 느낌)
    await new Promise((resolve) =>
      setTimeout(resolve, 200 + Math.random() * 300)
    );

    return NextResponse.json(imageMetadata, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300", // 5분 캐시
      },
    });
  } catch (error) {
    console.error("Image metadata API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch image metadata" },
      { status: 500 }
    );
  }
}

function getTagsForImage(id: string): string[] {
  const tagSets = [
    ["nature", "landscape", "photography", "scenic"],
    ["urban", "city", "architecture", "modern"],
    ["nature", "forest", "green", "peaceful"],
    ["ocean", "beach", "sunset", "relaxing"],
    ["mountain", "hiking", "adventure", "outdoor"],
  ];

  const index = parseInt(id) % tagSets.length;
  return tagSets[index] || tagSets[0];
}

function getRandomPhotographer(): string {
  const photographers = [
    "Alex Chen",
    "Sarah Kim",
    "Michael Park",
    "Jessica Lee",
    "David Wang",
    "Emily Zhang",
    "James Liu",
    "Rachel Choi",
  ];

  return photographers[Math.floor(Math.random() * photographers.length)];
}

function getRandomDate(): string {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 365);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().split("T")[0];
}

function getDimensionsForImage(id: string): string {
  const dimensions = [
    "1920x1080",
    "2560x1440",
    "3840x2160",
    "1200x800",
    "1600x900",
  ];

  const index = parseInt(id) % dimensions.length;
  return dimensions[index] || dimensions[0];
}
