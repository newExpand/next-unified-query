"use client";

import { useQuery, useMutation, useQueryClient } from "../../lib/query-client";
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

interface StockData {
  available: number;
  reserved: number;
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

  // 단계별 진행 상태 관리
  const [progressStep, setProgressStep] = useState<string>("");
  const [isOrderProcessing, setIsOrderProcessing] = useState(false);

  const queryClient = useQueryClient();

  // 1. 재고 확인 useQuery
  const stockQuery = useQuery<StockData>({
    cacheKey: ["stock", items[0]?.productId],
    url: `/api/products/${items[0]?.productId}/stock`,
    enabled: !!items[0]?.productId && !isOrderProcessing,
  });

  // 2. 결제 처리 useMutation
  const paymentMutation = useMutation({
    url: "/api/payments",
    method: "POST",
    onMutate: async (paymentData) => {
      setProgressStep("processing-payment");
      return { startTime: Date.now() };
    },
    onSuccess: (data) => {
      // 자동으로 주문 생성 단계로 진행
      setTimeout(() => {
        createOrder();
      }, 100);
    },
    onError: (error) => {
      setProgressStep("");
      setIsOrderProcessing(false);
    },
  });

  // 3. 주문 생성 useMutation
  const orderMutation = useMutation<OrderResponse, any, OrderRequest>({
    url: "/api/orders",
    method: "POST",
    onMutate: async (orderData) => {
      setProgressStep("creating-order");

      // Optimistic update: 주문 목록에 임시 주문 추가
      const optimisticOrder = {
        id: `temp-${Date.now()}`,
        ...orderData,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const previousOrders = queryClient.get(["orders"]);
      queryClient.setQueryData(["orders"], (old: any[]) =>
        old ? [optimisticOrder, ...old] : [optimisticOrder]
      );

      return { previousOrders, optimisticOrder };
    },
    onSuccess: (data, variables, context) => {
      // 자동으로 재고 업데이트 단계로 진행
      setTimeout(() => {
        updateStock();
      }, 100);

      // 실제 데이터로 캐시 업데이트
      queryClient.invalidateQueries(["orders"]);
    },
    onError: (error, variables, context: any) => {

      // Rollback optimistic update
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }

      setProgressStep("");
      setIsOrderProcessing(false);
    },
  });

  // 4. 재고 업데이트 useMutation
  const stockUpdateMutation = useMutation({
    url: `/api/products/${items[0]?.productId}/stock`,
    method: "PUT",
    onMutate: async (stockData) => {
      setProgressStep("updating-stock");

      // Optimistic update: 재고 즉시 감소
      const previousStock = queryClient.get(["stock", items[0]?.productId]);
      queryClient.setQueryData(["stock", items[0]?.productId], (old: any) =>
        old
          ? {
              ...old,
              available: old.available - stockData.reserved,
              reserved: old.reserved + stockData.reserved,
            }
          : null
      );

      return { previousStock };
    },
    onSuccess: (data) => {
      // updating-stock 단계를 잠시 표시한 후 완료 상태로 전환
      setTimeout(() => {
        setProgressStep("order-complete");
        setIsOrderProcessing(false);
      }, 300);

      // 재고 쿼리 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries(["stock", items[0]?.productId]);
    },
    onError: (error, variables, context) => {

      // Rollback optimistic update
      if (context?.previousStock) {
        queryClient.setQueryData(
          ["stock", items[0]?.productId],
          context.previousStock
        );
      }

      setProgressStep("");
      setIsOrderProcessing(false);
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

  // 단계별 실행 함수들
  const processPayment = () => {
    const paymentData = {
      amount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      method: paymentMethod,
    };
    paymentMutation.mutate(paymentData);
  };

  const createOrder = () => {
    const orderData: OrderRequest = {
      customerId,
      items,
      shippingAddress,
      paymentMethod,
      ...(couponCode && { couponCode }),
    };
    orderMutation.mutate(orderData);
  };

  const updateStock = () => {
    const stockData = {
      reserved: items[0]?.quantity || 0,
    };
    stockUpdateMutation.mutate(stockData);
  };

  // 메인 주문 처리 함수
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 재고 확인
    if (
      !stockQuery.data?.available ||
      stockQuery.data.available < (items[0]?.quantity || 0)
    ) {
      alert("재고가 부족합니다!");
      return;
    }

    setIsOrderProcessing(true);
    setProgressStep("checking-stock");

    // 재고 확인 완료 후 결제 처리 시작
    setTimeout(() => {
      processPayment();
    }, 500);
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

                {/* 재고 정보 표시 */}
                {stockQuery.data && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">재고 현황:</span>
                      <span className="ml-2" data-testid="stock-available">
                        사용 가능: {stockQuery.data.available}개
                      </span>
                      <span className="ml-4" data-testid="stock-reserved">
                        예약됨: {stockQuery.data.reserved}개
                      </span>
                    </div>
                  </div>
                )}

                {stockQuery.isLoading && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-600">
                      재고 정보 로딩 중...
                    </div>
                  </div>
                )}

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
                            data-testid="product-quantity"
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
                disabled={isOrderProcessing}
                className="bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                data-testid="create-order-btn"
              >
                {isOrderProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    주문 처리 중...
                  </>
                ) : (
                  "🛒 주문하기"
                )}
              </button>
            </div>

