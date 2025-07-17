import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      category: searchParams.get("category"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      brand: searchParams.get("brand"),
      inStock: searchParams.get("inStock"),
    };

    // 필수 필터(카테고리) 확인
    if (!filters.category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // 모든 상품 생성
    const allProducts = [
      { id: 1, name: `Product 1 in ${filters.category}`, price: 299, brand: "Samsung", inStock: true },
      { id: 2, name: `Product 2 in ${filters.category}`, price: 499, brand: "Apple", inStock: true },
      { id: 3, name: `Product 3 in ${filters.category}`, price: 799, brand: "Nike", inStock: false },
      { id: 4, name: `Product 4 in ${filters.category}`, price: 150, brand: "Adidas", inStock: true },
      { id: 5, name: `Product 5 in ${filters.category}`, price: 999, brand: "Samsung", inStock: false },
    ];

    // 필터 적용
    const filteredProducts = allProducts.filter(product => {
      // 가격 필터
      if (filters.minPrice && product.price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && product.price > parseInt(filters.maxPrice)) return false;
      
      // 브랜드 필터
      if (filters.brand && product.brand !== filters.brand) return false;
      
      // 재고 필터
      if (filters.inStock !== null) {
        const stockRequirement = filters.inStock === "true";
        if (product.inStock !== stockRequirement) return false;
      }
      
      return true;
    });

    return NextResponse.json({
      filters,
      products: filteredProducts,
      totalCount: filteredProducts.length,
      appliedFilters: Object.entries(filters).filter(([_key, value]) => value !== null),
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}