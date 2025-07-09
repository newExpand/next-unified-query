import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const model = searchParams.get("model");

  if (!model) {
    return NextResponse.json(
      { error: "Model parameter is required" },
      { status: 400 }
    );
  }

  // Mock 제품 스펙 데이터
  const specsData = {
    model,
    price: model.includes("Pro") ? 1999 : 1299,
    specs: {
      ram: "16GB",
      storage: "512GB",
      display: "13.3 inch"
    },
    availability: "In Stock"
  };

  return NextResponse.json(specsData);
}