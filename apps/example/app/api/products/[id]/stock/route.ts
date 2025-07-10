import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    // 시뮬레이션: 90% 확률로 재고 있음
    const hasStock = Math.random() > 0.1;

    const stockData = {
      available: hasStock ? Math.floor(Math.random() * 50) + 5 : 0,
      reserved: Math.floor(Math.random() * 10),
      productId: Number(productId),
      lastUpdated: new Date().toISOString(),
    };

    // 테스트 가시성을 위한 약간의 지연
    await new Promise((resolve) => setTimeout(resolve, 300));

    return NextResponse.json(stockData);
  } catch (error) {
    console.error("Stock check error:", error);
    return NextResponse.json(
      { error: "Failed to check stock" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const body = await request.json();
    const { reserved } = body;

    console.log(
      `Updating stock for product ${productId}, reserved: ${reserved}`
    );

    // 시뮬레이션: 재고 업데이트 성공
    const updateResult = {
      updated: true,
      productId: Number(productId),
      reserved,
      timestamp: new Date().toISOString(),
    };

    // 테스트 가시성을 위한 약간의 지연
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(updateResult);
  } catch (error) {
    console.error("Stock update error:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}
