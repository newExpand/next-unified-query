import { test, expect } from "@playwright/test";

/**
 * 실제 사용 시나리오 기반 통합 테스트
 * 
 * 단위 테스트에서는 검증하기 어려운 실제 브라우저 환경에서의
 * 캐시 동작, 네트워크 조건, 사용자 상호작용을 테스트합니다.
 */

test.describe("Real-world Query Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    // 캐시 초기화
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("사용자 목록 조회 → 상세 페이지 → 뒤로가기 시 캐시 재사용", async ({ page }) => {
    // 1. 사용자 목록 페이지 방문
    await page.goto("/users");
    
    // 사용자 목록 로딩 대기
    await page.waitForSelector('[data-testid="users-list"]');
    const usersList = page.locator('[data-testid="users-list"]');
    await expect(usersList).toBeVisible();
    
    // 첫 번째 사용자 클릭
    const firstUser = page.locator('[data-testid^="user-item-"]').first();
    await firstUser.click();
    
    // 2. 사용자 상세 페이지로 이동
    await page.waitForSelector('[data-testid="user-detail"]');
    const userDetail = page.locator('[data-testid="user-detail"]');
    await expect(userDetail).toBeVisible();
    
    // 3. 브라우저 뒤로가기
    await page.goBack();
    
    // 4. 사용자 목록이 즉시 표시되는지 확인 (캐시에서 로드)
    await expect(usersList).toBeVisible();
    
    // 네트워크 요청이 다시 발생하지 않았는지 확인하기 위해
    // 로딩 상태가 나타나지 않아야 함
    const loadingIndicator = page.locator('[data-testid="loading"]');
    await expect(loadingIndicator).not.toBeVisible();
  });

  test("동시 여러 탭에서 같은 쿼리 사용 시 상태 동기화", async ({ context }) => {
    // 첫 번째 탭에서 데이터 로드
    const page1 = await context.newPage();
    await page1.goto("/users/1");
    await page1.waitForSelector('[data-testid="user-detail"]');
    
    const userName1 = await page1.locator('[data-testid="user-name"]').textContent();
    
    // 두 번째 탭에서 같은 사용자 페이지 오픈
    const page2 = await context.newPage();
    await page2.goto("/users/1");
    
    // 두 번째 탭에서도 즉시 데이터가 표시되어야 함 (캐시 공유)
    await page2.waitForSelector('[data-testid="user-detail"]');
    const userName2 = await page2.locator('[data-testid="user-name"]').textContent();
    
    expect(userName1).toBe(userName2);
    
    // 첫 번째 탭에서 데이터 갱신 (mutation)
    await page1.click('[data-testid="edit-user-btn"]');
    await page1.fill('[data-testid="user-name-input"]', "Updated Name");
    await page1.click('[data-testid="save-btn"]');
    
    // 두 번째 탭에서도 업데이트된 데이터가 반영되어야 함
    await expect(page2.locator('[data-testid="user-name"]')).toHaveText("Updated Name");
    
    await page1.close();
    await page2.close();
  });

  test("페이지네이션과 무한 스크롤 시나리오", async ({ page }) => {
    await page.goto("/posts");
    
    // 첫 페이지 로드
    await page.waitForSelector('[data-testid="posts-list"]');
    const initialPosts = await page.locator('[data-testid^="post-item-"]').count();
    expect(initialPosts).toBeGreaterThan(0);
    
    // 스크롤하여 다음 페이지 로드
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // 추가 포스트가 로드될 때까지 대기
    await page.waitForFunction(() => {
      const posts = document.querySelectorAll('[data-testid^="post-item-"]');
      return posts.length > 10; // 첫 페이지보다 많은 포스트
    });
    
    const totalPosts = await page.locator('[data-testid^="post-item-"]').count();
    expect(totalPosts).toBeGreaterThan(initialPosts);
    
    // 특정 포스트 클릭 후 뒤로가기
    const randomPost = page.locator('[data-testid^="post-item-"]').nth(5);
    await randomPost.click();
    
    await page.waitForSelector('[data-testid="post-detail"]');
    await page.goBack();
    
    // 스크롤 위치와 로드된 포스트들이 유지되어야 함
    const restoredPosts = await page.locator('[data-testid^="post-item-"]').count();
    expect(restoredPosts).toBe(totalPosts);
  });

  test("네트워크 지연 상황에서의 UX", async ({ page }) => {
    // 네트워크 지연 시뮬레이션
    await page.route("**/api/**", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 지연
      await route.continue();
    });
    
    await page.goto("/users");
    
    // 로딩 상태가 표시되어야 함
    const loadingIndicator = page.locator('[data-testid="loading"]');
    await expect(loadingIndicator).toBeVisible();
    
    // 2초 후 데이터가 로드되어야 함
    await page.waitForSelector('[data-testid="users-list"]', { timeout: 5000 });
    await expect(loadingIndicator).not.toBeVisible();
    
    // 같은 페이지 재방문 시 캐시에서 즉시 로드되어야 함
    await page.reload();
    await expect(page.locator('[data-testid="users-list"]')).toBeVisible();
    await expect(loadingIndicator).not.toBeVisible();
  });

  test("오프라인에서 온라인으로 전환 시 자동 재시도", async ({ page, context }) => {
    await page.goto("/users");
    await page.waitForSelector('[data-testid="users-list"]');
    
    // 오프라인 모드로 전환
    await context.setOffline(true);
    
    // 새로운 데이터 요청 (실패해야 함)
    await page.click('[data-testid="refresh-btn"]');
    
    // 에러 상태가 표시되어야 함
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    
    // 온라인 모드로 복구
    await context.setOffline(false);
    
    // 자동 재시도 또는 수동 재시도 버튼 클릭
    await page.click('[data-testid="retry-btn"]');
    
    // 데이터가 정상적으로 로드되어야 함
    await expect(errorMessage).not.toBeVisible();
    await expect(page.locator('[data-testid="users-list"]')).toBeVisible();
  });

  test("optimistic update 시나리오", async ({ page }) => {
    await page.goto("/users/1");
    await page.waitForSelector('[data-testid="user-detail"]');
    
    const originalName = await page.locator('[data-testid="user-name"]').textContent();
    
    // 편집 모드로 전환
    await page.click('[data-testid="edit-user-btn"]');
    
    // 이름 변경 및 저장
    const newName = "Optimistically Updated Name";
    await page.fill('[data-testid="user-name-input"]', newName);
    
    // 네트워크 지연 시뮬레이션 (mutation)
    await page.route("**/api/users/**", async (route) => {
      if (route.request().method() === "PUT") {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 지연
      }
      await route.continue();
    });
    
    await page.click('[data-testid="save-btn"]');
    
    // Optimistic update로 즉시 UI가 업데이트되어야 함
    await expect(page.locator('[data-testid="user-name"]')).toHaveText(newName);
    
    // 로딩 상태는 표시되지만 데이터는 이미 업데이트됨
    const savingIndicator = page.locator('[data-testid="saving"]');
    await expect(savingIndicator).toBeVisible();
    
    // 3초 후 저장 완료
    await expect(savingIndicator).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="user-name"]')).toHaveText(newName);
  });

  test("staleTime 동작 검증", async ({ page }) => {
    // staleTime이 짧은 쿼리 테스트 (Client Component)
    await page.goto("/client-stale-test"); // staleTime: 5초 설정된 클라이언트 페이지
    await page.waitForSelector('[data-testid="client-data"]');
    
    const initialData = await page.locator('[data-testid="data-timestamp"]').textContent();
    
    // 3초 대기 (staleTime 내)
    await page.waitForTimeout(3000);
    
    // 페이지 새로고침
    await page.reload();
    
    // 캐시에서 로드되어 timestamp가 동일해야 함
    await page.waitForSelector('[data-testid="client-data"]');
    const cachedData = await page.locator('[data-testid="data-timestamp"]').textContent();
    expect(cachedData).toBe(initialData);
    
    // 7초 더 대기 (staleTime 초과)
    await page.waitForTimeout(7000);
    
    // 페이지 새로고침
    await page.reload();
    
    // 새로운 데이터가 fetch되어 timestamp가 달라야 함
    await page.waitForSelector('[data-testid="client-data"]');
    const freshData = await page.locator('[data-testid="data-timestamp"]').textContent();
    expect(freshData).not.toBe(initialData);
  });
});

