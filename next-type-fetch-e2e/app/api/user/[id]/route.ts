import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  return NextResponse.json({
    id,
    name: `User ${id}`,
    timestamp: Date.now(),
  });
}
