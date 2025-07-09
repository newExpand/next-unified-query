import { NextResponse } from "next/server";

export async function GET() {
  // Mock overview 데이터
  const overviewData = {
    summary: "Dashboard overview data",
    stats: { 
      users: 150, 
      sales: 25000 
    }
  };

  return NextResponse.json(overviewData);
}