test.describe("Error Handling Scenarios", () => {
  test("API 에러 후 재시도 성공 시나리오", async ({ page }) => {
    let requestCount = 0;
    
    // 첫 번째 요청은 실패, 두 번째부터 성공
    await page.route("**/api/users/**", async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal Server Error" })
        });
      } else {
        await route.continue();
      }
    });
    
    await page.goto("/users");
    
    // 에러 상태 표시
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    
    // 재시도 버튼 클릭
    await page.click('[data-testid="retry-btn"]');
    
    // 성공적으로 데이터 로드
    await page.waitForSelector('[data-testid="users-list"]');
    await expect(errorMessage).not.toBeVisible();
  });

  test("부분적 데이터 로드 실패 처리", async ({ page }) => {
    // 일부 API만 실패하도록 설정
    await page.route("**/api/users/1/posts**", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "Posts not found" })
      });
    });
    
    await page.goto("/users/1");
    
    // 사용자 정보는 로드되어야 함
    await page.waitForSelector('[data-testid="user-detail"]');
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    
    // 포스트 섹션에는 에러 메시지가 표시되어야 함
    const postsError = page.locator('[data-testid="posts-error"]');
    await expect(postsError).toBeVisible();
    
    // 다른 섹션들은 정상 동작해야 함
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });
});