            {/* 단계별 진행 상태 */}
            {isOrderProcessing && progressStep && (
              <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3">
                  주문 처리 진행 상황
                </h3>
                <div className="space-y-2">
                  {progressStep === "checking-stock" && (
                    <div
                      className="flex items-center text-sm text-blue-600 font-medium"
                      data-testid="checking-stock"
                    >
                      <div className="w-4 h-4 rounded-full mr-3 bg-blue-500"></div>
                      1. 재고 확인 중...
                    </div>
                  )}
                  {progressStep === "processing-payment" && (
                    <div
                      className="flex items-center text-sm text-blue-600 font-medium"
                      data-testid="processing-payment"
                    >
                      <div className="w-4 h-4 rounded-full mr-3 bg-blue-500"></div>
                      2. 결제 처리 중...
                    </div>
                  )}
                  {progressStep === "creating-order" && (
                    <div
                      className="flex items-center text-sm text-blue-600 font-medium"
                      data-testid="creating-order"
                    >
                      <div className="w-4 h-4 rounded-full mr-3 bg-blue-500"></div>
                      3. 주문 생성 중...
                    </div>
                  )}
                  {progressStep === "updating-stock" && (
                    <div
                      className="flex items-center text-sm text-blue-600 font-medium"
                      data-testid="updating-stock"
                    >
                      <div className="w-4 h-4 rounded-full mr-3 bg-blue-500"></div>
                      4. 재고 업데이트 중...
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>

          {/* 결과 표시 */}
          {orderMutation.isSuccess &&
            orderMutation.data &&
            progressStep === "order-complete" && (
              <div
                className="mt-8 bg-green-50 border border-green-200 p-6 rounded-lg"
                data-testid="order-complete"
              >
                <h3 className="font-semibold text-green-800 mb-4">
                  ✅ 주문이 성공적으로 생성되었습니다!
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-4 rounded">
                    <h4 className="font-medium text-green-800 mb-2">
                      주문 정보
                    </h4>
                    <p>
                      <strong>주문 번호:</strong>{" "}
                      <span data-testid="order-id">
                        {orderMutation.data.orderId}
                      </span>
                    </p>
                    <p>
                      <strong>상태:</strong> {orderMutation.data.status}
                    </p>
                    <p>
                      <strong>총 금액:</strong> $
                      {orderMutation.data.totalAmount}
                    </p>
                    {orderMutation.data.appliedDiscount && (
                      <p>
                        <strong>할인 금액:</strong> $
                        {orderMutation.data.appliedDiscount}
                      </p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded">
                    <h4 className="font-medium text-green-800 mb-2">
                      배송 정보
                    </h4>
                    <p>
                      <strong>예상 배송일:</strong>{" "}
                      {orderMutation.data.estimatedDelivery}
                    </p>
                    <p>
                      <strong>운송장 번호:</strong>{" "}
                      {orderMutation.data.trackingNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {(paymentMutation.isError ||
            orderMutation.isError ||
            stockUpdateMutation.isError) && (
            <div className="mt-8 bg-red-50 border border-red-200 p-6 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">
                ❌ 주문 처리 실패
              </h3>
              <div className="text-sm text-red-700">
                {paymentMutation.error && (
                  <p>결제 오류: {paymentMutation.error?.message}</p>
                )}
                {orderMutation.error && (
                  <p>주문 생성 오류: {orderMutation.error?.message}</p>
                )}
                {stockUpdateMutation.error && (
                  <p>
                    재고 업데이트 오류: {stockUpdateMutation.error?.message}
                  </p>
                )}
              </div>
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
