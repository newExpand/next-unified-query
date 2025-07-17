"use client";

import { useState } from "react";
import {
  z,
  useMutation,
  isValidationError,
  getValidationErrors,
} from "../../lib/query-client";

// 제품 생성 요청 스키마
const createProductRequestSchema = z.object({
  name: z.string().min(1, "제품명은 필수입니다"),
  price: z.number().positive("가격은 양수여야 합니다"),
  category: z.enum(["electronics", "clothing", "books", "home"]),
  description: z.string().optional(),
});

// 제품 생성 응답 스키마
const createProductResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  inStock: z.boolean(),
  createdAt: z.string(),
});

type CreateProductRequest = z.infer<typeof createProductRequestSchema>;

export default function CreateProductPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const createProductMutation = useMutation({
    url: "/api/products",
    method: "POST",
    requestSchema: createProductRequestSchema,
    responseSchema: createProductResponseSchema,
    onMutate: (variables) => {
      console.log("Creating product:", variables);
      setValidationErrors([]);
      return { startTime: Date.now() };
    },
    onSuccess: (data) => {
      console.log("Product created successfully:", data);
      // 폼 초기화
      setName("");
      setPrice("");
      setCategory("");
      setDescription("");
    },
    onError: (error) => {
      console.error("Product creation failed:", error);
      if (isValidationError(error)) {
        const errors = getValidationErrors(error);
        const errorMessages = errors.map(
          (err) => `${err.path}: ${err.message}`
        );
        setValidationErrors(errorMessages);
      }
    },
  });

  const handleSubmit = () => {
    const productData: CreateProductRequest = {
      name,
      price: parseFloat(price),
      category: category as any,
      description: description || undefined,
    };

    createProductMutation.mutate(productData);
  };

  const handleSubmitInvalid = () => {
    // 의도적으로 잘못된 데이터로 스키마 검증 실패 테스트
    const invalidData = {
      name: "", // 빈 문자열
      price: -10, // 음수
      category: "invalid-category", // 잘못된 카테고리
    };

    createProductMutation.mutate(invalidData as any);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Create Product - Schema Validation
      </h1>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">스키마 검증 설정</h3>
          <ul className="text-sm space-y-1">
            <li>
              • 요청 스키마: name(필수), price(양수), category(enum),
              description(선택)
            </li>
            <li>
              • 응답 스키마: id, name, price, category, inStock, createdAt
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold">제품 정보 입력</h3>

            <div>
              <label className="block text-sm font-medium mb-1">제품명</label>
              <input
                data-testid="product-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="제품명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">가격</label>
              <input
                data-testid="product-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="가격을 입력하세요"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">카테고리</label>
              <select
                data-testid="product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">카테고리 선택</option>
                <option value="electronics">전자제품</option>
                <option value="clothing">의류</option>
                <option value="books">도서</option>
                <option value="home">생활용품</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                설명 (선택)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="제품 설명을 입력하세요"
                rows={3}
              />
            </div>

            <div className="space-x-2">
              <button
                data-testid="create-product-btn"
                onClick={handleSubmit}
                disabled={createProductMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {createProductMutation.isPending ? "생성 중..." : "제품 생성"}
              </button>

              <button
                data-testid="create-another-btn"
                onClick={handleSubmitInvalid}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                잘못된 데이터로 테스트
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* 검증 오류 표시 */}
            {validationErrors.length > 0 && (
              <div
                data-testid="validation-errors"
                className="bg-red-50 p-4 rounded-lg"
              >
                <h4 className="font-semibold text-red-800 mb-2">검증 오류</h4>
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    data-testid="validation-error"
                    className="text-red-700 text-sm"
                  >
                    • {error}
                  </div>
                ))}
              </div>
            )}

            {/* 생성된 제품 정보 */}
            {createProductMutation.isSuccess && createProductMutation.data && (
              <div
                data-testid="product-created"
                className="bg-green-50 p-4 rounded-lg"
              >
                <h4 className="font-semibold text-green-800 mb-2">
                  제품 생성 완료
                </h4>
                <div className="space-y-1 text-sm">
                  <div data-testid="product-id">
                    ID: {createProductMutation.data.id}
                  </div>
                  <div>이름: {createProductMutation.data.name}</div>
                  <div data-testid="product-price-display">
                    가격: ${createProductMutation.data.price}
                  </div>
                  <div>카테고리: {createProductMutation.data.category}</div>
                  <div data-testid="product-stock-status">
                    재고:{" "}
                    {createProductMutation.data.inStock
                      ? "In Stock"
                      : "Out of Stock"}
                  </div>
                  <div>생성일: {createProductMutation.data.createdAt}</div>
                </div>
              </div>
            )}

            {/* 응답 스키마 오류 */}
            {createProductMutation.isError &&
              !isValidationError(createProductMutation.error) && (
                <div
                  data-testid="response-schema-error"
                  className="bg-red-50 p-4 rounded-lg"
                >
                  <h4 className="font-semibold text-red-800 mb-2">
                    응답 스키마 오류
                  </h4>
                  <div
                    data-testid="schema-error-message"
                    className="text-red-700 text-sm"
                  >
                    Invalid response format:{" "}
                    {createProductMutation.error?.message}
                  </div>
                </div>
              )}

            {/* 상태 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Mutation 상태</h4>
              <div>isPending: {createProductMutation.isPending.toString()}</div>
              <div>isSuccess: {createProductMutation.isSuccess.toString()}</div>
              <div>isError: {createProductMutation.isError.toString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
