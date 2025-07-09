import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get("brand");
  const category = searchParams.get("category");

  if (!brand || !category) {
    return NextResponse.json(
      { error: "Brand and category parameters are required" },
      { status: 400 }
    );
  }

  // Mock 모델 데이터
  const modelsByBrand: Record<string, string[]> = {
    "Apple": category === "laptop" ? ["MacBook Air", "MacBook Pro"] : ["iPhone 15", "iPhone 15 Pro"],
    "Dell": ["XPS 13", "Inspiron 15", "Alienware"],
    "Samsung": category === "smartphone" ? ["Galaxy S24", "Galaxy Note"] : ["Galaxy Tab S9"]
  };

  const modelsData = {
    brand,
    category,
    models: modelsByBrand[brand] || []
  };

  return NextResponse.json(modelsData);
}