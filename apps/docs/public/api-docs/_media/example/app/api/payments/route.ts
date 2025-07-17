import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // 결제 처리 시뮬레이션 지연
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 5% 확률로 결제 실패 시뮬레이션
  const shouldFail = Math.random() < 0.05;

  if (shouldFail) {
    return NextResponse.json(
      { error: "Payment failed", code: "PAYMENT_DECLINED" },
      { status: 400 }
    );
  }

  const paymentResult = {
    paymentId: `pay_${Date.now()}`,
    status: "success",
    amount: body.amount || 99.99,
    currency: "USD",
    processedAt: new Date().toISOString(),
    transactionId: `txn_${Math.random().toString(36).substring(7)}`,
    method: body.method || "credit_card",
  };

  return NextResponse.json(paymentResult);
}
