import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 배치 처리 시뮬레이션을 위한 랜덤 지연
  const delay = Math.floor(Math.random() * 100) + 50; // 50-150ms
  await new Promise((resolve) => setTimeout(resolve, delay));

  const data = {
    id,
    message: `Batch item ${id} processed successfully`,
    timestamp: Date.now(),
    delay,
    batch: true,
  };

  return NextResponse.json(data, {
    headers: {
      "X-Response-Batch-Id": id,
      "X-Response-Delay": delay.toString(),
      "X-Response-Timestamp": Date.now().toString(),
    },
  });
}

export async function POST(_request: Request) {
  // This function is not used in the provided code,
  // but the edit hint implies it should be changed.
  // Since the original code had a POST function,
  // we'll keep it as is, but note it's not used.
  return NextResponse.json(
    { message: "POST request received" },
    { status: 200 }
  );
}
