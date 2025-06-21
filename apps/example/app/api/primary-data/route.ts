import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const primaryData = {
    data: "Primary Data",
    source: "primary",
    timestamp: new Date().toISOString(),
    reliability: "high",
    version: "1.0.0",
    metadata: {
      server: "primary-server",
      region: "us-east-1",
      cached: false,
    },
  };

  return NextResponse.json(primaryData);
}
