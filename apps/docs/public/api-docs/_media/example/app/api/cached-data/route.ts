import { NextRequest, NextResponse } from "next/server";

let callCount = 0;

export async function GET(request: NextRequest) {
  callCount++;

  const cacheControl = request.headers.get("cache-control");

  const response = {
    data: `Cached data ${callCount}`,
    timestamp: Date.now(),
    callCount,
    cacheControl,
    headers: {
      "cache-control": request.headers.get("cache-control"),
      "if-none-match": request.headers.get("if-none-match"),
      "if-modified-since": request.headers.get("if-modified-since"),
    },
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "max-age=60, public",
      ETag: `"etag-${callCount}"`,
      "Last-Modified": new Date().toUTCString(),
    },
  });
}
