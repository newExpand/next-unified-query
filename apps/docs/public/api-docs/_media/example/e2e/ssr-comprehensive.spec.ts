import { test, expect } from "@playwright/test";

/**
 * SSR 종합 테스트
 * next-unified-query 라이브러리의 SSR 기능을 포괄적으로 테스트합니다.
 */

test.describe("SSR 종합 테스트", () => {
  test.describe("기본 SSR 기능", () => {
    test("SSR prefetch 데이터가 즉시 표시됨", async ({ page }) => {
      await page.goto("/ssr-test/basic");
      
      // 페이지 제목 확인
      await expect(page.locator("h1")).toHaveText("SSR 기본 테스트");
      
      // 모든 데이터가 로딩 없이 즉시 표시되어야 함
      await expect(page.locator('[data-testid="users-data"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-data"]')).toBeVisible();
      await expect(page.locator('[data-testid="posts-data"]')).toBeVisible();
      
      // 로딩 상태가 없어야 함
      await expect(page.locator('[data-testid="users-loading"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="user-loading"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="posts-loading"]')).not.toBeVisible();
    });

    test("파라미터 없는 쿼리 동작 확인", async ({ page }) => {
      await page.goto("/ssr-test/basic");
      
      // 사용자 목록 데이터 확인
      const usersSection = page.locator('[data-testid="users-data"]');
      await expect(usersSection).toBeVisible();
      
      // 첫 번째 사용자 확인
      await expect(page.locator('[data-testid="user-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-1"]')).toContainText("Alice Johnson");
    });

    test("파라미터 있는 쿼리 동작 확인", async ({ page }) => {
      await page.goto("/ssr-test/basic");
      
      // 사용자 상세 데이터 확인
      const userSection = page.locator('[data-testid="user-data"]');
      await expect(userSection).toBeVisible();
      
      await expect(page.locator('[data-testid="user-name"]')).toContainText("Alice Johnson");
      await expect(page.locator('[data-testid="user-email"]')).toContainText("alice@example.com");
      await expect(page.locator('[data-testid="user-id"]')).toContainText("1");
    });

    test("select 함수가 SSR에서 적용됨", async ({ page }) => {
      await page.goto("/ssr-test/basic");
      
      // 포스트 데이터에 select 함수 적용 확인
      const postsSection = page.locator('[data-testid="posts-data"]');
      await expect(postsSection).toBeVisible();
      
      // 첫 번째 포스트에서 prefetched 속성 확인
      await expect(page.locator('[data-testid="post-1"]')).toContainText("Prefetched: Yes");
    });

    test("디버그 정보에서 로딩 상태 확인", async ({ page }) => {
      await page.goto("/ssr-test/basic");
      
      // 모든 로딩 상태가 No여야 함
      await expect(page.locator('[data-testid="debug-users-loading"]')).toContainText("No");
      await expect(page.locator('[data-testid="debug-user-loading"]')).toContainText("No");
      await expect(page.locator('[data-testid="debug-posts-loading"]')).toContainText("No");
    });
  });

  test.describe("고급 SSR 기능", () => {
    test("스키마 검증이 SSR에서 동작함", async ({ page }) => {
      await page.goto("/ssr-test/advanced");
      
      // 스키마 검증된 사용자 데이터 확인
      const userSchemaSection = page.locator('[data-testid="user-schema-data"]');
      await expect(userSchemaSection).toBeVisible();
      
      await expect(page.locator('[data-testid="user-schema-name"]')).toContainText("Alice Johnson");
      await expect(page.locator('[data-testid="user-schema-email"]')).toContainText("alice@example.com");
      await expect(page.locator('[data-testid="user-schema-bio"]')).toContainText("Full-stack developer");
      await expect(page.locator('[data-testid="user-schema-avatar"]')).toContainText("alice.jpg");
    });

    test("스키마 + select 함수 조합 동작", async ({ page }) => {
      await page.goto("/ssr-test/advanced");
      
      // 포스트 스키마 데이터 확인
      const postsSchemaSection = page.locator('[data-testid="posts-schema-data"]');
      await expect(postsSchemaSection).toBeVisible();
      
      // 첫 번째 포스트에서 select 함수 적용 확인
      const firstPost = page.locator('[data-testid="post-schema-1"]');
      await expect(firstPost).toContainText("Processed: Yes");
      await expect(firstPost).toContainText("Introduction to Next...");
      await expect(firstPost).toContainText("nextjs, react, javascript");
    });

    test("커스텀 queryFn 동작", async ({ page }) => {
      await page.goto("/ssr-test/advanced");
      
      // 커스텀 쿼리 섹션이 존재하는지 먼저 확인
      const customQuerySection = page.locator('[data-testid="custom-query-section"]');
      await expect(customQuerySection).toBeVisible();
      
      // 로딩이 끝날 때까지 기다리기 (로딩 상태가 사라질 때까지)
      await expect(page.locator('[data-testid="custom-query-loading"]')).not.toBeVisible({ timeout: 10000 });
      
      // 에러가 없는지 확인
      await expect(page.locator('[data-testid="custom-query-error"]')).not.toBeVisible();
      
      // 커스텀 쿼리 데이터 확인
      const customSection = page.locator('[data-testid="custom-query-data"]');
      await expect(customSection).toBeVisible();
      
      await expect(page.locator('[data-testid="custom-combined"]')).toContainText("Yes");
      await expect(page.locator('[data-testid="custom-user-name"]')).toContainText("Alice Johnson");
      await expect(page.locator('[data-testid="custom-posts-count"]')).toContainText("5");
      
      // 타임스탬프가 있는지 확인
      await expect(page.locator('[data-testid="custom-timestamp"]')).toBeVisible();
      const timestamp = await page.locator('[data-testid="custom-timestamp"]').textContent();
      expect(timestamp).toMatch(/\d+/);
    });

    test("에러 쿼리 처리", async ({ page }) => {
      await page.goto("/ssr-test/advanced");
      
      // 에러 쿼리 섹션 확인
      const errorSection = page.locator('[data-testid="error-query-section"]');
      await expect(errorSection).toBeVisible();
      
      // 에러 메시지 확인
      await expect(page.locator('[data-testid="error-query-error"]')).toContainText("Expected Error");
    });

    test("개별 쿼리 실패 시 다른 쿼리에 영향 없음", async ({ page }) => {
      await page.goto("/ssr-test/advanced");
      
      // 에러 쿼리는 실패하지만 다른 쿼리들은 성공
      await expect(page.locator('[data-testid="user-schema-data"]')).toBeVisible();
      await expect(page.locator('[data-testid="posts-schema-data"]')).toBeVisible();
      await expect(page.locator('[data-testid="custom-query-data"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-query-error"]')).toBeVisible();
    });
  });

  test.describe("SSR 성능 테스트", () => {
    test("대용량 데이터 처리", async ({ page }) => {
      await page.goto("/ssr-test/performance");
      
      // 성능 지표 확인
      const prefetchTime = await page.locator('[data-testid="prefetch-time"]').textContent();
      expect(prefetchTime).toMatch(/\d+ms/);
      
      // 대용량 데이터 로딩 확인
      await expect(page.locator('[data-testid="large-dataset-data"]')).toBeVisible();
      
      const itemCount = await page.locator('[data-testid="large-dataset-count"]').textContent();
      expect(itemCount).toMatch(/Items: \d+/);
      
      const dataSize = await page.locator('[data-testid="large-dataset-size"]').textContent();
      expect(dataSize).toMatch(/Size: \d+ bytes/);
    });

    test("다중 쿼리 병렬 처리", async ({ page }) => {
      await page.goto("/ssr-test/performance");
      
      // 배치 쿼리 완료 확인
      await expect(page.locator('[data-testid="batch-queries-data"]')).toBeVisible();
      await expect(page.locator('[data-testid="batch-queries-count"]')).toContainText("10/10");
      
      // 모든 배치 아이템 확인
      for (let i = 0; i < 10; i++) {
        await expect(page.locator(`[data-testid="batch-item-${i}"]`)).toBeVisible();
      }
    });

    test("속도 비교 테스트", async ({ page }) => {
      await page.goto("/ssr-test/performance");
      
      // 느린 쿼리 결과 확인
      await expect(page.locator('[data-testid="slow-query-data"]')).toBeVisible();
      const slowDelay = await page.locator('[data-testid="slow-query-section"]').textContent();
      expect(slowDelay).toMatch(/Delay: \d+ms/);
      
      // 빠른 쿼리 결과 확인
      await expect(page.locator('[data-testid="fast-query-data"]')).toBeVisible();
      const fastDelay = await page.locator('[data-testid="fast-query-section"]').textContent();
      expect(fastDelay).toMatch(/Delay: \d+ms/);
    });

    test("Hydration 성능 측정", async ({ page }) => {
      await page.goto("/ssr-test/performance");
      
      // Hydration 시간이 측정되었는지 확인
      await page.waitForFunction(() => {
        const element = document.querySelector('[data-testid="performance-hydration-time"]');
        return element && !element.textContent?.includes('Calculating');
      });
      
      const hydrationTime = await page.locator('[data-testid="performance-hydration-time"]').textContent();
      expect(hydrationTime).toMatch(/\d+ms/);
      
      const totalTime = await page.locator('[data-testid="performance-total-time"]').textContent();
      expect(totalTime).toMatch(/\d+ms/);
    });

    test("메모리 사용량 근사치 계산", async ({ page }) => {
      await page.goto("/ssr-test/performance");
      
      // 메모리 사용량 정보 확인
      await expect(page.locator('[data-testid="memory-usage-section"]')).toBeVisible();
      
      const largeDataMemory = await page.locator('[data-testid="memory-large-data"]').textContent();
      expect(largeDataMemory).toMatch(/\d+ bytes/);
      
      const batchDataMemory = await page.locator('[data-testid="memory-batch-data"]').textContent();
      expect(batchDataMemory).toMatch(/\d+ bytes/);
      
      const totalMemory = await page.locator('[data-testid="memory-total"]').textContent();
      expect(totalMemory).toMatch(/\d+ bytes/);
    });
  });

  test.describe("SSR vs CSR 전환 테스트", () => {
    test("SSR에서 CSR로 전환 시 캐시 유지", async ({ page }) => {
      // SSR 페이지 로드
      await page.goto("/ssr-test/basic");
      
      // 초기 데이터 확인
      await expect(page.locator('[data-testid="user-name"]')).toContainText("Alice Johnson");
      
      // 페이지 새로고침 없이 다른 페이지로 이동 후 다시 돌아오기
      await page.goto("/");
      await page.goto("/ssr-test/basic");
      
      // 데이터가 여전히 즉시 표시되어야 함 (캐시 유지)
      await expect(page.locator('[data-testid="user-name"]')).toContainText("Alice Johnson");
      await expect(page.locator('[data-testid="debug-user-loading"]')).toContainText("No");
    });

    test("브라우저 새로고침 시 데이터 복구", async ({ page }) => {
      await page.goto("/ssr-test/basic");
      
      // 초기 데이터 확인
      await expect(page.locator('[data-testid="users-data"]')).toBeVisible();
      
      // 브라우저 새로고침
      await page.reload();
      
      // 데이터가 다시 SSR로 즉시 표시되어야 함
      await expect(page.locator('[data-testid="users-data"]')).toBeVisible();
      await expect(page.locator('[data-testid="debug-users-loading"]')).toContainText("No");
    });
  });

  test.describe("네트워크 및 에러 시나리오", () => {
    test("네트워크 지연 상황에서 SSR 동작", async ({ page }) => {
      // 네트워크 속도 제한
      await page.route("**/api/ssr-test/**", async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.continue();
      });
      
      await page.goto("/ssr-test/basic");
      
      // 데이터가 여전히 표시되어야 함 (SSR에서 이미 처리됨)
      await expect(page.locator('[data-testid="users-data"]')).toBeVisible();
    });

    test("API 에러 후 페이지 접근", async ({ page }) => {
      await page.goto("/ssr-test/advanced");
      
      // 에러 쿼리는 실패하지만 페이지는 정상 표시
      await expect(page.locator("h1")).toHaveText("SSR 고급 테스트");
      await expect(page.locator('[data-testid="error-query-error"]')).toBeVisible();
    });
  });

  test.describe("타임스탬프 및 데이터 무결성", () => {
    test("서버/클라이언트 타임스탬프 일관성", async ({ page }) => {
      await page.goto("/ssr-test/basic");
      
      // 렌더링 타임스탬프 확인
      const debugTimestamp = await page.locator('[data-testid="debug-timestamp"]').textContent();
      expect(debugTimestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test("데이터 무결성 검증", async ({ page }) => {
      await page.goto("/ssr-test/advanced");
      
      // 스키마 검증된 데이터가 올바른 형식인지 확인
      const userName = await page.locator('[data-testid="user-schema-name"]').textContent();
      const userEmail = await page.locator('[data-testid="user-schema-email"]').textContent();
      
      expect(userName).toBeTruthy();
      expect(userEmail).toMatch(/.*@.*\..*/);
    });

    test("렌더링 시간 측정", async ({ page }) => {
      const startTime = Date.now();
      await page.goto("/ssr-test/performance");
      
      // 모든 데이터가 로드될 때까지 대기
      await expect(page.locator('[data-testid="large-dataset-data"]')).toBeVisible();
      await expect(page.locator('[data-testid="batch-queries-data"]')).toBeVisible();
      
      const endTime = Date.now();
      const totalRenderTime = endTime - startTime;
      
      // 합리적인 렌더링 시간인지 확인 (10초 이하)
      expect(totalRenderTime).toBeLessThan(10000);
    });
  });
});