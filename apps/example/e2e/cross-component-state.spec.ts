import { test, expect } from "@playwright/test";

/**
 * 컴포넌트 간 상태 공유 테스트
 * 
 * 여러 컴포넌트가 동일한 쿼리 상태를 공유할 때의 동기화,
 * 업데이트 전파, 최적화된 리렌더링을 검증합니다.
 */

test.describe("Cross-Component State Synchronization", () => {
  test("같은 쿼리키를 사용하는 여러 컴포넌트 간 상태 동기화", async ({ page }) => {
    await page.goto("/state-sharing/multiple-components");
    
    // 3개 컴포넌트가 모두 같은 사용자 데이터를 표시
    await page.waitForSelector('[data-testid="user-card-1"]');
    await page.waitForSelector('[data-testid="user-card-2"]');
    await page.waitForSelector('[data-testid="user-header"]');
    
    // 모든 컴포넌트가 동일한 데이터를 표시하는지 확인
    const userName1 = await page.locator('[data-testid="user-card-1"] [data-testid="user-name"]').textContent();
    const userName2 = await page.locator('[data-testid="user-card-2"] [data-testid="user-name"]').textContent();
    const userNameHeader = await page.locator('[data-testid="user-header"] [data-testid="user-name"]').textContent();
    
    expect(userName1).toBe(userName2);
    expect(userName2).toBe(userNameHeader);
    
    // 한 컴포넌트에서 refresh 트리거
    await page.click('[data-testid="user-card-1"] [data-testid="refresh-btn"]');
    
    // 모든 컴포넌트가 동시에 로딩 상태로 전환
    await expect(page.locator('[data-testid="user-card-1"] [data-testid="loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-card-2"] [data-testid="loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-header"] [data-testid="loading"]')).toBeVisible();
    
    // 로딩 완료 후 모든 컴포넌트가 업데이트된 데이터 표시
    await page.waitForSelector('[data-testid="user-card-1"]:not([data-loading="true"])');
    
    const updatedUserName1 = await page.locator('[data-testid="user-card-1"] [data-testid="user-name"]').textContent();
    const updatedUserName2 = await page.locator('[data-testid="user-card-2"] [data-testid="user-name"]').textContent();
    const updatedUserNameHeader = await page.locator('[data-testid="user-header"] [data-testid="user-name"]').textContent();
    
    expect(updatedUserName1).toBe(updatedUserName2);
    expect(updatedUserName2).toBe(updatedUserNameHeader);
  });

  test("mutation 후 관련 쿼리들의 자동 invalidation", async ({ page }) => {
    await page.goto("/state-sharing/mutation-invalidation");
    
    // 사용자 목록과 개별 사용자 상세 정보가 동시에 표시
    await page.waitForSelector('[data-testid="users-list"]');
    await page.waitForSelector('[data-testid="user-detail"]');
    
    const initialUserCount = await page.locator('[data-testid="users-list"] [data-testid="user-item"]').count();
    const initialUserName = await page.locator('[data-testid="user-detail"] [data-testid="user-name"]').textContent();
    
    // 새 사용자 추가 mutation
    await page.click('[data-testid="add-user-btn"]');
    await page.fill('[data-testid="new-user-name"]', "New Test User");
    await page.click('[data-testid="submit-new-user"]');
    
    // mutation 성공 후 관련 쿼리들이 자동으로 invalidate됨
    await page.waitForSelector('[data-testid="mutation-success"]');
    
    // 사용자 목록이 자동으로 업데이트됨
    await page.waitForFunction((expectedCount) => {
      const userItems = document.querySelectorAll('[data-testid="users-list"] [data-testid="user-item"]');
      return userItems.length > expectedCount;
    }, initialUserCount);
    
    const updatedUserCount = await page.locator('[data-testid="users-list"] [data-testid="user-item"]').count();
    expect(updatedUserCount).toBe(initialUserCount + 1);
    
    // 새로 추가된 사용자가 목록에 포함되었는지 확인
    const newUserInList = page.locator('[data-testid="users-list"]').getByText("New Test User");
    await expect(newUserInList).toBeVisible();
  });

  test("optimistic update와 rollback 시나리오", async ({ page }) => {
    await page.goto("/state-sharing/optimistic-updates");
    
    await page.waitForSelector('[data-testid="post-detail"]');
    await page.waitForSelector('[data-testid="post-summary"]');
    
    const initialLikeCount = await page.locator('[data-testid="like-count"]').first().textContent();
    const initialLikeCountSummary = await page.locator('[data-testid="post-summary"] [data-testid="like-count"]').textContent();
    
    expect(initialLikeCount).toBe(initialLikeCountSummary);
    
    // 네트워크 에러 시뮬레이션
    await page.route("**/api/posts/*/like", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server Error" })
      });
    });
    
    // 좋아요 버튼 클릭 (optimistic update)
    await page.click('[data-testid="like-btn"]');
    
    // 즉시 UI가 업데이트됨 (optimistic)
    const optimisticLikeCount = await page.locator('[data-testid="like-count"]').first().textContent();
    const optimisticLikeCountSummary = await page.locator('[data-testid="post-summary"] [data-testid="like-count"]').textContent();
    
    expect(parseInt(optimisticLikeCount || "0")).toBe(parseInt(initialLikeCount || "0") + 1);
    expect(optimisticLikeCount).toBe(optimisticLikeCountSummary);
    
    // 에러 발생 후 rollback
    await page.waitForSelector('[data-testid="error-message"]');
    
    // 원래 값으로 rollback됨
    const rolledBackLikeCount = await page.locator('[data-testid="like-count"]').first().textContent();
    const rolledBackLikeCountSummary = await page.locator('[data-testid="post-summary"] [data-testid="like-count"]').textContent();
    
    expect(rolledBackLikeCount).toBe(initialLikeCount);
    expect(rolledBackLikeCountSummary).toBe(initialLikeCountSummary);
  });

  test("서로 다른 페이지의 컴포넌트 간 상태 공유", async ({ page, context }) => {
    // 첫 번째 탭에서 사용자 편집
    await page.goto("/users/1/edit");
    await page.waitForSelector('[data-testid="edit-form"]');
    
    const originalName = await page.locator('[data-testid="name-input"]').inputValue();
    
    // 두 번째 탭에서 동일한 사용자 프로필 보기
    const page2 = await context.newPage();
    await page2.goto("/users/1/profile");
    await page2.waitForSelector('[data-testid="user-profile"]');
    
    const profileName = await page2.locator('[data-testid="profile-name"]').textContent();
    expect(profileName).toBe(originalName);
    
    // 첫 번째 탭에서 이름 변경
    const newName = "Updated User Name";
    await page.fill('[data-testid="name-input"]', newName);
    await page.click('[data-testid="save-btn"]');
    await page.waitForSelector('[data-testid="save-success"]');
    
    // 두 번째 탭에서 자동으로 업데이트 확인
    await expect(page2.locator('[data-testid="profile-name"]')).toHaveText(newName);
    
    // 세 번째 탭에서 사용자 목록 보기
    const page3 = await context.newPage();
    await page3.goto("/users");
    await page3.waitForSelector('[data-testid="users-list"]');
    
    // 목록에서도 업데이트된 이름이 표시되어야 함
    const userInList = page3.locator(`[data-testid="user-item-1"] [data-testid="user-name"]`);
    await expect(userInList).toHaveText(newName);
    
    await page2.close();
    await page3.close();
  });

  test("부모-자식 컴포넌트 간 쿼리 상태 전파", async ({ page }) => {
    await page.goto("/state-sharing/parent-child");
    
    await page.waitForSelector('[data-testid="parent-component"]');
    await page.waitForSelector('[data-testid="child-component-1"]');
    await page.waitForSelector('[data-testid="child-component-2"]');
    
    // 부모 컴포넌트에서 쿼리 상태 확인
    const parentStatus = await page.locator('[data-testid="parent-component"] [data-testid="query-status"]').textContent();
    expect(parentStatus).toBe("success");
    
    // 자식 컴포넌트들도 동일한 쿼리 상태를 공유
    const child1Status = await page.locator('[data-testid="child-component-1"] [data-testid="query-status"]').textContent();
    const child2Status = await page.locator('[data-testid="child-component-2"] [data-testid="query-status"]').textContent();
    
    expect(child1Status).toBe("success");
    expect(child2Status).toBe("success");
    
    // 자식 컴포넌트에서 refetch 트리거
    await page.click('[data-testid="child-component-1"] [data-testid="refetch-btn"]');
    
    // 모든 컴포넌트가 동시에 loading 상태로 전환
    await expect(page.locator('[data-testid="parent-component"] [data-testid="query-status"]')).toHaveText("loading");
    await expect(page.locator('[data-testid="child-component-1"] [data-testid="query-status"]')).toHaveText("loading");
    await expect(page.locator('[data-testid="child-component-2"] [data-testid="query-status"]')).toHaveText("loading");
    
    // 로딩 완료 후 모든 컴포넌트가 success 상태로 전환
    await page.waitForFunction(() => {
      const parentStatus = document.querySelector('[data-testid="parent-component"] [data-testid="query-status"]')?.textContent;
      const child1Status = document.querySelector('[data-testid="child-component-1"] [data-testid="query-status"]')?.textContent;
      const child2Status = document.querySelector('[data-testid="child-component-2"] [data-testid="query-status"]')?.textContent;
      
      return parentStatus === "success" && child1Status === "success" && child2Status === "success";
    });
  });

  test("조건부 렌더링 컴포넌트의 쿼리 상태 관리", async ({ page }) => {
    await page.goto("/state-sharing/conditional-rendering");
    
    // 초기에는 탭 1만 표시
    await page.waitForSelector('[data-testid="tab-1-content"]');
    await expect(page.locator('[data-testid="tab-2-content"]')).not.toBeVisible();
    
    // 탭 2로 전환
    await page.click('[data-testid="tab-2-btn"]');
    await page.waitForSelector('[data-testid="tab-2-content"]');
    await expect(page.locator('[data-testid="tab-1-content"]')).not.toBeVisible();
    
    // 탭 2에서 데이터 로딩 확인
    const tab2Data = await page.locator('[data-testid="tab-2-data"]').textContent();
    expect(tab2Data).toBeTruthy();
    
    // 탭 1로 다시 전환
    await page.click('[data-testid="tab-1-btn"]');
    await page.waitForSelector('[data-testid="tab-1-content"]');
    
    // 탭 3으로 전환 (동일한 쿼리 사용)
    await page.click('[data-testid="tab-3-btn"]');
    await page.waitForSelector('[data-testid="tab-3-content"]');
    
    // 탭 3은 탭 2와 동일한 쿼리를 사용하므로 캐시에서 즉시 로드
    const tab3Data = await page.locator('[data-testid="tab-3-data"]').textContent();
    expect(tab3Data).toBe(tab2Data);
    
    // 로딩 상태가 표시되지 않았는지 확인
    const loadingIndicator = page.locator('[data-testid="tab-3-loading"]');
    await expect(loadingIndicator).not.toBeVisible();
  });
});

