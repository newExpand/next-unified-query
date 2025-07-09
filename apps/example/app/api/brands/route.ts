import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json(
      { error: "Category parameter is required" },
      { status: 400 }
    );
  }

  // Mock 브랜드 데이터
  const brandsByCategory: Record<string, string[]> = {
    "laptop": ["Apple", "Dell", "HP", "Lenovo"],
    "smartphone": ["Apple", "Samsung", "Google", "OnePlus"],
    "tablet": ["Apple", "Samsung", "Microsoft"]
  };

  const brandsData = {
    category,
    brands: brandsByCategory[category] || []
  };

  return NextResponse.json(brandsData);
}