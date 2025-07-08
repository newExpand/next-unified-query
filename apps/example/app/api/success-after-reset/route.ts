import { NextRequest } from "next/server";

export async function POST(_request: NextRequest) {
  // 간단한 성공 응답
  return Response.json({
    message: "Success after reset",
    timestamp: Date.now(),
  });
}