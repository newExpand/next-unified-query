import { test, expect } from "@playwright/test";

/**
 * TanStack Query + Axios 벤치마크 테스트
 * 
 * Next Unified Query와 동일한 조건에서 TanStack Query의 성능을 측정합니다.
 */

test.describe("TanStack Query Benchmark", () => {
  test("동시 쿼리 요청 처리 성능", async ({ page }) => {
    test.setTimeout(60000); // 60초 타임아웃 설정
    await page.goto("/benchmark/tanstack-query");

    // API 경로 워밍업 (첫 번째 컴파일 시간 제거)
    await page.evaluate(() => {
      return fetch(
        "/api/performance-data?id=1&delay=0&type=concurrent&size=small"
      );
    });
    await page.waitForTimeout(1000); // 워밍업 완료 대기

    // 성능 측정 시작
    const startTime = Date.now();

    // 100개 동시 쿼리 요청
    await page.click('[data-testid="start-tanstack-concurrent-queries"]');

    // 진행 상태를 주기적으로 체크하면서 완료 대기
    let completedCount = 0;
    let attempts = 0;
    const maxAttempts = 90; // 45초 (0.5초 간격)

    while (completedCount < 100 && attempts < maxAttempts) {
      await page.waitForTimeout(500);
      attempts++;

      const currentProgress = await page.textContent(".text-sm.text-gray-600");
      if (currentProgress) {
        const match = currentProgress.match(/완료: (\d+)\/100/);
        if (match) {
          completedCount = parseInt(match[1]);
        }
      }
    }

    if (completedCount >= 100) {
      // 완료 상태 확인
      await page.waitForSelector('[data-testid="tanstack-all-queries-completed"]', {
        timeout: 5000,
      });
    } else {
      throw new Error(
        `TanStack Query 테스트 타임아웃: ${completedCount}/100 완료됨 (${attempts}회 시도)`
      );
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // 성능 메트릭 수집
    const performanceMetrics = await page.evaluate(() => {
      return {
        successful: window.__TANSTACK_QUERY_PERFORMANCE_STATS__?.successful,
        failed: window.__TANSTACK_QUERY_PERFORMANCE_STATS__?.failed,
        averageResponseTime: window.__TANSTACK_QUERY_PERFORMANCE_STATS__?.averageTime,
        cacheHits: window.__TANSTACK_QUERY_PERFORMANCE_STATS__?.cacheHits,
        totalTime: window.__TANSTACK_QUERY_PERFORMANCE_STATS__?.totalTime,
      };
    });

    // 성능 기준 검증 (워밍업 후 실제 처리 시간만 측정)
    expect(totalTime).toBeLessThan(15000); // 15초 이내 완료 (TanStack Query는 더 느릴 수 있음)
    expect(performanceMetrics.successful).toBe(100);
    expect(performanceMetrics.averageResponseTime).toBeLessThan(1500); // 평균 1500ms 이하

    console.log("TanStack Query 성능 메트릭:", performanceMetrics);
  });

  test("메모리 사용량 측정", async ({ page }) => {
    await page.goto("/benchmark/tanstack-query");

    // 메모리 측정 시작
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // 100개 쿼리 생성 및 실행
    await page.click('[data-testid="start-tanstack-concurrent-queries"]');

    // 쿼리 완료 대기
    await page.waitForSelector('[data-testid="tanstack-all-queries-completed"]', {
      timeout: 30000,
    });

    // 메모리 사용량 측정
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

    // 메모리 증가량이 합리적인 범위 내에 있는지 확인
    expect(memoryIncreaseMB).toBeLessThan(150); // 150MB 이하 (TanStack Query는 더 많이 사용할 수 있음)

    console.log(`TanStack Query 메모리 사용량: ${memoryIncreaseMB.toFixed(1)}MB 증가`);
  });

  test("캐시 효율성 측정", async ({ page }) => {
    await page.goto("/benchmark/tanstack-query");

    // 첫 번째 라운드: 모든 요청이 네트워크에서
    await page.click('[data-testid="start-tanstack-concurrent-queries"]');
    await page.waitForSelector('[data-testid="tanstack-all-queries-completed"]');

    const firstLoadStats = await page.evaluate(() => {
      return {
        totalTime: window.__TANSTACK_QUERY_PERFORMANCE_STATS__?.totalTime,
        averageTime: window.__TANSTACK_QUERY_PERFORMANCE_STATS__?.averageTime,
        cacheHits: window.__TANSTACK_QUERY_PERFORMANCE_STATS__?.cacheHits,
      };
    });

    // 페이지 새로고침 없이 두 번째 라운드
    await page.waitForTimeout(1000);
    await page.click('[data-testid="start-tanstack-concurrent-queries"]');
    await page.waitForSelector('[data-testid="tanstack-all-queries-completed"]');

    const secondLoadStats = await page.evaluate(() => {
      return {
        totalTime: window.__TANSTACK_QUERY_PERFORMANCE_STATS__?.totalTime,
        averageTime: window.__TANSTACK_QUERY_PERFORMANCE_STATS__?.averageTime,
        cacheHits: window.__TANSTACK_QUERY_PERFORMANCE_STATS__?.cacheHits,
      };
    });

    // 캐시 효율성 검증
    const cacheEfficiency = {
      firstLoadTime: firstLoadStats.totalTime,
      secondLoadTime: secondLoadStats.totalTime,
      speedImprovement: firstLoadStats.totalTime / secondLoadStats.totalTime,
      cacheHitRatio: secondLoadStats.cacheHits / 100, // 100개 중
    };

    // 캐시로 인한 성능 향상 확인 (TanStack Query도 캐시 효과가 있어야 함)
    expect(cacheEfficiency.speedImprovement).toBeGreaterThan(1.5); // 최소 1.5배 빨라짐
    expect(cacheEfficiency.cacheHitRatio).toBeGreaterThan(0.5); // 50% 이상 캐시 히트

    console.log("TanStack Query 캐시 효율성:", cacheEfficiency);
  });
});