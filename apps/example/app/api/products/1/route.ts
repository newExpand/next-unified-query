import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // URL에서 검증 모드 확인
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "invalid") {
      // 스키마 검증 실패 시나리오
      return NextResponse.json({
        id: "not-a-number",
        name: "",
        price: "invalid-price",
        categories: "should-be-array",
        metadata: {
          weight: "not-a-number",
          dimensions: {
            width: null,
            height: "invalid"
          }
        }
      });
    }

    // 정상적인 제품 데이터 반환
    return NextResponse.json({
      id: 1,
      name: "Awesome Product",
      price: 299.99,
      categories: ["electronics", "gadgets", "bestseller"],
      metadata: {
        weight: 1.5,
        dimensions: {
          width: 20.5,
          height: 15.2,
          depth: 5.8
        }
      },
      description: "A fantastic product with amazing features",
      inStock: true,
      rating: 4.8,
      reviews: 156
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}