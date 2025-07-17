import { NextRequest, NextResponse } from "next/server";

const USERS_DATA = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com" },
  { id: "2", name: "Bob Smith", email: "bob@example.com" },
  { id: "3", name: "Charlie Brown", email: "charlie@example.com" },
  { id: "4", name: "Diana Prince", email: "diana@example.com" },
  { id: "5", name: "Edward Norton", email: "edward@example.com" },
];

export async function GET(request: NextRequest) {
  // 헤더 검증 (테스트용)
  const ssrTest = request.headers.get("X-SSR-Test");
  const ssrGlobal = request.headers.get("X-SSR-Global");
  
  return NextResponse.json(USERS_DATA, {
    headers: {
      "X-Response-SSR-Test": ssrTest || "false",
      "X-Response-SSR-Global": ssrGlobal || "false",
      "X-Response-Timestamp": Date.now().toString(),
    },
  });
}