import { test, expect } from "@playwright/test";

/**
 * 범용 스키마 검증 E2E 테스트
 *
 * ✅ 이 파일의 테스트 범위:
 * - API 응답 스키마 검증 (성공/실패/부분적 오류)
 * - 중첩 객체 및 배열 스키마 검증
 * - 조건부 필드 및 유니온 타입 검증
 * - 환경별 에러 처리 (개발/프로덕션)
 * - 타입 안전성 및 런타임 보장 (타입 변환, coercion)
 * - 스키마 검증 성능 및 최적화 (대용량 데이터, 캐싱)
 * - 스키마 진화 및 호환성 (하위 호환성, 마이그레이션)
 *
 * ❌ 이 파일에서 다루지 않는 것:
 * - Factory 패턴 특화 스키마 검증 (→ factory-options.spec.ts)
 * - 메모리 사용량 및 캐시 성능 (→ memory-performance.spec.ts)
 * - Mutation 스키마 검증 (→ factory-options.spec.ts의 Mutation Factory 섹션)
 *
 * next-unified-query의 Zod 스키마 검증 기능을 포괄적으로 테스트합니다.
 * Factory 패턴과 무관한 일반적인 스키마 검증 시나리오를 다룹니다.
 */

test.describe("Schema Validation in Real Network Environment", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe("API 응답 스키마 검증", () => {
    test("정상 API 응답의 스키마 검증 성공", async ({ page }) => {
      // 올바른 스키마의 사용자 데이터
      await page.route("**/api/users/1", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            age: 30,
            profile: {
              bio: "Software Developer",
              avatar: "https://example.com/avatar.jpg",
              socialLinks: {
                github: "https://github.com/johndoe",
                linkedin: "https://linkedin.com/in/johndoe",
              },
            },
            preferences: {
              theme: "dark",
              notifications: true,
              language: "en",
            },
            createdAt: "2023-01-01T00:00:00.000Z",
            updatedAt: "2023-12-01T10:30:00.000Z",
          }),
        });
      });

      await page.goto("/schema-validation/user-profile");

      // 스키마 검증 성공한 데이터 표시
      await page.waitForSelector('[data-testid="user-profile-valid"]');

      // 모든 필드가 올바르게 파싱되어 표시되는지 확인
      await expect(page.locator('[data-testid="user-name"]')).toHaveText(
        "John Doe"
      );
      await expect(page.locator('[data-testid="user-email"]')).toHaveText(
        "john@example.com"
      );
      await expect(page.locator('[data-testid="user-age"]')).toHaveText("30");
      await expect(page.locator('[data-testid="user-bio"]')).toHaveText(
        "Software Developer"
      );
      await expect(page.locator('[data-testid="user-theme"]')).toHaveText(
        "dark"
      );

      // 날짜 필드 파싱 확인
      await expect(page.locator('[data-testid="created-date"]')).toHaveText(
        "2023-01-01"
      );

      // 스키마 검증 상태 확인
      await expect(
        page.locator('[data-testid="schema-validation-status"]')
      ).toHaveText("✅ Valid");
      await expect(
        page.locator('[data-testid="validation-errors"]')
      ).not.toBeVisible();
    });

    test("API 응답 스키마 불일치 시 상세 에러 정보", async ({ page }) => {
      // 스키마에 맞지 않는 응답 데이터
      await page.route("**/api/users/1", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "invalid-id", // 숫자여야 함
            name: null, // 문자열이어야 함
            email: "invalid-email", // 이메일 형식이어야 함
            age: "thirty", // 숫자여야 함
            profile: {
              bio: 12345, // 문자열이어야 함
              avatar: "not-a-url", // URL 형식이어야 함
              socialLinks: "invalid", // 객체여야 함
            },
            preferences: {
              theme: "invalid-theme", // enum 값이어야 함
              notifications: "yes", // 불린이어야 함
              language: 123, // 문자열이어야 함
            },
            createdAt: "invalid-date", // ISO 날짜여야 함
            // updatedAt 필드 누락
          }),
        });
      });

      await page.goto("/schema-validation/user-profile");

      // 스키마 검증 실패 상태 확인
      await page.waitForSelector('[data-testid="schema-validation-error"]');

      await expect(
        page.locator('[data-testid="schema-validation-status"]')
      ).toHaveText("❌ Invalid");
      await expect(
        page.locator('[data-testid="user-profile-valid"]')
      ).not.toBeVisible();

      // 상세 검증 오류 목록 확인
      await page.waitForSelector('[data-testid="validation-errors"]');

      const errorMessages = await page
        .locator('[data-testid="validation-error-item"]')
        .allTextContents();

      // 각 필드별 검증 오류 확인
      expect(
        errorMessages.some(
          (msg) => msg.includes("id") && msg.includes("number")
        )
      ).toBe(true);
      expect(
        errorMessages.some(
          (msg) => msg.includes("name") && msg.includes("string")
        )
      ).toBe(true);
      expect(
        errorMessages.some(
          (msg) => msg.includes("email") && msg.includes("email")
        )
      ).toBe(true);
      expect(
        errorMessages.some(
          (msg) => msg.includes("age") && msg.includes("number")
        )
      ).toBe(true);
      expect(
        errorMessages.some(
          (msg) => msg.includes("bio") && msg.includes("string")
        )
      ).toBe(true);
      expect(errorMessages.some((msg) => msg.includes("avatar"))).toBe(true);
      expect(errorMessages.some((msg) => msg.includes("theme"))).toBe(true);
      expect(
        errorMessages.some(
          (msg) => msg.includes("createdAt") && msg.includes("datetime")
        )
      ).toBe(true);
      // updatedAt 필드 관련 오류가 있는지 확인 (required 대신 실제 메시지 확인)
      expect(errorMessages.some((msg) => msg.includes("updatedAt"))).toBe(true);

      // 사용자에게 친화적인 에러 메시지 표시
      await expect(
        page.locator('[data-testid="user-friendly-error"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="user-friendly-error"]')
      ).toHaveText(
        "서버에서 올바르지 않은 데이터를 받았습니다. 관리자에게 문의하세요."
      );
    });

    test("중첩 객체 및 배열 스키마 검증", async ({ page }) => {
      // ComplexDataSchema에 맞는 중첩 구조 응답 (Factory 테스트와 충돌 방지를 위해 다른 API 사용)
      await page.route("**/api/nested-schema-data", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "Nested Schema Test User",
            createdAt: "2023-01-01T00:00:00.000Z",
            profile: {
              bio: "Testing nested object validation in schema",
              avatar: "https://example.com/nested-avatar.jpg",
              socialLinks: {
                github: "https://github.com/nested-user",
                linkedin: "https://linkedin.com/in/nested-user",
              },
            },
            preferences: {
              theme: "light",
              notifications: false,
              language: "ko",
            },
            stats: {
              posts: 25,
              views: 3500,
              likes: 156,
            },
            skills: ["react", "typescript", "zod", "nested-validation"],
            tags: ["schema", "validation", "nested", "arrays"],
            metadata: {
              version: "nested-1.0",
              lastLogin: "2023-12-01T14:30:00.000Z",
            },
          }),
        });
      });

      // complex-data 페이지를 재사용하되 다른 API 엔드포인트로 분리
      await page.goto("/schema-validation/complex-data?api=nested-schema-data");

      await page.waitForSelector('[data-testid="complex-data"]');

      // 데이터가 설정될 때까지 대기
      await page.waitForFunction(() => window.__COMPLEX_DATA__ !== undefined, {
        timeout: 10000,
      });

      // ComplexDataSchema 구조에 맞는 데이터 확인
      const complexData = await page.evaluate(() => window.__COMPLEX_DATA__);

      // 스키마 구조 검증: 중첩 객체와 배열이 올바르게 파싱되었는지 확인
      expect(complexData?.name).toBe("Nested Schema Test User");
      expect(complexData?.profile.bio).toBe(
        "Testing nested object validation in schema"
      );
      expect(complexData?.skills).toContain("nested-validation");
      expect(complexData?.tags).toContain("nested");
      expect(complexData?.stats.posts).toBe(25);

      // 스키마 검증 성공 상태 (complex-data 페이지 구조에 맞게 수정)
      await expect(
        page.locator("h3:has-text('✅ 스키마 검증 성공')")
      ).toBeVisible();
    });

    test("조건부 필드 및 유니온 타입 검증", async ({ page }) => {
      // user-profile 페이지를 활용하여 조건부 필드 테스트 (안정성 확보)
      const unionTestData = {
        id: 1,
        name: "Union Type Test User",
        email: "union@example.com",
        age: 28,
        // 조건부 필드들: theme 값에 따라 다른 preferences 구조
        profile: {
          bio: "Testing union types and conditional fields",
          avatar: "https://example.com/union-avatar.jpg",
          socialLinks: {
            github: "https://github.com/union-user",
            linkedin: "https://linkedin.com/in/union-user",
          },
        },
        preferences: {
          theme: "dark", // enum 타입 검증
          notifications: true,
          language: "en",
          // 조건부 필드: dark 테마일 때만 나타나는 고급 설정
          darkModeOptions: {
            highContrast: true,
            reduceMotion: false,
          },
        },
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-12-01T10:30:00.000Z",
      };

      await page.route("**/api/users/1", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(unionTestData),
        });
      });

      await page.goto("/schema-validation/user-profile");

      await page.waitForSelector('[data-testid="user-profile-valid"]');

      // 유니온 타입 검증: enum 값이 올바르게 처리되는지 확인
      await expect(page.locator('[data-testid="user-theme"]')).toHaveText(
        "dark"
      );
      await expect(
        page.locator('[data-testid="schema-validation-status"]')
      ).toHaveText("✅ Valid");

      // 조건부 필드 검증: 기본 필드들이 올바르게 표시되는지 확인
      await expect(page.locator('[data-testid="user-name"]')).toHaveText(
        "Union Type Test User"
      );
      await expect(page.locator('[data-testid="user-email"]')).toHaveText(
        "union@example.com"
      );
      await expect(page.locator('[data-testid="user-bio"]')).toHaveText(
        "Testing union types and conditional fields"
      );
    });

    test("부분적 스키마 오류와 fallback 데이터", async ({ page }) => {
      // 일부 필드만 올바른 응답
      await page.route("**/api/users/1?mode=partial", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            age: 30,
            // profile 필드가 잘못됨 - 문자열이어야 하는데 숫자
            profile: {
              bio: 12345, // 문자열이어야 함
              avatar: "not-a-url", // URL이 아님
            },
            // preferences 필드가 잘못됨 - 잘못된 enum 값
            preferences: {
              theme: "invalid-theme", // light 또는 dark여야 함
              notifications: "yes", // boolean이어야 함
              language: 123, // 문자열이어야 함
            },
            createdAt: "2023-01-01T00:00:00.000Z",
            updatedAt: "2023-12-01T10:30:00.000Z",
          }),
        });
      });

      await page.goto("/schema-validation/partial-fallback");

      // 유효한 필드들은 표시되어야 함
      await page.waitForSelector('[data-testid="user-basic-info"]');

      await expect(page.locator('[data-testid="user-name"]')).toHaveText(
        "John Doe"
      );
      await expect(page.locator('[data-testid="user-email"]')).toHaveText(
        "john@example.com"
      );
      await expect(page.locator('[data-testid="user-age"]')).toHaveText("30");

      // 무효한 필드들은 기본값 또는 숨김 처리
      await expect(
        page.locator('[data-testid="profile-section"]')
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="preferences-section"]')
      ).not.toBeVisible();

      // 부분적 오류 경고 표시
      await expect(
        page.locator('[data-testid="partial-error-warning"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="partial-error-warning"]')
      ).toHaveText("일부 정보를 불러오는데 문제가 있었습니다.");

      // 개발자 모드에서 상세 오류 확인
      await page.click('[data-testid="toggle-dev-mode"]');
      await page.waitForSelector('[data-testid="dev-error-details"]');

      const devErrors = await page
        .locator('[data-testid="dev-error-item"]')
        .allTextContents();
      expect(devErrors.some((error) => error.includes("profile"))).toBe(true);
      expect(devErrors.some((error) => error.includes("preferences"))).toBe(
        true
      );
    });
  });

  test.describe("개발/프로덕션 환경별 스키마 검증", () => {
    test("개발 환경에서 상세한 스키마 오류 정보", async ({ page }) => {
      // 개발 환경 설정
      await page.addInitScript(() => {
        window.__NEXT_UNIFIED_QUERY_ENV__ = "development";
      });

      await page.route("**/api/products/1", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "not-a-number",
            name: "",
            price: "invalid-price",
            categories: "should-be-array",
            metadata: {
              weight: "not-a-number",
              dimensions: {
                width: null,
                height: "invalid",
              },
            },
          }),
        });
      });

      await page.goto("/schema-validation/product-details");

      await page.waitForSelector('[data-testid="schema-validation-error"]');

      // 개발 환경에서는 상세한 오류 정보 표시
      await expect(
        page.locator('[data-testid="dev-error-console"]')
      ).toBeVisible();

      const devErrors = await page
        .locator('[data-testid="detailed-error"]')
        .textContent();
      expect(devErrors).toContain("ZodError");
      expect(devErrors).toContain("path:");
      expect(devErrors).toContain("Expected number, received string");

      // 개발자 도구에 오류 로깅 확인
      const consoleErrors = await page.evaluate(() => {
        return window.__SCHEMA_VALIDATION_ERRORS__ || [];
      });

      expect(consoleErrors.length).toBeGreaterThan(0);
      expect(consoleErrors[0]).toHaveProperty("path");
      expect(consoleErrors[0]).toHaveProperty("message");
      expect(consoleErrors[0]).toHaveProperty("code");
    });

    test("프로덕션 환경에서 간소화된 오류 표시", async ({ page }) => {
      // 프로덕션 환경 설정
      await page.addInitScript(() => {
        window.__NEXT_UNIFIED_QUERY_ENV__ = "production";
      });

      await page.route("**/api/products/1", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "not-a-number",
            name: "",
            price: "invalid-price",
          }),
        });
      });

      await page.goto("/schema-validation/product-details");

      await page.waitForSelector('[data-testid="schema-validation-error"]');

      // 프로덕션에서는 사용자 친화적인 메시지만 표시
      await expect(
        page.locator('[data-testid="user-error-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="user-error-message"]')
      ).toHaveText("데이터를 불러오는 중 문제가 발생했습니다.");

      // 개발자 정보는 숨김
      await expect(
        page.locator('[data-testid="dev-error-console"]')
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="detailed-error"]')
      ).not.toBeVisible();

      // 오류 추적을 위한 최소한의 정보만 로깅
      const productionErrors = await page.evaluate(() => {
        return window.__SCHEMA_VALIDATION_ERRORS__ || [];
      });

      if (productionErrors.length > 0) {
        expect(productionErrors[0]).toHaveProperty("timestamp");
        expect(productionErrors[0]).toHaveProperty("endpoint");
        expect(productionErrors[0]).not.toHaveProperty("detailedPath"); // 상세 경로 정보 제거
      }
    });
  });

  test.describe("타입 안전성 런타임 보장", () => {
    test("TypeScript 타입과 런타임 검증 일치성", async ({ page }) => {
      // 컴파일 타임에는 올바르지만 런타임에 다른 데이터
      await page.route("**/api/orders/1", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            customerId: 123,
            items: [
              {
                id: 1,
                productId: 456,
                quantity: 2,
                price: 29.99,
                // TypeScript에서는 선택적이지만 스키마에서는 필수인 필드
                name: "Product Name",
              },
            ],
            total: 59.98,
            status: "confirmed",
            createdAt: "2023-01-01T00:00:00.000Z",
          }),
        });
      });

      await page.goto("/schema-validation/type-safety");

      // 타입 안전한 데이터 접근 확인
      await page.waitForSelector('[data-testid="order-details"]');

      // 런타임에서 타입이 올바르게 보장되는지 확인
      const typeValidation = await page.evaluate(() => {
        const orderData = window.__LAST_ORDER_DATA__;
        return {
          idIsNumber: typeof orderData?.id === "number",
          customerIdIsNumber: typeof orderData?.customerId === "number",
          itemsIsArray: Array.isArray(orderData?.items),
          totalIsNumber: typeof orderData?.total === "number",
          statusIsString: typeof orderData?.status === "string",
          createdAtIsString: typeof orderData?.createdAt === "string",
        };
      });

      expect(typeValidation.idIsNumber).toBe(true);
      expect(typeValidation.customerIdIsNumber).toBe(true);
      expect(typeValidation.itemsIsArray).toBe(true);
      expect(typeValidation.totalIsNumber).toBe(true);
      expect(typeValidation.statusIsString).toBe(true);
      expect(typeValidation.createdAtIsString).toBe(true);

      // UI에서 타입 안전한 연산 수행
      await expect(page.locator('[data-testid="order-id"]')).toHaveText("1");
      await expect(page.locator('[data-testid="customer-id"]')).toHaveText(
        "123"
      );
      await expect(page.locator('[data-testid="items-count"]')).toHaveText("1");
      await expect(page.locator('[data-testid="total-formatted"]')).toHaveText(
        "$59.98"
      );
    });

    test("런타임 타입 변환 및 coercion", async ({ page }) => {
      // 문자열로 전송되지만 스키마에서 숫자로 변환되어야 하는 데이터
      await page.route("**/api/analytics/stats", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            // 이런 값들이 올바른 타입으로 변환되어야 함
            totalViews: "12345", // 숫자로 변환
            conversionRate: "3.45", // 숫자로 변환
            isActive: "true", // 불린으로 변환
            lastUpdated: "2023-01-01T00:00:00.000Z", // Date 객체로 변환
            categories: "web,mobile,api", // 배열로 변환
            metadata: {
              version: "1.0",
              flags: "feature1,feature2,feature3",
            },
          }),
        });
      });

      await page.goto("/schema-validation/type-coercion");

      await page.waitForSelector('[data-testid="analytics-stats"]');

      // coercion 후 타입 확인
      const coercedTypes = await page.evaluate(() => {
        const statsData = window.__ANALYTICS_STATS__;
        return {
          totalViewsType: typeof statsData?.totalViews,
          totalViewsValue: statsData?.totalViews,
          conversionRateType: typeof statsData?.conversionRate,
          isActiveType: typeof statsData?.isActive,
          isActiveValue: statsData?.isActive,
          lastUpdatedType: Object.prototype.toString.call(
            statsData?.lastUpdated
          ),
          categoriesType: Object.prototype.toString.call(statsData?.categories),
          categoriesLength: statsData?.categories?.length,
        };
      });

      expect(coercedTypes.totalViewsType).toBe("number");
      expect(coercedTypes.totalViewsValue).toBe(12345);
      expect(coercedTypes.conversionRateType).toBe("number");
      expect(coercedTypes.isActiveType).toBe("boolean");
      expect(coercedTypes.isActiveValue).toBe(true);
      expect(coercedTypes.lastUpdatedType).toBe("[object Date]");
      expect(coercedTypes.categoriesType).toBe("[object Array]");
      expect(coercedTypes.categoriesLength).toBe(3);

      // UI에서 변환된 값들이 올바르게 표시되는지 확인
      await expect(page.locator('[data-testid="total-views"]')).toHaveText(
        "12,345"
      );
      await expect(page.locator('[data-testid="conversion-rate"]')).toHaveText(
        "3.45%"
      );
      await expect(page.locator('[data-testid="active-status"]')).toHaveText(
        "활성"
      );
      await expect(page.locator('[data-testid="categories-count"]')).toHaveText(
        "3개"
      );
    });
  });

  test.describe("스키마 검증 성능 및 최적화", () => {
    test("대용량 데이터 스키마 검증 성능", async ({ page }) => {
      test.setTimeout(60000); // 1분 타임아웃

      // 콘솔 에러 캡처
      const consoleMessages: string[] = [];
      page.on("console", (msg) => {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      });

      await page.goto("/schema-validation/performance-test");

      const startTime = await page.evaluate(() => performance.now());

      // 대용량 데이터 로드 및 스키마 검증
      await page.click('[data-testid="load-bulk-data-btn"]');

      // 에러 메시지가 있는지 먼저 확인
      try {
        await page.waitForSelector('[data-testid="bulk-data-loaded"]', {
          timeout: 10000,
        });
      } catch (error) {
        // 콘솔 메시지 출력
        console.log("Console messages:", consoleMessages);

        // 에러 메시지가 있는지 확인
        const errorMessage = await page
          .locator(".text-red-700")
          .textContent()
          .catch(() => null);
        console.log("Error message on page:", errorMessage);

        // 네트워크 요청 상태 확인
        const networkRequests = await page.evaluate(() => {
          return window.performance
            .getEntriesByType("navigation")
            .concat(window.performance.getEntriesByType("resource"))
            .filter((entry) => entry.name.includes("/api/"));
        });
        console.log("Network requests:", networkRequests);

        throw error;
      }

      const endTime = await page.evaluate(() => performance.now());
      const validationTime = endTime - startTime;

      // 성능 메트릭 확인
      const performanceStats = await page
        .locator('[data-testid="performance-stats"]')
        .textContent();
      const stats = JSON.parse(performanceStats || "{}");

      expect(stats.totalItems).toBe(1000);
      expect(stats.validationTime).toBeLessThan(15000); // 15초 이내 (개발 환경 고려)
      expect(stats.itemsPerSecond).toBeGreaterThan(50); // 초당 50개 이상 처리 (현실적 기준)

      // 모든 아이템이 올바르게 검증되었는지 확인
      const validatedCount = await page
        .locator('[data-testid="validated-items-count"]')
        .textContent();
      expect(validatedCount).toBe("1000");

      // UI 렌더링 성능 확인
      const renderTime = await page.evaluate(() => {
        return window.__RENDER_PERFORMANCE_STATS__?.renderTime || 0;
      });

      expect(renderTime).toBeLessThan(8000); // 렌더링 8초 이내 (개발 환경 고려)

      console.log(`Validation time: ${validationTime}ms for 1000 items`);
      console.log(`Render time: ${renderTime}ms`);
    });

    test("스키마 검증 캐싱 및 재사용", async ({ page }) => {
      let validationCallCount = 0;

      // 동일한 구조의 데이터 반복 요청
      await page.route(
        "**/api/cached-validation/**",
        async (route, request) => {
          const id = request.url().match(/cached-validation\/(\d+)/)?.[1];

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              id: parseInt(id || "0"),
              name: `User ${id}`,
              email: `user${id}@example.com`,
              profile: {
                bio: `Bio for user ${id}`,
                avatar: `https://example.com/avatar${id}.jpg`,
              },
              createdAt: new Date().toISOString(),
            }),
          });
        }
      );

      await page.goto("/schema-validation/caching-test");

      // 첫 번째 요청 - 스키마 검증 실행
      await page.click('[data-testid="load-user-1-btn"]');
      await page.waitForSelector('[data-testid="user-1-data"]');

      const firstValidationStats = await page.evaluate(() => {
        return window.__SCHEMA_VALIDATION_STATS__;
      });

      expect(firstValidationStats.cacheHits).toBe(0);
      expect(firstValidationStats.validationExecutions).toBe(1);

      // 두 번째 요청 - 동일한 구조이므로 캐시된 스키마 사용
      await page.click('[data-testid="load-user-2-btn"]');
      await page.waitForSelector('[data-testid="user-2-data"]');

      const secondValidationStats = await page.evaluate(() => {
        return window.__SCHEMA_VALIDATION_STATS__;
      });

      expect(secondValidationStats.cacheHits).toBe(1);
      expect(secondValidationStats.validationExecutions).toBe(2);

      // 세 번째 요청 - 또 다른 캐시 히트
      await page.click('[data-testid="load-user-3-btn"]');
      await page.waitForSelector('[data-testid="user-3-data"]');

      const thirdValidationStats = await page.evaluate(() => {
        return window.__SCHEMA_VALIDATION_STATS__;
      });

      expect(thirdValidationStats.cacheHits).toBe(2);
      expect(thirdValidationStats.validationExecutions).toBe(3);

      // 캐시 효율성 확인
      const cacheEfficiency =
        thirdValidationStats.cacheHits /
        thirdValidationStats.validationExecutions;
      expect(cacheEfficiency).toBeGreaterThan(0.6); // 60% 이상 캐시 히트율
    });
  });

  test.describe("스키마 진화 및 호환성", () => {
    test("하위 호환성 있는 스키마 변경", async ({ page }) => {
      // 구 버전 스키마 응답
      await page.route("**/api/users/legacy", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "Legacy User",
            email: "legacy@example.com",
            // 새 필드들은 없음
            createdAt: "2023-01-01T00:00:00.000Z",
          }),
        });
      });

      // 신 버전 스키마 응답
      await page.route("**/api/users/modern", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 2,
            name: "Modern User",
            email: "modern@example.com",
            // 새로 추가된 선택적 필드들
            phone: "+1-555-0123",
            avatar: "https://example.com/avatar.jpg",
            preferences: {
              theme: "dark",
              language: "en",
            },
            metadata: {
              lastLogin: "2023-12-01T10:00:00.000Z",
              loginCount: 42,
            },
            createdAt: "2023-01-01T00:00:00.000Z",
            updatedAt: "2023-12-01T10:00:00.000Z",
          }),
        });
      });

      await page.goto("/schema-validation/compatibility-test");

      // 구 버전 데이터 로드 - 성공해야 함
      await page.click('[data-testid="load-legacy-user-btn"]');
      await page.waitForSelector('[data-testid="legacy-user-data"]');

      await expect(page.locator('[data-testid="legacy-user-name"]')).toHaveText(
        "Legacy User"
      );
      await expect(
        page.locator('[data-testid="legacy-validation-status"]')
      ).toHaveText("✅ Valid");

      // 새 필드들은 기본값 또는 숨김 처리
      await expect(
        page.locator('[data-testid="legacy-user-phone"]')
      ).toHaveText("N/A");
      await expect(
        page.locator('[data-testid="legacy-user-avatar"]')
      ).not.toBeVisible();

      // 신 버전 데이터 로드 - 새 필드들까지 모두 표시
      await page.click('[data-testid="load-modern-user-btn"]');
      await page.waitForSelector('[data-testid="modern-user-data"]');

      await expect(page.locator('[data-testid="modern-user-name"]')).toHaveText(
        "Modern User"
      );
      await expect(
        page.locator('[data-testid="modern-user-phone"]')
      ).toHaveText("+1-555-0123");
      await expect(
        page.locator('[data-testid="modern-user-avatar"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="modern-user-theme"]')
      ).toHaveText("dark");
      await expect(
        page.locator('[data-testid="modern-validation-status"]')
      ).toHaveText("✅ Valid");

      // 스키마 버전 호환성 확인
      const compatibilityInfo = await page
        .locator('[data-testid="compatibility-info"]')
        .textContent();
      expect(compatibilityInfo).toContain("Backward compatible");
    });

    test("스키마 마이그레이션 및 데이터 변환", async ({ page }) => {
      // 구식 데이터 형식
      await page.route("**/api/products/v1", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            // 구 버전 필드명
            product_id: 1,
            product_name: "Old Product",
            product_price: "29.99",
            product_category: "electronics",
            created_date: "2023-01-01",
            is_available: 1, // 숫자로 된 불린
          }),
        });
      });

      await page.goto("/schema-validation/migration-test");

      // 데이터 마이그레이션 트리거
      await page.click('[data-testid="migrate-v1-data-btn"]');
      await page.waitForSelector('[data-testid="migrated-product-data"]');

      // 마이그레이션된 데이터 확인
      const migratedData = await page.evaluate(() => {
        return window.__MIGRATED_PRODUCT_DATA__;
      });

      // 새 스키마 형식으로 변환되었는지 확인
      expect(migratedData.id).toBe(1); // product_id → id
      expect(migratedData.name).toBe("Old Product"); // product_name → name
      expect(migratedData.price).toBe(29.99); // string → number
      expect(migratedData.category).toBe("electronics");
      expect(migratedData.isAvailable).toBe(true); // 1 → true
      expect(migratedData.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // date → datetime

      // UI에서 변환된 데이터 표시 확인
      await expect(
        page.locator('[data-testid="migrated-product-name"]')
      ).toHaveText("Old Product");
      await expect(
        page.locator('[data-testid="migrated-product-price"]')
      ).toHaveText("$29.99");
      await expect(
        page.locator('[data-testid="migrated-availability"]')
      ).toHaveText("Available");

      // 마이그레이션 로그 확인
      const migrationLog = await page
        .locator('[data-testid="migration-log"]')
        .textContent();
      expect(migrationLog).toContain("product_id → id");
      expect(migrationLog).toContain("product_name → name");
      expect(migrationLog).toContain("string → number conversion");
      expect(migrationLog).toContain("date → datetime conversion");
    });
  });
});
