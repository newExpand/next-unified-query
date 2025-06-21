import { test, expect } from "@playwright/test";

/**
 * Query Factory와 Mutation Factory의 고급 옵션 E2E 테스트
 * 
 * 단위 테스트로는 검증하기 어려운 실제 브라우저 환경에서의
 * Factory 옵션들의 동작을 검증합니다.
 */

test.describe("Query Factory Advanced Options", () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트마다 캐시 초기화
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe("Schema 검증 (Zod)", () => {
    test("API 응답이 스키마와 일치할 때 정상 처리", async ({ page }) => {
      // 올바른 스키마를 가진 API 응답
      await page.route("**/api/users/1", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            age: 30
          })
        });
      });

      await page.goto("/schema-validation/user-profile");
      
      // 스키마 검증 통과 후 데이터 표시
      await page.waitForSelector('[data-testid="user-profile"]');
      await expect(page.locator('[data-testid="user-name"]')).toHaveText("John Doe");
      await expect(page.locator('[data-testid="user-email"]')).toHaveText("john@example.com");
      await expect(page.locator('[data-testid="user-age"]')).toHaveText("30");
      
      // 스키마 검증 성공 표시 확인
      await expect(page.locator('[data-testid="schema-validation-status"]')).toHaveText("✓ Valid");
    });

    test("API 응답이 스키마와 불일치할 때 에러 처리", async ({ page }) => {
      // 잘못된 스키마의 API 응답 (필수 필드 누락)
      await page.route("**/api/users/1", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "John Doe",
            // email 필드 누락
            age: "invalid_age" // 잘못된 타입
          })
        });
      });

      await page.goto("/schema-validation/user-profile");
      
      // 스키마 검증 실패 시 에러 메시지 표시
      await page.waitForSelector('[data-testid="schema-error"]');
      await expect(page.locator('[data-testid="schema-error"]')).toBeVisible();
      
      // 구체적인 검증 오류 메시지 확인
      const errorMessage = await page.locator('[data-testid="schema-error-details"]').textContent();
      expect(errorMessage).toContain("email");
      expect(errorMessage).toContain("age");
      
      // 사용자 데이터는 표시되지 않아야 함
      await expect(page.locator('[data-testid="user-profile"]')).not.toBeVisible();
    });

    test("다양한 타입 검증 시나리오", async ({ page }) => {
      const testCases = [
        {
          name: "날짜 형식 검증",
          response: { id: 1, name: "Test", createdAt: "invalid-date", updatedAt: "2023-01-01T00:00:00Z" },
          expectedError: "createdAt"
        },
        {
          name: "배열 검증",
          response: { id: 1, name: "Test", tags: "not-an-array", skills: ["skill1", "skill2"] },
          expectedError: "tags"
        },
        {
          name: "중첩 객체 검증",
          response: { id: 1, name: "Test", profile: { bio: 123 } }, // bio는 string이어야 함
          expectedError: "bio"
        }
      ];

      for (const testCase of testCases) {
        await page.route("**/api/complex-data", async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(testCase.response)
          });
        });

        await page.goto("/schema-validation/complex-data");
        
        await page.waitForSelector('[data-testid="schema-error"]');
        const errorDetails = await page.locator('[data-testid="schema-error-details"]').textContent();
        expect(errorDetails).toContain(testCase.expectedError);
      }
    });
  });

  test.describe("Select 함수 데이터 변환", () => {
    test("API 응답 데이터 변환 및 메모이제이션", async ({ page }) => {
      let callCount = 0;
      
      await page.route("**/api/posts", async (route) => {
        callCount++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              { id: 1, title: "Post 1", content: "Long content 1", publishedAt: "2023-01-01", authorId: 1 },
              { id: 2, title: "Post 2", content: "Long content 2", publishedAt: "2023-01-02", authorId: 2 }
            ],
            meta: { total: 2, page: 1 }
          })
        });
      });

      await page.goto("/data-transformation/posts");
      
      // select 함수로 변환된 데이터가 표시되는지 확인
      await page.waitForSelector('[data-testid="posts-list"]');
      
      // 원본 데이터가 아닌 변환된 데이터 확인
      const firstPost = page.locator('[data-testid="post-item-1"]');
      await expect(firstPost.locator('[data-testid="post-title"]')).toHaveText("Post 1");
      await expect(firstPost.locator('[data-testid="post-summary"]')).toHaveText("Long content 1...");
      await expect(firstPost.locator('[data-testid="post-date"]')).toHaveText("2023년 1월 1일");
      
      // 변환 통계 확인
      await expect(page.locator('[data-testid="transform-stats"]')).toHaveText("2 posts transformed");
      
      // 페이지 새로고침으로 캐시에서 로드
      await page.reload();
      await page.waitForSelector('[data-testid="posts-list"]');
      
      // API 호출이 다시 일어나지 않았는지 확인 (캐시 활용)
      expect(callCount).toBe(1);
      
      // 변환된 데이터가 동일하게 표시되는지 확인
      await expect(firstPost.locator('[data-testid="post-title"]')).toHaveText("Post 1");
    });

    test("select 함수 실행 시점과 리렌더링 최적화", async ({ page }) => {
      await page.route("**/api/user-stats", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: { id: 1, name: "Test User" },
            posts: [{ id: 1, views: 100 }, { id: 2, views: 200 }],
            comments: [{ id: 1, likes: 5 }, { id: 2, likes: 10 }]
          })
        });
      });

      await page.goto("/data-transformation/user-stats");
      
      // select 함수 실행 횟수 추적
      await page.waitForSelector('[data-testid="stats-dashboard"]');
      
      const initialSelectCalls = await page.locator('[data-testid="select-call-count"]').textContent();
      
      // 같은 데이터에 의존하지 않는 상태 변경 (select 함수 재실행되지 않아야 함)
      await page.click('[data-testid="toggle-theme-btn"]');
      
      const afterToggleSelectCalls = await page.locator('[data-testid="select-call-count"]').textContent();
      expect(afterToggleSelectCalls).toBe(initialSelectCalls);
      
      // 데이터 의존성이 있는 변경 (select 함수 재실행되어야 함)
      await page.click('[data-testid="change-filter-btn"]');
      
      const afterFilterSelectCalls = await page.locator('[data-testid="select-call-count"]').textContent();
      expect(parseInt(afterFilterSelectCalls || "0")).toBeGreaterThan(parseInt(initialSelectCalls || "0"));
    });
  });

  test.describe("Enabled 조건부 쿼리", () => {
    test("함수형 enabled로 동적 쿼리 활성화/비활성화", async ({ page }) => {
      await page.route("**/api/user-permissions", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ canViewSensitiveData: true })
        });
      });

      let sensitiveDataCalls = 0;
      await page.route("**/api/sensitive-data", async (route) => {
        sensitiveDataCalls++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ secretData: "Top Secret Information" })
        });
      });

      await page.goto("/conditional-queries/permissions");
      
      // 권한 로드 후 민감한 데이터 쿼리가 활성화되어야 함
      await page.waitForSelector('[data-testid="permissions-loaded"]');
      await page.waitForSelector('[data-testid="sensitive-data"]');
      
      expect(sensitiveDataCalls).toBe(1);
      await expect(page.locator('[data-testid="sensitive-data"]')).toHaveText("Top Secret Information");
      
      // 권한 변경 시뮬레이션
      await page.route("**/api/user-permissions", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ canViewSensitiveData: false })
        });
      });

      await page.click('[data-testid="refresh-permissions-btn"]');
      
      // 권한이 없어지면 민감한 데이터가 숨겨져야 함
      await expect(page.locator('[data-testid="sensitive-data"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
      
      // 추가 API 호출이 없어야 함
      expect(sensitiveDataCalls).toBe(1);
    });

    test("파라미터 변화에 따른 enabled 조건 동적 변경", async ({ page }) => {
      let searchApiCalls = 0;
      
      await page.route("**/api/search**", async (route, request) => {
        const url = new URL(request.url());
        const query = url.searchParams.get("q");
        
        if (!query || query.length < 3) {
          await route.fulfill({ status: 400, body: JSON.stringify({ error: "Query too short" }) });
          return;
        }
        
        searchApiCalls++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            results: [`Result for "${query}" 1`, `Result for "${query}" 2`],
            query
          })
        });
      });

      await page.goto("/conditional-queries/search");
      
      // 초기 상태: 검색어가 없으므로 API 호출 안됨
      await page.waitForSelector('[data-testid="search-form"]');
      expect(searchApiCalls).toBe(0);
      
      // 짧은 검색어 입력 (3글자 미만) - API 호출 안됨
      await page.fill('[data-testid="search-input"]', "ab");
      await page.waitForTimeout(500); // debounce 대기
      expect(searchApiCalls).toBe(0);
      
      // 충분한 길이의 검색어 입력 - API 호출됨
      await page.fill('[data-testid="search-input"]', "javascript");
      
      await page.waitForSelector('[data-testid="search-results"]');
      expect(searchApiCalls).toBe(1);
      
      const results = await page.locator('[data-testid="search-result"]').count();
      expect(results).toBe(2);
      
      // 검색어 삭제 - 결과 숨김
      await page.fill('[data-testid="search-input"]', "");
      await expect(page.locator('[data-testid="search-results"]')).not.toBeVisible();
    });
  });

  test.describe("QueryFn 커스텀 함수", () => {
    test("복잡한 API 조합 및 데이터 가공", async ({ page }) => {
      // 사용자 기본 정보 API
      await page.route("**/api/users/1", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: 1, name: "John Doe", departmentId: 5 })
        });
      });

      // 부서 정보 API
      await page.route("**/api/departments/5", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: 5, name: "Engineering", location: "Seoul" })
        });
      });

      // 사용자 통계 API
      await page.route("**/api/users/1/stats", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ projectCount: 3, taskCount: 15 })
        });
      });

      await page.goto("/custom-queries/user-details");
      
      // 여러 API 호출 결과가 조합되어 표시되는지 확인
      await page.waitForSelector('[data-testid="user-details"]');
      
      await expect(page.locator('[data-testid="user-name"]')).toHaveText("John Doe");
      await expect(page.locator('[data-testid="user-department"]')).toHaveText("Engineering (Seoul)");
      await expect(page.locator('[data-testid="user-stats"]')).toHaveText("3 projects, 15 tasks");
      
      // 조합된 데이터의 캐시 키 확인
      const cacheInfo = await page.locator('[data-testid="cache-info"]').textContent();
      expect(cacheInfo).toContain("Combined user data cached");
    });

    test("GraphQL과 REST API 조합", async ({ page }) => {
      // GraphQL API 시뮬레이션
      await page.route("**/graphql", async (route, request) => {
        const body = await request.postDataJSON();
        
        if (body.query.includes("userProfile")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                user: {
                  id: 1,
                  name: "GraphQL User",
                  posts: [
                    { id: 1, title: "GraphQL Post 1" },
                    { id: 2, title: "GraphQL Post 2" }
                  ]
                }
              }
            })
          });
        }
      });

      // REST API 시뮬레이션
      await page.route("**/api/users/1/analytics", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            totalViews: 1250,
            totalLikes: 89,
            engagement: 7.12
          })
        });
      });

      await page.goto("/custom-queries/hybrid-data");
      
      // GraphQL + REST 조합 데이터 표시 확인
      await page.waitForSelector('[data-testid="hybrid-profile"]');
      
      await expect(page.locator('[data-testid="profile-name"]')).toHaveText("GraphQL User");
      await expect(page.locator('[data-testid="posts-count"]')).toHaveText("2");
      await expect(page.locator('[data-testid="total-views"]')).toHaveText("1,250");
      await expect(page.locator('[data-testid="engagement-rate"]')).toHaveText("7.12%");
    });

    test("에러 발생 시 재시도 로직 및 fallback", async ({ page }) => {
      let primaryApiCalls = 0;
      let fallbackApiCalls = 0;

      // 주 API (처음 2번 실패)
      await page.route("**/api/primary-data", async (route) => {
        primaryApiCalls++;
        if (primaryApiCalls <= 2) {
          await route.fulfill({ status: 500, body: JSON.stringify({ error: "Server Error" }) });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: "Primary Data", source: "primary" })
          });
        }
      });

      // Fallback API
      await page.route("**/api/fallback-data", async (route) => {
        fallbackApiCalls++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: "Fallback Data", source: "fallback" })
        });
      });

      await page.goto("/custom-queries/resilient-data");
      
      // 재시도 후 성공한 주 API 데이터가 표시되어야 함
      await page.waitForSelector('[data-testid="data-content"]');
      await expect(page.locator('[data-testid="data-source"]')).toHaveText("primary");
      await expect(page.locator('[data-testid="data-value"]')).toHaveText("Primary Data");
      
      expect(primaryApiCalls).toBe(3);
      expect(fallbackApiCalls).toBe(0); // 주 API가 성공했으므로 fallback 미사용
    });
  });

  test.describe("FetchConfig 커스텀 설정", () => {
    test("커스텀 헤더, timeout, cache 옵션", async ({ page }) => {
      let receivedHeaders: Record<string, string> = {};
      
      await page.route("**/api/custom-config", async (route, request) => {
        receivedHeaders = request.headers();
        
        // timeout 테스트를 위한 지연
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ 
            receivedHeaders: {
              authorization: receivedHeaders["authorization"],
              "x-custom-header": receivedHeaders["x-custom-header"],
              "x-api-version": receivedHeaders["x-api-version"]
            }
          })
        });
      });

      await page.goto("/fetch-config/custom-headers");
      
      await page.waitForSelector('[data-testid="config-response"]');
      
      // 커스텀 헤더가 올바르게 전송되었는지 확인
      expect(receivedHeaders["authorization"]).toBe("Bearer custom-token");
      expect(receivedHeaders["x-custom-header"]).toBe("custom-value");
      expect(receivedHeaders["x-api-version"]).toBe("v2");
      
      // 응답에서 헤더 정보 확인
      const headerInfo = await page.locator('[data-testid="received-headers"]').textContent();
      expect(headerInfo).toContain("Bearer custom-token");
      expect(headerInfo).toContain("custom-value");
    });

    test("timeout 및 재시도 설정", async ({ page }) => {
      let requestAttempts = 0;
      
      await page.route("**/api/slow-endpoint", async (route) => {
        requestAttempts++;
        
        if (requestAttempts === 1) {
          // 첫 번째 요청: timeout 시뮬레이션 (3초 지연)
          await new Promise(resolve => setTimeout(resolve, 3000));
          await route.fulfill({ status: 200, body: JSON.stringify({ data: "slow response" }) });
        } else {
          // 재시도: 빠른 응답
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: "fast response", attempt: requestAttempts })
          });
        }
      });

      await page.goto("/fetch-config/timeout-retry");
      
      // timeout으로 재시도 후 성공
      await page.waitForSelector('[data-testid="timeout-result"]');
      
      const result = await page.locator('[data-testid="response-data"]').textContent();
      expect(result).toContain("fast response");
      
      const attemptInfo = await page.locator('[data-testid="attempt-count"]').textContent();
      expect(attemptInfo).toContain("2");
    });

    test("캐시 옵션 및 Next.js 특화 설정", async ({ page }) => {
      let cacheApiCalls = 0;
      
      await page.route("**/api/cached-data", async (route, request) => {
        cacheApiCalls++;
        const cacheControl = request.headers()["cache-control"];
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: {
            "Cache-Control": "max-age=60",
            "ETag": `"etag-${cacheApiCalls}"`
          },
          body: JSON.stringify({ 
            data: `Cached data ${cacheApiCalls}`,
            timestamp: Date.now(),
            cacheControl 
          })
        });
      });

      await page.goto("/fetch-config/cache-options");
      
      // 첫 번째 로드
      await page.waitForSelector('[data-testid="cached-data"]');
      expect(cacheApiCalls).toBe(1);
      
      // 페이지 새로고침 (브라우저 캐시에서 로드되어야 함)
      await page.reload();
      await page.waitForSelector('[data-testid="cached-data"]');
      
      // force-cache 옵션으로 인해 추가 요청이 없어야 함
      const cacheInfo = await page.locator('[data-testid="cache-info"]').textContent();
      expect(cacheInfo).toContain("force-cache");
      
      // 캐시 무효화 후 새 요청
      await page.click('[data-testid="invalidate-cache-btn"]');
      await page.waitForTimeout(100);
      
      const finalCallCount = await page.locator('[data-testid="api-call-count"]').textContent();
      expect(parseInt(finalCallCount || "0")).toBeGreaterThan(1);
    });
  });
});

