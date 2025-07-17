"use client";

import { useQuery } from "../../lib/query-client";
import { z } from "next-unified-query";

const OrderSchema = z.object({
  id: z.number(),
  customerId: z.number(),
  items: z.array(
    z.object({
      id: z.number(),
      productId: z.number(),
      quantity: z.number(),
      price: z.number(),
      name: z.string(),
    })
  ),
  total: z.number(),
  status: z.enum(["pending", "confirmed", "shipped", "delivered"]),
  createdAt: z.string().datetime(),
});

type Order = z.infer<typeof OrderSchema>;

export default function TypeSafetyValidation() {
  const { data, error, isLoading } = useQuery<Order>({
    cacheKey: ["orders", 1],
    queryFn: async () => {
      const response = await fetch("/api/orders/1");
      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }

      const rawData = await response.json();
      const validatedData = OrderSchema.parse(rawData);

      // 타입 안전성 확인을 위해 글로벌에 저장
      (window as any).__LAST_ORDER_DATA__ = validatedData;

      return validatedData;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        오류 발생
      </div>
    );
  }

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="order-details"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              주문 상세 정보
            </h1>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  주문 ID
                </label>
                <p className="text-lg text-gray-900" data-testid="order-id">
                  {data.id}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  고객 ID
                </label>
                <p className="text-lg text-gray-900" data-testid="customer-id">
                  {data.customerId}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  상품 수량
                </label>
                <p className="text-lg text-gray-900" data-testid="items-count">
                  {data.items.length}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  총 금액
                </label>
                <p
                  className="text-lg text-gray-900"
                  data-testid="total-formatted"
                >
                  ${data.total.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  상태
                </label>
                <p className="text-lg text-gray-900">{data.status}</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded">
              <h3 className="font-medium text-green-900 mb-2">
                타입 안전성 보장
              </h3>
              <p className="text-sm text-green-700">
                모든 필드가 TypeScript 타입과 일치하며 런타임에서
                검증되었습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
