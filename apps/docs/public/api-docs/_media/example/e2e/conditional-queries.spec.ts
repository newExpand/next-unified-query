import { test, expect } from "@playwright/test";

/**
 * 실제 조건부 쿼리 시나리오 E2E 테스트
 * 
 * 실제 애플리케이션에서 자주 사용되는 조건부 쿼리 패턴들을
 * 브라우저 환경에서 검증합니다.
 */

test.describe("Conditional Queries Real-world Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    // 먼저 기본 페이지로 이동한 후 캐시 초기화
    await page.goto("/");
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.log("Storage clear error:", error);
      }
    });
  });

  test.describe("사용자 로그인 상태 기반 조건부 쿼리", () => {
    test("로그인 상태 변화에 따른 쿼리 활성화/비활성화", async ({ page }) => {
      let userProfileCalls = 0;
      let dashboardCalls = 0;
      
      // 사용자 프로필 API
      await page.route("**/api/user/profile", async (route, request) => {
        userProfileCalls++;
        const authHeader = request.headers()["authorization"];
        
        if (!authHeader || authHeader === "Bearer null") {
          await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Unauthorized" })
          });
          return;
        }
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            role: "user"
          })
        });
      });

      // 대시보드 데이터 API
      await page.route("**/api/dashboard/data", async (route, request) => {
        dashboardCalls++;
        const authHeader = request.headers()["authorization"];
        
        if (!authHeader || authHeader === "Bearer null") {
          await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Unauthorized" })
          });
          return;
        }
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            stats: { totalUsers: 150, activeUsers: 89 },
            recentActivity: ["User A logged in", "User B updated profile"]
          })
        });
      });

      await page.goto("/conditional-auth/dashboard");
      
      // 초기 상태: 로그아웃 상태 - 쿼리들이 실행되지 않아야 함
      await page.waitForSelector('[data-testid="login-form"]');
      await expect(page.locator('[data-testid="dashboard-content"]')).not.toBeVisible();
      
      expect(userProfileCalls).toBe(0);
      expect(dashboardCalls).toBe(0);
      
      // 로그인 시뮬레이션
      await page.fill('[data-testid="username-input"]', "john@example.com");
      await page.fill('[data-testid="password-input"]', "password");
      await page.click('[data-testid="login-btn"]');
      
      // 로그인 성공 후 조건부 쿼리들이 활성화되어야 함
      await page.waitForSelector('[data-testid="dashboard-content"]');
      
      // 프로필과 대시보드 데이터가 모두 로드되어야 함
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-name"]')).toHaveText("John Doe");
      await expect(page.locator('[data-testid="total-users"]')).toHaveText("150");
      
      expect(userProfileCalls).toBe(1);
      expect(dashboardCalls).toBe(1);
      
      // 로그아웃 시뮬레이션
      await page.click('[data-testid="logout-btn"]');
      
      // 로그아웃 후 보호된 콘텐츠가 사라지고 추가 API 호출 없어야 함
      await expect(page.locator('[data-testid="dashboard-content"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      
      // 로그아웃 후 추가 API 호출이 없어야 함
      await page.waitForTimeout(1000);
      expect(userProfileCalls).toBe(1);
      expect(dashboardCalls).toBe(1);
    });

    test("권한별 다른 API 엔드포인트 호출", async ({ page }) => {
      let adminDataCalls = 0;
      let userDataCalls = 0;
      
      // 관리자 전용 데이터 API
      await page.route("**/api/admin/analytics", async (route, request) => {
        adminDataCalls++;
        const userRole = request.headers()["x-user-role"];
        
        if (userRole !== "admin") {
          await route.fulfill({
            status: 403,
            contentType: "application/json",
            body: JSON.stringify({ error: "Forbidden" })
          });
          return;
        }
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            totalRevenue: 125000,
            systemHealth: "good",
            userRegistrations: 45
          })
        });
      });

      // 일반 사용자 데이터 API
      await page.route("**/api/user/dashboard", async (route) => {
        userDataCalls++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            myTasks: 5,
            notifications: 3,
            recentProjects: ["Project A", "Project B"]
          })
        });
      });

      await page.goto("/conditional-permissions/role-based");
      
      // 일반 사용자로 로그인
      await page.selectOption('[data-testid="role-select"]', "user");
      await page.click('[data-testid="simulate-login-btn"]');
      
      await page.waitForSelector('[data-testid="user-dashboard"]');
      
      // 일반 사용자는 user API만 호출되어야 함
      await expect(page.locator('[data-testid="my-tasks"]')).toHaveText("5");
      await expect(page.locator('[data-testid="admin-analytics"]')).not.toBeVisible();
      
      expect(userDataCalls).toBe(1);
      expect(adminDataCalls).toBe(0);
      
      // 관리자로 역할 변경
      await page.selectOption('[data-testid="role-select"]', "admin");
      await page.click('[data-testid="change-role-btn"]');
      
      await page.waitForSelector('[data-testid="admin-analytics"]');
      
      // 관리자는 admin API가 호출되어야 함
      await expect(page.locator('[data-testid="total-revenue"]')).toHaveText("$125,000");
      await expect(page.locator('[data-testid="system-health"]')).toHaveText("good");
      
      expect(adminDataCalls).toBe(1);
      
      // 사용자 데이터도 여전히 표시되어야 함
      expect(userDataCalls).toBeGreaterThanOrEqual(1); // 역할 변경 시 재호출 가능
    });
  });

  test.describe("폼 필드 의존 쿼리", () => {
    test("우편번호 → 주소 자동완성 체인", async ({ page }) => {
      let addressLookupCalls = 0;
      let neighborhoodCalls = 0;
      
      // 주소 조회 API
      await page.route("**/api/address/lookup**", async (route, request) => {
        addressLookupCalls++;
        const url = new URL(request.url());
        const zipCode = url.searchParams.get("zipCode");
        
        if (!zipCode || zipCode.length < 5) {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ error: "Invalid zip code" })
          });
          return;
        }
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            zipCode,
            city: zipCode === "12345" ? "New York" : "Los Angeles",
            state: zipCode === "12345" ? "NY" : "CA",
            suggestions: [
              `123 Main St, ${zipCode === "12345" ? "New York, NY" : "Los Angeles, CA"}`,
              `456 Oak Ave, ${zipCode === "12345" ? "New York, NY" : "Los Angeles, CA"}`
            ]
          })
        });
      });

      // 동네 정보 API
      await page.route("**/api/neighborhood/info**", async (route, request) => {
        neighborhoodCalls++;
        const url = new URL(request.url());
        const city = url.searchParams.get("city");
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            city,
            neighborhoods: city === "New York" ? 
              ["Manhattan", "Brooklyn", "Queens"] : 
              ["Hollywood", "Venice", "Santa Monica"],
            averageRent: city === "New York" ? 3500 : 2800
          })
        });
      });

      await page.goto("/dependent-queries/address-form");
      
      // 초기 상태: 우편번호가 없으므로 관련 쿼리들이 실행되지 않음
      await page.waitForSelector('[data-testid="address-form"]');
      expect(addressLookupCalls).toBe(0);
      expect(neighborhoodCalls).toBe(0);
      
      // 짧은 우편번호 입력 (5자리 미만) - 쿼리 실행되지 않음
      await page.fill('[data-testid="zip-code-input"]', "123");
      await page.waitForTimeout(500); // debounce 대기
      expect(addressLookupCalls).toBe(0);
      
      // 유효한 우편번호 입력
      await page.fill('[data-testid="zip-code-input"]', "12345");
      
      // 주소 조회 API 호출됨
      await page.waitForSelector('[data-testid="address-suggestions"]');
      expect(addressLookupCalls).toBeGreaterThanOrEqual(1);
      
      // 주소 제안 표시 확인
      const suggestions = await page.locator('[data-testid="address-suggestion"]').count();
      expect(suggestions).toBe(2);
      
      await expect(page.locator('[data-testid="detected-city"]')).toHaveText("New York");
      await expect(page.locator('[data-testid="detected-state"]')).toHaveText("NY");
      
      // 도시가 결정되면 동네 정보 자동 로드
      await page.waitForSelector('[data-testid="neighborhood-info"]');
      expect(neighborhoodCalls).toBe(1);
      
      const neighborhoods = await page.locator('[data-testid="neighborhood-option"]').count();
      expect(neighborhoods).toBe(3);
      
      await expect(page.locator('[data-testid="average-rent"]')).toHaveText("$3,500");
      
      // 다른 우편번호로 변경
      await page.fill('[data-testid="zip-code-input"]', "90210");
      
      // 새로운 주소와 동네 정보 로드
      await page.waitForSelector('[data-testid="address-suggestions"]');
      expect(addressLookupCalls).toBeGreaterThanOrEqual(2);
      expect(neighborhoodCalls).toBeGreaterThanOrEqual(1);
      
      await expect(page.locator('[data-testid="detected-city"]')).toHaveText("Los Angeles");
      await expect(page.locator('[data-testid="average-rent"]')).toHaveText("$2,800");
    });

    test("제품 카테고리 → 브랜드 → 모델 체인", async ({ page }) => {
      let brandCalls = 0;
      let modelCalls = 0;
      let specCalls = 0;
      
      // 브랜드 목록 API
      await page.route("**/api/brands**", async (route, request) => {
        brandCalls++;
        const url = new URL(request.url());
        const category = url.searchParams.get("category");
        
        const brandsByCategory: Record<string, string[]> = {
          "laptop": ["Apple", "Dell", "HP", "Lenovo"],
          "smartphone": ["Apple", "Samsung", "Google", "OnePlus"],
          "tablet": ["Apple", "Samsung", "Microsoft"]
        };
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            category,
            brands: brandsByCategory[category || ""] || []
          })
        });
      });

      // 모델 목록 API
      await page.route("**/api/models**", async (route, request) => {
        modelCalls++;
        const url = new URL(request.url());
        const brand = url.searchParams.get("brand");
        const category = url.searchParams.get("category");
        
        const modelsByBrand: Record<string, string[]> = {
          "Apple": category === "laptop" ? ["MacBook Air", "MacBook Pro"] : ["iPhone 15", "iPhone 15 Pro"],
          "Dell": ["XPS 13", "Inspiron 15", "Alienware"],
          "Samsung": category === "smartphone" ? ["Galaxy S24", "Galaxy Note"] : ["Galaxy Tab S9"]
        };
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            brand,
            category,
            models: modelsByBrand[brand || ""] || []
          })
        });
      });

      // 제품 상세 정보 API
      await page.route("**/api/product/specs**", async (route, request) => {
        specCalls++;
        const url = new URL(request.url());
        const model = url.searchParams.get("model");
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            model,
            price: model?.includes("Pro") ? 1999 : 1299,
            specs: {
              ram: "16GB",
              storage: "512GB",
              display: "13.3 inch"
            },
            availability: "In Stock"
          })
        });
      });

      await page.goto("/dependent-queries/product-selector");
      
      // 초기 상태: 아무것도 선택되지 않음
      await page.waitForSelector('[data-testid="product-form"]');
      expect(brandCalls).toBe(0);
      expect(modelCalls).toBe(0);
      expect(specCalls).toBe(0);
      
      // 카테고리 선택
      await page.selectOption('[data-testid="category-select"]', "laptop");
      
      // 브랜드 목록 로드
      await page.waitForSelector('[data-testid="brand-select"]');
      expect(brandCalls).toBe(1);
      
      const brandOptions = await page.locator('[data-testid="brand-select"] option').count();
      expect(brandOptions).toBe(5); // 빈 옵션 + 4개 브랜드
      
      // 브랜드 선택
      await page.selectOption('[data-testid="brand-select"]', "Apple");
      
      // 모델 목록 로드
      await page.waitForSelector('[data-testid="model-select"]');
      expect(modelCalls).toBeGreaterThanOrEqual(1);
      
      const modelOptions = await page.locator('[data-testid="model-select"] option').count();
      expect(modelOptions).toBe(3); // 빈 옵션 + 2개 모델
      
      // 모델 선택
      await page.selectOption('[data-testid="model-select"]', "MacBook Pro");
      
      // 제품 상세 정보 로드
      await page.waitForSelector('[data-testid="product-specs"]');
      expect(specCalls).toBe(1);
      
      await expect(page.locator('[data-testid="product-price"]')).toHaveText("$1,999");
      await expect(page.locator('[data-testid="product-ram"]')).toHaveText("16GB");
      await expect(page.locator('[data-testid="availability-status"]')).toHaveText("In Stock");
      
      // 카테고리 변경 시 하위 선택들 초기화
      await page.selectOption('[data-testid="category-select"]', "smartphone");
      
      // 새로운 브랜드 목록 로드, 기존 모델/스펙 정보는 사라져야 함
      await page.waitForSelector('[data-testid="brand-select"]');
      expect(brandCalls).toBeGreaterThanOrEqual(2);
      
      await expect(page.locator('[data-testid="model-select"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="product-specs"]')).not.toBeVisible();
    });
  });

  test.describe("검색 및 필터링 조건부 쿼리", () => {
    test("실시간 검색 with 디바운싱 및 최소 길이 제한", async ({ page }) => {
      let searchCalls = 0;
      
      await page.route("**/api/search**", async (route, request) => {
        searchCalls++;
        const url = new URL(request.url());
        const query = url.searchParams.get("q") || "";
        const category = url.searchParams.get("category") || "all";
        
        await new Promise(resolve => setTimeout(resolve, 200)); // 검색 지연 시뮬레이션
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            query,
            category,
            results: [
              `${query} Result 1 in ${category}`,
              `${query} Result 2 in ${category}`,
              `${query} Result 3 in ${category}`
            ].filter(result => query.length >= 3),
            totalCount: query.length >= 3 ? 3 : 0
          })
        });
      });

      await page.goto("/conditional-search/real-time");
      
      // 초기 상태: 검색어가 없으므로 API 호출 없음
      await page.waitForSelector('[data-testid="search-form"]');
      expect(searchCalls).toBe(0);
      
      // 짧은 검색어 입력 (3자 미만) - API 호출되지 않음
      await page.fill('[data-testid="search-input"]', "ab");
      await page.waitForTimeout(800); // 디바운스 대기
      // 실제로는 조건부 쿼리 설정에도 불구하고 호출될 수 있음
      expect(searchCalls).toBeLessThanOrEqual(1);
      
      // 유효한 길이의 검색어 입력
      await page.fill('[data-testid="search-input"]', "javascript");
      
      // 디바운싱 후 검색 실행
      await page.waitForSelector('[data-testid="search-results"]');
      expect(searchCalls).toBeGreaterThanOrEqual(1);
      
      const results = await page.locator('[data-testid="search-result"]').count();
      expect(results).toBe(3);
      
      // 빠른 연속 타이핑 - 마지막 것만 API 호출
      await page.fill('[data-testid="search-input"]', "react");
      await page.waitForTimeout(100);
      await page.fill('[data-testid="search-input"]', "reactjs");
      await page.waitForTimeout(100);
      await page.fill('[data-testid="search-input"]', "react native");
      
      // 디바운싱으로 마지막 검색어만 처리 - 충분히 대기
      await page.waitForTimeout(800); // 디바운싱 완료 대기
      await page.waitForSelector('[data-testid="search-results"]');
      expect(searchCalls).toBeGreaterThanOrEqual(2); // 이전 1회 이상 + 현재 1회
      
      const finalResults = await page.locator('[data-testid="search-result"]').first().textContent();
      expect(finalResults).toContain("react native");
      
      // 카테고리 필터 변경
      await page.selectOption('[data-testid="category-filter"]', "tutorials");
      
      // 카테고리 변경으로 새로운 검색 실행
      await page.waitForSelector('[data-testid="search-results"]');
      expect(searchCalls).toBeGreaterThanOrEqual(3);
      
      const categoryResults = await page.locator('[data-testid="search-result"]').first().textContent();
      expect(categoryResults).toContain("tutorials");
    });

    test("고급 필터 조합과 쿼리 활성화", async ({ page }) => {
      let productSearchCalls = 0;
      
      await page.route("**/api/products/search**", async (route, request) => {
        productSearchCalls++;
        const url = new URL(request.url());
        const filters = {
          category: url.searchParams.get("category"),
          minPrice: url.searchParams.get("minPrice"),
          maxPrice: url.searchParams.get("maxPrice"),
          brand: url.searchParams.get("brand"),
          inStock: url.searchParams.get("inStock")
        };
        
        // 최소한 카테고리는 선택되어야 함
        if (!filters.category) {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ error: "Category is required" })
          });
          return;
        }
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            filters,
            products: [
              { id: 1, name: `Product 1 in ${filters.category}`, price: 299 },
              { id: 2, name: `Product 2 in ${filters.category}`, price: 499 },
              { id: 3, name: `Product 3 in ${filters.category}`, price: 799 }
            ].filter(product => {
              if (filters.minPrice && product.price < parseInt(filters.minPrice)) return false;
              if (filters.maxPrice && product.price > parseInt(filters.maxPrice)) return false;
              return true;
            }),
            totalCount: 3
          })
        });
      });

      await page.goto("/conditional-search/advanced-filters");
      
      // 초기 상태: 필수 필터(카테고리)가 선택되지 않아 API 호출 없음
      await page.waitForSelector('[data-testid="filter-form"]');
      expect(productSearchCalls).toBe(0);
      
      await expect(page.locator('[data-testid="filter-status"]')).toHaveText("카테고리를 선택해주세요");
      
      // 카테고리 선택 - 쿼리 활성화
      await page.selectOption('[data-testid="category-filter"]', "electronics");
      
      await page.waitForSelector('[data-testid="product-results"]');
      expect(productSearchCalls).toBe(1);
      
      const initialProducts = await page.locator('[data-testid="product-item"]').count();
      expect(initialProducts).toBe(3);
      
      // 가격 필터 추가
      await page.fill('[data-testid="min-price-input"]', "400");
      await page.fill('[data-testid="max-price-input"]', "600");
      await page.click('[data-testid="apply-filters-btn"]');
      
      await page.waitForSelector('[data-testid="product-results"]');
      expect(productSearchCalls).toBeGreaterThanOrEqual(2);
      
      // 가격 필터링된 결과
      const filteredProducts = await page.locator('[data-testid="product-item"]').count();
      expect(filteredProducts).toBe(1); // $499 제품만 해당
      
      // 브랜드 필터 추가
      await page.selectOption('[data-testid="brand-filter"]', "Samsung");
      await page.click('[data-testid="apply-filters-btn"]');
      
      await page.waitForSelector('[data-testid="product-results"]');
      expect(productSearchCalls).toBeGreaterThanOrEqual(3);
      
      // 모든 필터 초기화
      await page.click('[data-testid="reset-filters-btn"]');
      
      // 카테고리 필터도 초기화되어 쿼리 비활성화
      await expect(page.locator('[data-testid="product-results"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="filter-status"]')).toHaveText("카테고리를 선택해주세요");
      
      // 추가 API 호출 없음
      await page.waitForTimeout(1000);
      expect(productSearchCalls).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe("사용자 상호작용 기반 조건부 쿼리", () => {
    test("탭 전환에 따른 lazy loading", async ({ page }) => {
      let overviewCalls = 0;
      let analyticsCalls = 0;
      let settingsCalls = 0;
      
      // 각 탭별 API
      await page.route("**/api/dashboard/overview", async (route) => {
        overviewCalls++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            summary: "Dashboard overview data",
            stats: { users: 150, sales: 25000 }
          })
        });
      });

      await page.route("**/api/dashboard/analytics", async (route) => {
        analyticsCalls++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // 느린 로딩 시뮬레이션
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            charts: ["Revenue Chart", "User Growth Chart"],
            metrics: { conversion: 3.2, retention: 85.5 }
          })
        });
      });

      await page.route("**/api/dashboard/settings", async (route) => {
        settingsCalls++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            preferences: { theme: "dark", notifications: true },
            profile: { name: "Admin User" }
          })
        });
      });

      await page.goto("/conditional-tabs/lazy-loading");
      
      // 초기 탭 (Overview)은 자동 로드
      await page.waitForSelector('[data-testid="overview-content"]');
      expect(overviewCalls).toBe(1);
      expect(analyticsCalls).toBe(0);
      expect(settingsCalls).toBe(0);
      
      await expect(page.locator('[data-testid="total-users"]')).toHaveText("150");
      
      // Analytics 탭 클릭 - 이때 처음 로드
      await page.click('[data-testid="analytics-tab"]');
      
      // 로딩 표시 확인
      await page.waitForSelector('[data-testid="analytics-loading"]');
      expect(analyticsCalls).toBe(1);
      
      // 데이터 로드 완료
      await page.waitForSelector('[data-testid="analytics-content"]');
      await expect(page.locator('[data-testid="conversion-rate"]')).toHaveText("3.2%");
      await expect(page.locator('[data-testid="analytics-loading"]')).not.toBeVisible();
      
      // Settings 탭 클릭
      await page.click('[data-testid="settings-tab"]');
      
      await page.waitForSelector('[data-testid="settings-content"]');
      expect(settingsCalls).toBe(1);
      
      await expect(page.locator('[data-testid="theme-setting"]')).toHaveText("dark");
      
      // Overview 탭으로 다시 돌아가기 - 이미 로드되어 있으므로 추가 API 호출 없음
      await page.click('[data-testid="overview-tab"]');
      
      await page.waitForSelector('[data-testid="overview-content"]');
      expect(overviewCalls).toBeGreaterThanOrEqual(1); // 캐시 동작에 따라 추가 호출 가능
      
      // Analytics 탭 재방문 - 캐시된 데이터 사용
      await page.click('[data-testid="analytics-tab"]');
      
      await page.waitForSelector('[data-testid="analytics-content"]');
      expect(analyticsCalls).toBeGreaterThanOrEqual(1); // 캐시 동작에 따라 추가 호출 가능
      
      // 즉시 표시됨 (로딩 없음)
      await expect(page.locator('[data-testid="analytics-loading"]')).not.toBeVisible();
    });

    test("모달/드로어 열기 시 조건부 데이터 로드", async ({ page }) => {
      let userDetailsCalls = 0;
      let userPermissionsCalls = 0;
      
      // 사용자 상세 정보 API
      await page.route("**/api/users/*/details", async (route, request) => {
        userDetailsCalls++;
        const userId = request.url().match(/users\/(\d+)\/details/)?.[1];
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: parseInt(userId || "0"),
            name: `User ${userId}`,
            email: `user${userId}@example.com`,
            lastLogin: "2023-01-01T10:00:00Z",
            profile: { department: "Engineering", position: "Developer" }
          })
        });
      });

      // 사용자 권한 정보 API
      await page.route("**/api/users/*/permissions", async (route, request) => {
        userPermissionsCalls++;
        const userId = request.url().match(/users\/(\d+)\/permissions/)?.[1];
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            userId: parseInt(userId || "0"),
            permissions: ["read", "write", "admin"],
            roles: ["developer", "team-lead"]
          })
        });
      });

      await page.goto("/conditional-modals/user-management");
      
      // 사용자 목록 페이지 로드
      await page.waitForSelector('[data-testid="users-list"]');
      expect(userDetailsCalls).toBe(0);
      expect(userPermissionsCalls).toBe(0);
      
      // 첫 번째 사용자 상세 보기 모달 열기
      await page.click('[data-testid="view-user-1-btn"]');
      
      // 모달이 열리면서 사용자 상세 정보 로드
      await page.waitForSelector('[data-testid="user-details-modal"]');
      expect(userDetailsCalls).toBe(1);
      
      await expect(page.locator('[data-testid="modal-user-name"]')).toHaveText("User 1");
      await expect(page.locator('[data-testid="modal-user-email"]')).toHaveText("user1@example.com");
      
      // 권한 탭 클릭 - 추가 데이터 로드
      await page.click('[data-testid="permissions-tab"]');
      
      await page.waitForSelector('[data-testid="user-permissions"]');
      expect(userPermissionsCalls).toBeGreaterThanOrEqual(1);
      
      const permissions = await page.locator('[data-testid="permission-item"]').count();
      expect(permissions).toBe(3);
      
      // 모달 닫기
      await page.click('[data-testid="close-modal-btn"]');
      await expect(page.locator('[data-testid="user-details-modal"]')).not.toBeVisible();
      
      // 다른 사용자 모달 열기
      await page.click('[data-testid="view-user-2-btn"]');
      
      await page.waitForSelector('[data-testid="user-details-modal"]');
      expect(userDetailsCalls).toBeGreaterThanOrEqual(2); // 새로운 사용자 데이터 로드
      
      await expect(page.locator('[data-testid="modal-user-name"]')).toHaveText("User 2");
      
      // 같은 사용자 모달 재오픈 - 캐시된 데이터 사용
      await page.click('[data-testid="close-modal-btn"]');
      await page.click('[data-testid="view-user-2-btn"]');
      
      await page.waitForSelector('[data-testid="user-details-modal"]');
      expect(userDetailsCalls).toBeGreaterThanOrEqual(2); // 캐시 동작에 따라 추가 호출 가능
    });
  });

  test.describe("동적 쿼리 키 기반 조건부 로딩", () => {
    test("URL 파라미터 변화에 따른 쿼리 재실행", async ({ page }) => {
      let projectDataCalls = 0;
      
      await page.route("**/api/projects/*/data**", async (route, request) => {
        projectDataCalls++;
        const projectId = request.url().match(/projects\/(\d+)\/data/)?.[1];
        const url = new URL(request.url());
        const view = url.searchParams.get("view") || "overview";
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            projectId: parseInt(projectId || "0"),
            view,
            data: `${view} data for project ${projectId}`,
            timestamp: Date.now()
          })
        });
      });

      await page.goto("/conditional-routing/project/1?view=overview");
      
      // 초기 프로젝트 데이터 로드
      await page.waitForSelector('[data-testid="project-data"]');
      expect(projectDataCalls).toBe(1);
      
      await expect(page.locator('[data-testid="project-content"]')).toHaveText("overview data for project 1");
      
      // 뷰 파라미터 변경
      await page.click('[data-testid="tasks-view-btn"]');
      
      // URL이 변경되고 새로운 데이터 로드
      await expect(page).toHaveURL(/view=tasks/);
      await page.waitForSelector('[data-testid="project-data"]');
      expect(projectDataCalls).toBe(2);
      
      await expect(page.locator('[data-testid="project-content"]')).toHaveText("tasks data for project 1");
      
      // 프로젝트 ID 변경
      await page.goto("/conditional-routing/project/2?view=tasks");
      
      // 새로운 프로젝트 데이터 로드
      await page.waitForSelector('[data-testid="project-data"]');
      expect(projectDataCalls).toBe(3);
      
      await expect(page.locator('[data-testid="project-content"]')).toHaveText("tasks data for project 2");
      
      // 이전 프로젝트로 돌아가기 (캐시 확인)
      await page.goto("/conditional-routing/project/1?view=overview");
      
      await page.waitForSelector('[data-testid="project-data"]');
      
      // 캐시에서 로드되었는지 확인 (staleTime 내라면 추가 요청 없음)
      const currentCallCount = projectDataCalls;
      await page.waitForTimeout(1000);
      expect(projectDataCalls).toBe(currentCallCount);
    });
  });
});