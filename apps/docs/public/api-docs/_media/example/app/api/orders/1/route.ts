import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json({
      id: 1,
      customerId: 123,
      items: [
        {
          id: 1,
          productId: 456,
          quantity: 2,
          price: 29.99,
          name: "Product Name"
        }
      ],
      total: 59.98,
      status: "confirmed",
      createdAt: "2023-01-01T00:00:00.000Z"
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}