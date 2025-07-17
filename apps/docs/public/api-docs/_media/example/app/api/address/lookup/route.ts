import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get("zipCode");

  // 짧은 우편번호 처리
  if (!zipCode || zipCode.length < 5) {
    return NextResponse.json(
      { error: "Invalid zip code" },
      { status: 400 }
    );
  }

  // Mock 주소 데이터
  const addressData = {
    zipCode,
    city: zipCode === "12345" ? "New York" : "Los Angeles",
    state: zipCode === "12345" ? "NY" : "CA",
    suggestions: [
      `123 Main St, ${zipCode === "12345" ? "New York, NY" : "Los Angeles, CA"}`,
      `456 Oak Ave, ${zipCode === "12345" ? "New York, NY" : "Los Angeles, CA"}`
    ]
  };

  return NextResponse.json(addressData);
}