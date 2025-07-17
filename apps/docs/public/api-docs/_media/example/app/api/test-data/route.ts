import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const size = searchParams.get("size");

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 50));

  return Response.json({
    id: parseInt(id || "0"),
    size: size || "small",
    data: `Test data for ID ${id}`,
    timestamp: Date.now(),
    content: size === "large" ? 
      Array.from({ length: 100 }, (_, i) => `Item ${i}`).join(", ") :
      `Small test data ${id}`,
  });
}