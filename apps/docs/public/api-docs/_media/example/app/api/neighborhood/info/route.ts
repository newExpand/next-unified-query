import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  if (!city) {
    return NextResponse.json(
      { error: "City parameter is required" },
      { status: 400 }
    );
  }

  // Mock 동네 정보 데이터
  const neighborhoodData = {
    city,
    neighborhoods: city === "New York" ? 
      ["Manhattan", "Brooklyn", "Queens"] : 
      ["Hollywood", "Venice", "Santa Monica"],
    averageRent: city === "New York" ? 3500 : 2800
  };

  return NextResponse.json(neighborhoodData);
}