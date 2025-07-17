import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  const fallbackData = {
    data: "Fallback Data",
    source: "fallback",
    timestamp: new Date().toISOString(),
    reliability: "medium",
    version: "0.9.0",
    metadata: {
      server: "backup-server",
      region: "us-west-2",
      cached: true,
      note: "This is fallback data due to primary server unavailability",
    },
  };

  return NextResponse.json(fallbackData);
}
