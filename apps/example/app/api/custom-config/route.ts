import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const headers = request.headers;

  const receivedHeaders = {
    authorization: headers.get("authorization"),
    "x-custom-header": headers.get("x-custom-header"),
    "x-api-version": headers.get("x-api-version"),
    "user-agent": headers.get("user-agent"),
    "content-type": headers.get("content-type"),
  };

  const response = {
    message: "Custom config test successful",
    receivedHeaders,
    timestamp: new Date().toISOString(),
    requestMethod: request.method,
    requestUrl: request.url,
  };

  return NextResponse.json(response);
}