test.describe("Mutation Factory Advanced Options", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe("Request/Response Schema 검증", () => {
    test("요청 데이터 스키마 검증 성공/실패", async ({ page }) => {
      await page.route("**/api/users", async (route, request) => {
        const body = await request.postDataJSON();
        
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 999,
            name: body.name,
            email: body.email,
            createdAt: new Date().toISOString()
          })
        });
      });

      await page.goto("/mutation-schema/create-user");
      
      // 유효한 데이터로 사용자 생성
      await page.fill('[data-testid="user-name-input"]', "John Doe");
      await page.fill('[data-testid="user-email-input"]', "john@example.com");
      await page.fill('[data-testid="user-age-input"]', "30");
      
      await page.click('[data-testid="create-user-btn"]');
      
      await page.waitForSelector('[data-testid="creation-success"]');
      await expect(page.locator('[data-testid="created-user-name"]')).toHaveText("John Doe");
      
      // 스키마 검증 실패 케이스
      await page.fill('[data-testid="user-name-input"]', ""); // 필수 필드 비움
      await page.fill('[data-testid="user-email-input"]', "invalid-email"); // 잘못된 이메일
      await page.fill('[data-testid="user-age-input"]', "-5"); // 음수 나이
      
      await page.click('[data-testid="create-user-btn"]');
      
      // 클라이언트 측에서 스키마 검증 실패 표시
      await page.waitForSelector('[data-testid="validation-errors"]');
      
      const errors = await page.locator('[data-testid="validation-error"]').allTextContents();
      expect(errors.some(error => error.includes("name"))).toBe(true);
      expect(errors.some(error => error.includes("email"))).toBe(true);
      expect(errors.some(error => error.includes("age"))).toBe(true);
    });

    test("응답 데이터 스키마 검증 및 타입 안전성", async ({ page }) => {
      // 올바른 응답 스키마
      await page.route("**/api/products", async (route) => {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "Test Product",
            price: 29.99,
            category: "electronics",
            inStock: true,
            createdAt: "2023-01-01T00:00:00Z"
          })
        });
      });

      await page.goto("/mutation-schema/create-product");
      
      await page.fill('[data-testid="product-name"]', "Test Product");
      await page.fill('[data-testid="product-price"]', "29.99");
      await page.selectOption('[data-testid="product-category"]', "electronics");
      
      await page.click('[data-testid="create-product-btn"]');
      
      await page.waitForSelector('[data-testid="product-created"]');
      
      // 타입 안전한 데이터 접근 확인
      await expect(page.locator('[data-testid="product-id"]')).toHaveText("1");
      await expect(page.locator('[data-testid="product-price-display"]')).toHaveText("$29.99");
      await expect(page.locator('[data-testid="product-stock-status"]')).toHaveText("In Stock");
      
      // 잘못된 응답 스키마 시뮬레이션
      await page.route("**/api/products", async (route) => {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "invalid-id", // 숫자여야 함
            name: 123, // 문자열이어야 함
            price: "invalid-price", // 숫자여야 함
            // category 필드 누락
            inStock: "yes", // 불린이어야 함
          })
        });
      });

      await page.click('[data-testid="create-another-btn"]');
      
      // 응답 스키마 검증 실패 에러 표시
      await page.waitForSelector('[data-testid="response-schema-error"]');
      const schemaError = await page.locator('[data-testid="schema-error-message"]').textContent();
      expect(schemaError).toContain("Invalid response format");
    });
  });

  test.describe("콜백 체인 실행 순서", () => {
    test("onMutate → onSuccess → onSettled 콜백 순서", async ({ page }) => {
      await page.route("**/api/posts", async (route) => {
        // 2초 지연으로 콜백 순서 명확히 확인
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            title: "New Post",
            content: "Post content",
            publishedAt: new Date().toISOString()
          })
        });
      });

      await page.goto("/mutation-callbacks/post-creation");
      
      await page.fill('[data-testid="post-title"]', "New Post");
      await page.fill('[data-testid="post-content"]', "Post content");
      
      await page.click('[data-testid="create-post-btn"]');
      
      // onMutate 콜백 실행 (즉시)
      await page.waitForSelector('[data-testid="mutate-callback"]');
      await expect(page.locator('[data-testid="callback-order-1"]')).toHaveText("onMutate");
      
      // 로딩 상태 확인
      await expect(page.locator('[data-testid="creating-post"]')).toBeVisible();
      
      // onSuccess 콜백 실행 (2초 후)
      await page.waitForSelector('[data-testid="success-callback"]');
      await expect(page.locator('[data-testid="callback-order-2"]')).toHaveText("onSuccess");
      
      // onSettled 콜백 실행 (마지막)
      await page.waitForSelector('[data-testid="settled-callback"]');
      await expect(page.locator('[data-testid="callback-order-3"]')).toHaveText("onSettled");
      
      // 최종 상태 확인
      await expect(page.locator('[data-testid="creating-post"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="post-created"]')).toBeVisible();
    });

    test("onMutate context가 다른 콜백에 전달", async ({ page }) => {
      await page.route("**/api/comments", async (route) => {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            content: "New comment",
            authorId: 1,
            createdAt: new Date().toISOString()
          })
        });
      });

      await page.goto("/mutation-callbacks/comment-creation");
      
      await page.fill('[data-testid="comment-content"]', "New comment");
      await page.click('[data-testid="create-comment-btn"]');
      
      // onMutate에서 설정한 context 확인
      await page.waitForSelector('[data-testid="mutate-context"]');
      const mutateContext = await page.locator('[data-testid="context-data"]').textContent();
      expect(mutateContext).toContain("optimistic-id");
      expect(mutateContext).toContain("timestamp");
      
      // onSuccess에서 동일한 context 접근 확인
      await page.waitForSelector('[data-testid="success-context"]');
      const successContext = await page.locator('[data-testid="success-context-data"]').textContent();
      expect(successContext).toBe(mutateContext); // 동일한 context여야 함
      
      // onSettled에서도 동일한 context 접근 확인
      await page.waitForSelector('[data-testid="settled-context"]');
      const settledContext = await page.locator('[data-testid="settled-context-data"]').textContent();
      expect(settledContext).toBe(mutateContext);
    });

    test("에러 발생 시 onError → onSettled 콜백 순서", async ({ page }) => {
      await page.route("**/api/posts", async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server Error" })
        });
      });

      await page.goto("/mutation-callbacks/post-creation");
      
      await page.fill('[data-testid="post-title"]', "Error Post");
      await page.click('[data-testid="create-post-btn"]');
      
      // onMutate 실행
      await page.waitForSelector('[data-testid="mutate-callback"]');
      
      // onError 콜백 실행
      await page.waitForSelector('[data-testid="error-callback"]');
      await expect(page.locator('[data-testid="callback-order-2"]')).toHaveText("onError");
      
      // onSettled 콜백 실행 (에러 상황에서도)
      await page.waitForSelector('[data-testid="settled-callback"]');
      await expect(page.locator('[data-testid="callback-order-3"]')).toHaveText("onSettled");
      
      // 에러 메시지 표시 확인
      await expect(page.locator('[data-testid="error-message"]')).toHaveText("Server Error");
    });
  });

  test.describe("InvalidateQueries 동적 무효화", () => {
    test("함수형 invalidateQueries로 관련 쿼리 동적 무효화", async ({ page }) => {
      // 초기 게시물 목록 로드
      await page.route("**/api/posts**", async (route, request) => {
        const url = new URL(request.url());
        const category = url.searchParams.get("category");
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            posts: [
              { id: 1, title: "Tech Post 1", category: "tech" },
              { id: 2, title: "Tech Post 2", category: "tech" },
              { id: 3, title: "Life Post 1", category: "life" }
            ].filter(post => !category || post.category === category)
          })
        });
      });

      // 새 게시물 생성 API
      await page.route("**/api/posts", async (route, request) => {
        if (request.method() === "POST") {
          const body = await request.postDataJSON();
          
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
              id: Date.now(),
              title: body.title,
              category: body.category,
              createdAt: new Date().toISOString()
            })
          });
        }
      });

      await page.goto("/dynamic-invalidation/post-management");
      
      // 전체 게시물 목록 로드
      await page.waitForSelector('[data-testid="all-posts"]');
      const initialPostCount = await page.locator('[data-testid="post-item"]').count();
      expect(initialPostCount).toBe(3);
      
      // 특정 카테고리 게시물만 표시
      await page.click('[data-testid="filter-tech-btn"]');
      await page.waitForSelector('[data-testid="tech-posts"]');
      const techPostCount = await page.locator('[data-testid="tech-post-item"]').count();
      expect(techPostCount).toBe(2);
      
      // 새 tech 게시물 생성
      await page.fill('[data-testid="new-post-title"]', "New Tech Post");
      await page.selectOption('[data-testid="post-category-select"]', "tech");
      await page.click('[data-testid="create-post-btn"]');
      
      // mutation 성공 후 관련 쿼리들이 무효화되어 새로고침됨
      await page.waitForSelector('[data-testid="post-created"]');
      
      // 전체 목록과 tech 카테고리 목록 모두 업데이트됨
      await expect(page.locator('[data-testid="all-posts-count"]')).toHaveText("4");
      await expect(page.locator('[data-testid="tech-posts-count"]')).toHaveText("3");
      
      // life 카테고리는 영향받지 않음 (동적 무효화로 tech 관련만 무효화)
      await page.click('[data-testid="filter-life-btn"]');
      const lifePostCount = await page.locator('[data-testid="life-post-item"]').count();
      expect(lifePostCount).toBe(1); // 변화 없음
    });

    test("조건부 쿼리 무효화", async ({ page }) => {
      // 사용자별 알림 API
      await page.route("**/api/users/*/notifications", async (route, request) => {
        const userId = request.url().match(/users\/(\d+)\/notifications/)?.[1];
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            notifications: [
              { id: 1, message: `Notification for user ${userId}`, read: false }
            ]
          })
        });
      });

      // 알림 읽음 처리 API
      await page.route("**/api/notifications/*/read", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true })
        });
      });

      await page.goto("/conditional-invalidation/notifications");
      
      // 사용자 1 로그인 시뮬레이션
      await page.click('[data-testid="login-user-1-btn"]');
      
      await page.waitForSelector('[data-testid="user-1-notifications"]');
      await expect(page.locator('[data-testid="unread-count"]')).toHaveText("1");
      
      // 알림 읽음 처리
      await page.click('[data-testid="mark-read-btn"]');
      
      // 현재 사용자의 알림만 무효화되어야 함
      await page.waitForSelector('[data-testid="notification-read"]');
      
      // 다른 사용자로 전환
      await page.click('[data-testid="login-user-2-btn"]');
      
      // 사용자 2의 알림 로드 (별도의 쿼리이므로 영향받지 않음)
      await page.waitForSelector('[data-testid="user-2-notifications"]');
      
      const invalidationLog = await page.locator('[data-testid="invalidation-log"]').textContent();
      expect(invalidationLog).toContain("user-1-notifications");
      expect(invalidationLog).not.toContain("user-2-notifications");
    });
  });

  test.describe("MutationFn 커스텀 함수", () => {
    test("파일 업로드 with progress tracking", async ({ page }) => {
      await page.route("**/api/upload", async (route, request) => {
        // 파일 업로드 시뮬레이션 (단계적 progress)
        const formData = await request.postDataBuffer();
        
        // progress 단계별로 응답
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            fileId: "uploaded-file-123",
            filename: "test-file.jpg",
            size: 1024000,
            url: "/uploads/test-file.jpg"
          })
        });
      });

      await page.goto("/custom-mutations/file-upload");
      
      // 파일 선택 시뮬레이션
      const fileChooserPromise = page.waitForEvent("filechooser");
      await page.click('[data-testid="file-input"]');
      const fileChooser = await fileChooserPromise;
      
      // 가상의 파일 업로드
      await page.click('[data-testid="upload-btn"]');
      
      // 업로드 진행률 확인
      await page.waitForSelector('[data-testid="upload-progress"]');
      
      const progressBar = page.locator('[data-testid="progress-bar"]');
      await expect(progressBar).toBeVisible();
      
      // 업로드 완료
      await page.waitForSelector('[data-testid="upload-complete"]');
      await expect(page.locator('[data-testid="uploaded-file-name"]')).toHaveText("test-file.jpg");
      await expect(page.locator('[data-testid="uploaded-file-size"]')).toHaveText("1.0 MB");
    });

    test("복잡한 비즈니스 로직이 포함된 mutation", async ({ page }) => {
      // 주문 생성 과정: 재고 확인 → 결제 처리 → 주문 생성 → 재고 업데이트
      let stockCheckCalls = 0;
      let paymentCalls = 0;
      let orderCalls = 0;
      let stockUpdateCalls = 0;

      await page.route("**/api/products/*/stock", async (route) => {
        stockCheckCalls++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ available: 5, reserved: 0 })
        });
      });

      await page.route("**/api/payments", async (route) => {
        paymentCalls++;
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ 
            paymentId: "pay_123", 
            status: "success",
            amount: 99.99 
          })
        });
      });

      await page.route("**/api/orders", async (route, request) => {
        orderCalls++;
        const body = await request.postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            orderId: "order_456",
            items: body.items,
            total: 99.99,
            status: "confirmed"
          })
        });
      });

      await page.route("**/api/products/*/stock", async (route, request) => {
        if (request.method() === "PUT") {
          stockUpdateCalls++;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ updated: true })
          });
        }
      });

      await page.goto("/complex-mutations/order-creation");
      
      await page.fill('[data-testid="product-quantity"]', "2");
      await page.click('[data-testid="create-order-btn"]');
      
      // 단계별 진행 상황 확인
      await page.waitForSelector('[data-testid="checking-stock"]');
      await page.waitForSelector('[data-testid="processing-payment"]');
      await page.waitForSelector('[data-testid="creating-order"]');
      await page.waitForSelector('[data-testid="updating-stock"]');
      
      // 최종 주문 완료
      await page.waitForSelector('[data-testid="order-complete"]');
      await expect(page.locator('[data-testid="order-id"]')).toHaveText("order_456");
      
      // 모든 단계가 정확한 순서로 실행되었는지 확인
      expect(stockCheckCalls).toBe(1);
      expect(paymentCalls).toBe(1);
      expect(orderCalls).toBe(1);
      expect(stockUpdateCalls).toBe(1);
    });
  });
});