test.describe("Real-time State Updates", () => {
  test("WebSocket과 쿼리 상태 연동", async ({ page }) => {
    await page.goto("/state-sharing/realtime");
    
    await page.waitForSelector('[data-testid="realtime-data"]');
    await page.waitForSelector('[data-testid="connection-status"]');
    
    // WebSocket 연결 확인
    await expect(page.locator('[data-testid="connection-status"]')).toHaveText("connected");
    
    const initialData = await page.locator('[data-testid="realtime-data"]').textContent();
    
    // 서버에서 실시간 업데이트 시뮬레이션
    await page.evaluate(() => {
      // 가상의 WebSocket 메시지 발송
      window.dispatchEvent(new CustomEvent('websocket-message', {
        detail: { type: 'data-update', payload: { value: 'Updated Real-time Data' } }
      }));
    });
    
    // 실시간 업데이트가 반영되었는지 확인
    await expect(page.locator('[data-testid="realtime-data"]')).not.toHaveText(initialData);
    await expect(page.locator('[data-testid="realtime-data"]')).toHaveText("Updated Real-time Data");
    
    // 다른 컴포넌트들도 동시에 업데이트되었는지 확인
    await expect(page.locator('[data-testid="summary-data"]')).toHaveText("Updated Real-time Data");
  });

  test("Server-Sent Events와 자동 쿼리 갱신", async ({ page }) => {
    await page.goto("/state-sharing/sse");
    
    await page.waitForSelector('[data-testid="sse-data"]');
    
    const initialTimestamp = await page.locator('[data-testid="data-timestamp"]').textContent();
    
    // SSE 이벤트 시뮬레이션
    await page.evaluate(() => {
      const event = new CustomEvent('sse-update', {
        detail: { 
          type: 'query-invalidate',
          queryKeys: [['realtime-data']]
        }
      });
      window.dispatchEvent(event);
    });
    
    // 쿼리가 자동으로 재실행되어 새로운 데이터 로드
    await page.waitForFunction((initialTimestamp) => {
      const currentTimestamp = document.querySelector('[data-testid="data-timestamp"]')?.textContent;
      return currentTimestamp !== initialTimestamp;
    }, initialTimestamp);
    
    const updatedTimestamp = await page.locator('[data-testid="data-timestamp"]').textContent();
    expect(updatedTimestamp).not.toBe(initialTimestamp);
  });

  test("Background refetch와 사용자 경험", async ({ page }) => {
    await page.goto("/state-sharing/background-refetch");
    
    await page.waitForSelector('[data-testid="main-data"]');
    
    const initialData = await page.locator('[data-testid="main-data"]').textContent();
    
    // 백그라운드에서 데이터가 stale해졌을 때
    await page.evaluate(() => {
      window.__TRIGGER_BACKGROUND_REFETCH__();
    });
    
    // 사용자에게는 기존 데이터가 계속 표시됨 (no loading state)
    await expect(page.locator('[data-testid="main-data"]')).toHaveText(initialData);
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
    
    // 백그라운드 fetch 표시만 나타남
    await expect(page.locator('[data-testid="background-fetching"]')).toBeVisible();
    
    // 백그라운드 fetch 완료 후 새 데이터로 업데이트
    await page.waitForFunction((initialData) => {
      const currentData = document.querySelector('[data-testid="main-data"]')?.textContent;
      return currentData !== initialData;
    }, initialData);
    
    await expect(page.locator('[data-testid="background-fetching"]')).not.toBeVisible();
  });
});

