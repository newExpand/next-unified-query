"use client";

import { useMutation } from "../../lib/query-client";
import { useState } from "react";

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

interface OrderResponse {
  orderId: number;
  totalAmount: number;
  status: string;
  estimatedDelivery: string;
  trackingNumber: string;
  appliedDiscount?: number;
}

export default function OrderCreationPage() {
  const [customerId, setCustomerId] = useState(1);
  const [items, setItems] = useState<OrderItem[]>([
    { productId: 1, quantity: 1, price: 29.99 },
  ]);
  const [shippingAddress, setShippingAddress] = useState({
    street: "123 Main St",
    city: "Seoul",
    country: "South Korea",
    zipCode: "12345",
  });
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [couponCode, setCouponCode] = useState("");

  const mutation = useMutation<OrderResponse, any, OrderRequest>({
    mutationFn: async (orderData: OrderRequest) => {
      // 복잡한 비즈니스 로직 시뮬레이션
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Order creation failed");
      }

      return response.json();
    },
    onMutate: (variables) => {
      console.log("Starting order creation with:", variables);
      // 낙관적 업데이트 - 주문 진행 상태 표시
      return {
        startTime: Date.now(),
        totalAmount: variables.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
      };
    },
    onSuccess: (data, variables, context) => {
      console.log("Order created successfully:", data);
      // 성공 시 처리 로직
      // - 장바구니 비우기
      // - 주문 내역 캐시 갱신
      // - 이메일 확인 발송
      // - 분석 이벤트 전송
    },
    onError: (error, variables, context) => {
      console.error("Order creation failed:", error);
      // 실패 시 처리 로직
      // - 재고 복구
      // - 결제 취소
      // - 에러 로깅
    },
  });

  const addItem = () => {
    setItems([...items, { productId: Date.now(), quantity: 1, price: 19.99 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orderData: OrderRequest = {
      customerId,
      items,
      shippingAddress,
      paymentMethod,
      ...(couponCode && { couponCode }),
    };

    mutation.mutate(orderData);
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            복잡한 주문 생성 Mutation
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 주문 상품 */}
              <div>
                <h2 className="text-xl font-semibold mb-4">🛍️ 주문 상품</h2>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            상품 ID
                          </label>
                          <input
                            type="number"
                            value={item.productId}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "productId",
                                Number(e.target.value)
                              )
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            수량
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            가격
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(index, "price", Number(e.target.value))
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                            disabled={items.length === 1}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        소계: ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 border-2 border-dashed border-gray-300"
                  >
                    + 상품 추가
                  </button>
                </div>
              </div>

              {/* 배송 정보 */}
              <div>
                <h2 className="text-xl font-semibold mb-4">🚚 배송 정보</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      고객 ID
                    </label>
                    <input
                      type="number"
                      value={customerId}
                      onChange={(e) => setCustomerId(Number(e.target.value))}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      주소
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          street: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="거리명"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        도시
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            city: e.target.value,
                          })
                        }
                        className="block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        우편번호
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.zipCode}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            zipCode: e.target.value,
                          })
                        }
                        className="block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      국가
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          country: e.target.value,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      결제 방법
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="credit_card">신용카드</option>
                      <option value="paypal">PayPal</option>
                      <option value="bank_transfer">계좌이체</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      쿠폰 코드 (선택)
                    </label>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="SAVE10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 주문 요약 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">📋 주문 요약</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>상품 총액:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>배송비:</span>
                  <span>$5.00</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>세금:</span>
                  <span>${(totalAmount * 0.1).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>총 결제액:</span>
                    <span>
                      ${(totalAmount + 5 + totalAmount * 0.1).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 주문 버튼 */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                data-testid="create-order-btn"
              >
                {mutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    주문 처리 중...
                  </>
                ) : (
                  "🛒 주문하기"
                )}
              </button>
            </div>
          </form>

          {/* 결과 표시 */}
          {mutation.isSuccess && mutation.data && (
            <div
              className="mt-8 bg-green-50 border border-green-200 p-6 rounded-lg"
              data-testid="order-success"
            >
              <h3 className="font-semibold text-green-800 mb-4">
                ✅ 주문이 성공적으로 생성되었습니다!
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-4 rounded">
                  <h4 className="font-medium text-green-800 mb-2">주문 정보</h4>
                  <p>
                    <strong>주문 번호:</strong> {mutation.data.orderId}
                  </p>
                  <p>
                    <strong>상태:</strong> {mutation.data.status}
                  </p>
                  <p>
                    <strong>총 금액:</strong> ${mutation.data.totalAmount}
                  </p>
                  {mutation.data.appliedDiscount && (
                    <p>
                      <strong>할인 금액:</strong> $
                      {mutation.data.appliedDiscount}
                    </p>
                  )}
                </div>
                <div className="bg-white p-4 rounded">
                  <h4 className="font-medium text-green-800 mb-2">배송 정보</h4>
                  <p>
                    <strong>예상 배송일:</strong>{" "}
                    {mutation.data.estimatedDelivery}
                  </p>
                  <p>
                    <strong>운송장 번호:</strong> {mutation.data.trackingNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {mutation.isError && (
            <div className="mt-8 bg-red-50 border border-red-200 p-6 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">
                ❌ 주문 생성 실패
              </h3>
              <p className="text-sm text-red-700">{mutation.error?.message}</p>
            </div>
          )}

          {/* 비즈니스 로직 설명 */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              🔧 복잡한 비즈니스 로직
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <h4 className="font-medium text-blue-800 mb-2">재고 검증</h4>
                <p className="text-sm text-blue-700">
                  주문 전 각 상품의 재고 확인 및 예약
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded">
                <h4 className="font-medium text-green-800 mb-2">가격 계산</h4>
                <p className="text-sm text-green-700">
                  할인, 쿠폰, 세금, 배송비 등 복합 계산
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded">
                <h4 className="font-medium text-purple-800 mb-2">결제 처리</h4>
                <p className="text-sm text-purple-700">
                  외부 결제 시스템 연동 및 검증
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-4 rounded">
                <h4 className="font-medium text-orange-800 mb-2">주문 추적</h4>
                <p className="text-sm text-orange-700">
                  배송 업체 연동 및 추적 번호 생성
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
