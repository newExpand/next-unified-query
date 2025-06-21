import { test, expect } from "@playwright/test";

/**
 * 기본 네비게이션 및 설정 확인 테스트
 * 복잡한 통합 테스트 실행 전 기본 동작을 확인합니다.
 */

test.describe("Basic Integration Test Setup", () => {
  test("홈페이지가 정상적으로 로드됨", async ({ page }) => {
    await page.goto("/");
    
    // 홈페이지 제목 확인
    await expect(page.locator("h1")).toHaveText("Integration Test Demo");
    
    // 네비게이션 링크들이 표시되는지 확인
    await expect(page.locator('a[href="/users"]')).toBeVisible();
    await expect(page.locator('a[href="/posts"]')).toBeVisible();
    await expect(page.locator('a[href="/client-stale-test"]')).toBeVisible();
  });

  test("사용자 목록 페이지 기본 동작", async ({ page }) => {
    await page.goto("/users");
    
    // 로딩 또는 데이터가 표시될 때까지 대기
    await page.waitForFunction(() => {
      const loading = document.querySelector('[data-testid="loading"]');
      const usersList = document.querySelector('[data-testid="users-list"]');
      return !loading || usersList;
    });
    
    // 사용자 목록이 로드되었는지 확인
    const usersList = page.locator('[data-testid="users-list"]');
    await expect(usersList).toBeVisible();
    
    // 첫 번째 사용자가 표시되는지 확인
    const firstUser = page.locator('[data-testid^="user-item-"]').first();
    await expect(firstUser).toBeVisible();
  });

  test("사용자 상세 페이지 네비게이션", async ({ page }) => {
    await page.goto("/users");
    
    // 사용자 목록 로드 대기
    await page.waitForSelector('[data-testid="users-list"]');
    
    // 첫 번째 사용자 클릭
    const firstUser = page.locator('[data-testid^="user-item-"]').first();
    await firstUser.click();
    
    // 사용자 상세 페이지로 이동 확인
    await page.waitForSelector('[data-testid="user-detail"]');
    
    // 사용자 이름이 표시되는지 확인
    const userName = page.locator('[data-testid="user-name"]');
    await expect(userName).toBeVisible();
    await expect(userName).not.toHaveText("");
  });

  test("API 응답 기본 확인", async ({ page }) => {
    // API 요청 모니터링
    const apiRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/")) {
        apiRequests.push(request.url());
      }
    });
    
    await page.goto("/users");
    await page.waitForSelector('[data-testid="users-list"]');
    
    // API 요청이 발생했는지 확인
    expect(apiRequests.some(url => url.includes("/api/users"))).toBe(true);
  });

  test("클라이언트 사이드 페이지 기본 동작", async ({ page }) => {
    await page.goto("/client-stale-test");
    
    // 페이지가 로드되고 데이터가 표시되는지 확인
    await page.waitForSelector('[data-testid="client-data"]');
    
    // 타임스탬프가 표시되는지 확인
    const timestamp = page.locator('[data-testid="data-timestamp"]');
    await expect(timestamp).toBeVisible();
    await expect(timestamp).not.toHaveText("");
  });
});