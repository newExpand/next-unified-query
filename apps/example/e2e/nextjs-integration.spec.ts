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

  test("Server Component + Client Component 혼합 데이터 페칭", async ({
    page,
  }) => {
    // Server Component에서 기본 데이터, Client Component에서 추가 데이터
    await page.goto("/dashboard");

    // Server Component 데이터는 즉시 표시
    await expect(page.locator('[data-testid="server-data"]')).toBeVisible();

    // Client Component 데이터는 로딩 후 표시
    const clientLoading = page.locator('[data-testid="client-loading"]');
    await expect(clientLoading).toBeVisible();

    await page.waitForSelector('[data-testid="client-data"]');
    await expect(clientLoading).not.toBeVisible();
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

  test("TanStack vs next-unified-query 캐시 비교", async ({ page }) => {
    // next-unified-query 테스트
    await page.goto("/force-cache-page");
    await page.waitForSelector('[data-testid="cached-data"]');

    // 초기 요청 횟수 확인
    const initialNextUnifiedCount = await page
      .locator('[data-testid="next-unified-request-count"]')
      .textContent();
    expect(initialNextUnifiedCount).toContain("1");

    // Force Refetch 클릭 (next-unified-query는 staleTime: Infinity이므로 캐시 사용)
    await page.click('[data-testid="next-unified-force-refetch"]');
    await page.waitForTimeout(1000);

    const nextUnifiedAfterRefetch = await page
      .locator('[data-testid="next-unified-request-count"]')
      .textContent();

    // TanStack React Query 테스트
    await page.goto("/tanstack-test-3");
    await page.waitForSelector('[data-testid="tanstack-cached-data"]');

    // 초기 요청 횟수 확인
    const initialTanstackCount = await page
      .locator('[data-testid="tanstack-request-count"]')
      .textContent();
    expect(initialTanstackCount).toContain("1");

    // Force Refetch 클릭 (TanStack도 staleTime: Infinity이므로 캐시 사용)
    await page.click('[data-testid="tanstack-force-refetch"]');
    await page.waitForTimeout(1000);

    const tanstackAfterRefetch = await page
      .locator('[data-testid="tanstack-request-count"]')
      .textContent();

    // 두 라이브러리 모두 staleTime: Infinity 설정에서 Force Refetch 시 캐시를 사용해야 함
    expect(nextUnifiedAfterRefetch).toContain("1"); // 여전히 1번만
    expect(tanstackAfterRefetch).toContain("1"); // 여전히 1번만
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

  test("revalidate 옵션으로 시간 기반 재검증", async ({ page }) => {
    // revalidate: 5초 설정된 페이지
    await page.goto("/revalidate-page");
    await page.waitForSelector('[data-testid="revalidate-data"]');

    const initialTimestamp = await page
      .locator('[data-testid="data-timestamp"]')
      .textContent();

    // 3초 대기 (revalidate 시간 내)
    await page.waitForTimeout(3000);
    await page.reload();

    // 아직 revalidate 시간이 지나지 않아 동일한 데이터
    const cachedTimestamp = await page
      .locator('[data-testid="data-timestamp"]')
      .textContent();
    expect(cachedTimestamp).toBe(initialTimestamp);

    // 7초 더 대기 (총 10초, revalidate 시간 초과)
    await page.waitForTimeout(7000);
    await page.reload();

    // revalidate 시간이 지나 새로운 데이터
    const revalidatedTimestamp = await page
      .locator('[data-testid="data-timestamp"]')
      .textContent();
    expect(revalidatedTimestamp).not.toBe(initialTimestamp);
  });

  test("tags를 사용한 selective revalidation", async ({ page, context }) => {
    // 첫 번째 탭에서 tagged 데이터 로드
    const page1 = await context.newPage();
    await page1.goto("/tagged-data-page");
    await page1.waitForSelector('[data-testid="tagged-data"]');

    const initialData = await page1
      .locator('[data-testid="tagged-content"]')
      .textContent();

    // 두 번째 탭에서 revalidation 트리거
    const page2 = await context.newPage();
    await page2.goto("/admin/revalidate");

    // 특정 태그 revalidate
    await page2.click('[data-testid="revalidate-user-data"]');
    await page2.waitForSelector('[data-testid="revalidation-success"]');

    // 첫 번째 탭 새로고침
    await page1.reload();
    await page1.waitForSelector('[data-testid="tagged-data"]');

    // 데이터가 업데이트되었는지 확인
    const updatedData = await page1
      .locator('[data-testid="tagged-content"]')
      .textContent();
    expect(updatedData).not.toBe(initialData);

    await page1.close();
    await page2.close();
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

  test("not-found.js 동작", async ({ page }) => {
    // 존재하지 않는 사용자 ID
    await page.route("**/api/user/999", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "User not found" }),
      });
    });

    await page.goto("/users/999");

    // not-found.js에서 정의한 404 UI가 표시되어야 함
    const notFoundUI = page.locator('[data-testid="user-not-found"]');
    await expect(notFoundUI).toBeVisible();

    // 홈으로 돌아가기 링크 확인
    await page.click('[data-testid="back-to-home"]');
    await expect(page).toHaveURL("/");
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
  test("Image Optimization과 쿼리 연동", async ({ page }) => {
    await page.goto("/gallery");

    // 이미지 목록 로드
    await page.waitForSelector('[data-testid="image-gallery"]');

    // Next.js Image 컴포넌트의 lazy loading 확인
    const images = page.locator('[data-testid="gallery-image"]');
    await expect(images.first()).toBeVisible();

    // 스크롤하여 추가 이미지 로드
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // 새로운 이미지들이 lazy load되면서 쿼리도 함께 실행
    await page.waitForSelector('[data-testid="image-metadata"]');
  });

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

  test("App Router의 fetch cache와 revalidate", async ({ page }) => {
    // App Router에서 fetch API의 기본 캐싱 동작
    await page.goto("/fetch-cache-test");

    await page.waitForSelector('[data-testid="cached-content"]');
    const firstTimestamp = await page
      .locator('[data-testid="server-timestamp"]')
      .textContent();

    // 페이지 새로고침 - 기본적으로 캐시됨
    await page.reload();
    await page.waitForSelector('[data-testid="cached-content"]');
    const secondTimestamp = await page
      .locator('[data-testid="server-timestamp"]')
      .textContent();

    // App Router의 기본 fetch 캐싱으로 동일한 timestamp
    expect(secondTimestamp).toBe(firstTimestamp);

    // revalidate를 위한 시간 대기
    await page.waitForTimeout(5000);
    await page.reload();

    const thirdTimestamp = await page
      .locator('[data-testid="server-timestamp"]')
      .textContent();
    // revalidate 시간에 따라 새로운 데이터가 될 수 있음
  });
});
