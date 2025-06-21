import { NextRequest, NextResponse } from "next/server";

interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

interface OrderRequest {
  customerId: number;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    country: string;
    zipCode: string;
  };
  paymentMethod: string;
  couponCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderRequest = await request.json();

    // 복잡한 비즈니스 로직 시뮬레이션

    // 1. 재고 검증
    const stockValidation = orderData.items.every((item) => {
      // 모의 재고 체크 (90% 확률로 재고 있음)
      return Math.random() > 0.1;
    });

    if (!stockValidation) {
      return NextResponse.json(
        {
          success: false,
          message: "일부 상품의 재고가 부족합니다.",
        },
        { status: 400 }
      );
    }

    // 2. 가격 계산
    const subtotal = orderData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shipping = 5.0;
    const tax = subtotal * 0.1;

    // 쿠폰 할인 적용
    let discount = 0;
    if (orderData.couponCode) {
      const validCoupons: Record<string, number> = {
        SAVE10: 0.1,
        SAVE20: 0.2,
        WELCOME: 0.15,
      };

      discount = validCoupons[orderData.couponCode.toUpperCase()] || 0;
    }

    const discountAmount = subtotal * discount;
    const totalAmount = subtotal + shipping + tax - discountAmount;

    // 3. 결제 처리 시뮬레이션
    const paymentSuccess = Math.random() > 0.05; // 95% 성공률

    if (!paymentSuccess) {
      return NextResponse.json(
        {
          success: false,
          message: "결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
        },
        { status: 400 }
      );
    }

    // 4. 주문 생성
    const orderId = Math.floor(Math.random() * 1000000) + 100000;
    const trackingNumber = `TRK${orderId}${Date.now().toString().slice(-4)}`;

    // 5. 배송 예상일 계산
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + Math.floor(Math.random() * 7) + 3
    );

    // 응답 데이터
    const response = {
      orderId,
      totalAmount: Number(totalAmount.toFixed(2)),
      status: "confirmed",
      estimatedDelivery: estimatedDelivery.toISOString().split("T")[0],
      trackingNumber,
      ...(discountAmount > 0 && {
        appliedDiscount: Number(discountAmount.toFixed(2)),
      }),
    };

    // 글로벌 상태에 주문 정보 저장 (테스트용)
    (global as any).__ORDER_CREATED__ = {
      ...response,
      createdAt: new Date().toISOString(),
      customerInfo: {
        customerId: orderData.customerId,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
      },
      items: orderData.items,
      businessLogic: {
        subtotal,
        shipping,
        tax,
        discount: discountAmount,
        stockValidated: true,
        paymentProcessed: true,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "주문 처리 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
