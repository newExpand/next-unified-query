import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const testHeader = req.headers.get("x-test-header") || null;
  const customHeader = req.headers.get("x-custom-header") || null;
  return NextResponse.json({
    id,
    name: `User ${id}`,
    timestamp: Date.now(),
    testHeader,
    customHeader,
  });
}
