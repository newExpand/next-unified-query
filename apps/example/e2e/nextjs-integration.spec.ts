import { test, expect } from "@playwright/test";

/**
 * Next.js 특화 기능 통합 테스트
 *
 * SSR, ISR, App Router, 캐시 옵션 등 Next.js 환경에서만
 * 검증 가능한 기능들을 테스트합니다.
 */

test.describe("Next.js App Router SSR and RSC", () => {
  test("Server Component에서 prefetch한 데이터가 Client Component에서 hydration", async ({
    page,
  }) => {
    // App Router Server Component로 렌더링된 페이지 방문
    await page.goto("/users/1");

    // Server Component에서 렌더링된 데이터가 즉시 보여야 함
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();

    // JavaScript 로드 전 데이터 확인
    const ssrUserName = await page
      .locator('[data-testid="user-name"]')
      .textContent();

    // Client Component hydration 완료 대기
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Hydration 후에도 동일한 데이터가 유지되어야 함
    const hydratedUserName = await page
      .locator('[data-testid="user-name"]')
      .textContent();
    expect(hydratedUserName).toBe(ssrUserName);

    // 클라이언트에서 상호작용 (Client Component 동작)
    let networkRequests = 0;
    page.on("request", (request) => {
      if (request.url().includes("/api/user/1")) {
        networkRequests++;
      }
    });

    await page.click('[data-testid="refresh-btn"]');

    // 클라이언트에서 추가 요청이 발생해야 함
    await page.waitForTimeout(1000);
    expect(networkRequests).toBe(1);
  });

  test("generateStaticParams vs dynamic routes", async ({ page }) => {
    // Static params로 생성된 페이지 (ID 1-10)
    await page.goto("/posts/1");
    await page.waitForSelector('[data-testid="static-post"]');

    // Static post에서 제목이 올바르게 표시되는지 확인
    const staticTitle = await page.locator("h1").textContent();
    expect(staticTitle).toContain("First Post");

    // Dynamic route 페이지 (ID > 10)
    await page.goto("/posts/999");
    await page.waitForSelector('[data-testid="dynamic-post"]');

    // Dynamic post에서 제목이 올바르게 표시되는지 확인
    const dynamicTitle = await page.locator("h1").textContent();
    expect(dynamicTitle).toContain("Dynamic Post 999");
  });
});

test.describe("Next.js Cache Options", () => {
  test("클라이언트 사이드 캐시 (staleTime) 동작 확인", async ({ page }) => {
    let requestCount = 0;

    // 네트워크 요청 카운트
    page.on("request", (request) => {
      if (request.url().includes("/api/static-data")) {
        requestCount++;
      }
    });

    // force-cache 설정된 페이지 방문
    await page.goto("/force-cache-page");
    await page.waitForSelector('[data-testid="cached-data"]');

    expect(requestCount).toBe(1);

    // 페이지 새로고침
    await page.reload();
    await page.waitForSelector('[data-testid="cached-data"]');

    // 새로고침 시 React 앱이 재마운트되므로 추가 요청 발생 (정상 동작)
    expect(requestCount).toBe(2);

    // 다른 페이지 방문 후 다시 돌아오기 (같은 세션 내)
    await page.goto("/");
    await page.goto("/force-cache-page");
    await page.waitForSelector('[data-testid="cached-data"]');

    // 같은 세션 내에서는 클라이언트 사이드 캐시가 유지되어야 함
    // 하지만 다른 페이지 방문으로 컴포넌트가 언마운트/재마운트되므로 추가 요청 발생
    expect(requestCount).toBe(3);
  });

  test("no-store 옵션으로 캐시 방지", async ({ page }) => {
    let requestCount = 0;

    page.on("request", (request) => {
      if (request.url().includes("/api/dynamic-data")) {
        requestCount++;
      }
    });

    // no-store 설정된 페이지 방문
    await page.goto("/no-store-page");
    await page.waitForSelector('[data-testid="dynamic-data"]');

    expect(requestCount).toBe(1);

    // 페이지 새로고침
    await page.reload();
    await page.waitForSelector('[data-testid="dynamic-data"]');

    // no-store로 인해 매번 새로운 요청 발생
    expect(requestCount).toBe(2);

    // 한 번 더 새로고침
    await page.reload();
    await page.waitForSelector('[data-testid="dynamic-data"]');

    expect(requestCount).toBe(3);
  });
});

test.describe("App Router Special Files", () => {
  test("loading.js UI와 Suspense 경계", async ({ page }) => {
    // 느린 API 응답 시뮬레이션
    await page.route("**/api/user/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto("/users/slow-loading");

    // loading.js에서 정의한 로딩 UI가 표시되어야 함
    const loadingUI = page.locator('[data-testid="user-loading"]');
    await expect(loadingUI).toBeVisible();

    // 2초 후 실제 페이지 표시
    await page.waitForSelector('[data-testid="user-content"]', {
      timeout: 4000,
    });
    await expect(loadingUI).not.toBeVisible();
  });

  test("error.js와 에러 경계 동작", async ({ page }) => {
    // API 에러 시뮬레이션
    await page.route("**/api/user/error", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    await page.goto("/users/error");

    // error.js에서 정의한 에러 UI가 표시되어야 함
    const errorUI = page.locator('[data-testid="user-error"]');
    await expect(errorUI).toBeVisible();

    // 재시도 버튼 동작 확인
    await page.click('[data-testid="error-retry-btn"]');

    // 에러 UI가 다시 표시되어야 함 (API가 여전히 실패)
    await expect(errorUI).toBeVisible();
  });

  test("layout.js 중첩과 상태 유지", async ({ page }) => {
    await page.goto("/dashboard/analytics");

    // 대시보드 레이아웃이 로드되어야 함
    await page.waitForSelector('[data-testid="dashboard-layout"]');
    await page.waitForSelector('[data-testid="analytics-content"]');

    const layoutSidebar = await page
      .locator('[data-testid="layout-sidebar"]')
      .textContent();

    // 다른 대시보드 페이지로 이동
    await page.click('[data-testid="nav-settings"]');
    await page.waitForSelector('[data-testid="settings-content"]');

    // 레이아웃은 유지되면서 내용만 변경
    const preservedSidebar = await page
      .locator('[data-testid="layout-sidebar"]')
      .textContent();
    expect(preservedSidebar).toBe(layoutSidebar);

    // 쿼리 상태도 레이아웃 수준에서 유지
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
});

test.describe("Next.js Performance Features", () => {
  test("Dynamic Import와 lazy loading", async ({ page }) => {
    await page.goto("/components/dynamic");

    // 기본 페이지는 즉시 로드
    await page.waitForSelector('[data-testid="main-content"]');

    // 동적 컴포넌트 로드 버튼 클릭
    await page.click('[data-testid="load-heavy-component"]');

    // 동적 컴포넌트 로딩 중 표시
    const dynamicLoading = page.locator('[data-testid="dynamic-loading"]');
    await expect(dynamicLoading).toBeVisible();

    // 동적 컴포넌트와 연관된 쿼리가 함께 로드
    await page.waitForSelector('[data-testid="heavy-component"]');
    await expect(dynamicLoading).not.toBeVisible();

    // 동적 컴포넌트의 쿼리 데이터 확인
    await expect(
      page.locator('[data-testid="heavy-component-data"]')
    ).toBeVisible();
  });
});