test.describe("Error State Propagation", () => {
  test("한 컴포넌트의 에러가 다른 컴포넌트에 전파", async ({ page }) => {
    await page.goto("/state-sharing/error-propagation");
    
    await page.waitForSelector('[data-testid="component-a"]');
    await page.waitForSelector('[data-testid="component-b"]');
    await page.waitForSelector('[data-testid="component-c"]');
    
    // 모든 컴포넌트가 정상 상태
    await expect(page.locator('[data-testid="component-a"] [data-testid="status"]')).toHaveText("success");
    await expect(page.locator('[data-testid="component-b"] [data-testid="status"]')).toHaveText("success");
    await expect(page.locator('[data-testid="component-c"] [data-testid="status"]')).toHaveText("success");
    
    // API 에러 시뮬레이션
    await page.route("**/api/shared-data", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server Error" })
      });
    });
    
    // 컴포넌트 A에서 refetch 트리거
    await page.click('[data-testid="component-a"] [data-testid="refetch-btn"]');
    
    // 모든 컴포넌트가 동시에 에러 상태로 전환
    await expect(page.locator('[data-testid="component-a"] [data-testid="status"]')).toHaveText("error");
    await expect(page.locator('[data-testid="component-b"] [data-testid="status"]')).toHaveText("error");
    await expect(page.locator('[data-testid="component-c"] [data-testid="status"]')).toHaveText("error");
    
    // 에러 메시지도 모든 컴포넌트에 표시
    await expect(page.locator('[data-testid="component-a"] [data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="component-b"] [data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="component-c"] [data-testid="error-message"]')).toBeVisible();
  });

  test("부분 에러와 전체 에러 상태 관리", async ({ page }) => {
    await page.goto("/state-sharing/partial-errors");
    
    await page.waitForSelector('[data-testid="user-info"]');
    await page.waitForSelector('[data-testid="user-posts"]');
    await page.waitForSelector('[data-testid="user-followers"]');
    
    // 사용자 포스트만 에러 발생
    await page.route("**/api/users/*/posts", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "Posts not found" })
      });
    });
    
    // 페이지 새로고침으로 쿼리 재실행
    await page.reload();
    
    // 사용자 정보와 팔로워는 정상, 포스트만 에러
    await expect(page.locator('[data-testid="user-info"] [data-testid="status"]')).toHaveText("success");
    await expect(page.locator('[data-testid="user-posts"] [data-testid="status"]')).toHaveText("error");
    await expect(page.locator('[data-testid="user-followers"] [data-testid="status"]')).toHaveText("success");
    
    // 에러가 발생한 섹션만 에러 UI 표시
    await expect(page.locator('[data-testid="user-info"] [data-testid="content"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-posts"] [data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-followers"] [data-testid="content"]')).toBeVisible();
  });
});