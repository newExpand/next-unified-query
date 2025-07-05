import { test, expect } from "@playwright/test";

/**
 * 메모리 사용량 및 성능 실측 테스트
 *
 * 단위 테스트로는 검증하기 어려운 실제 브라우저 환경에서의
 * 메모리 사용량, 캐시 성능, 렌더링 성능을 측정합니다.
 */

test.describe("Memory Management", () => {
  test("대량 쿼리 생성 시 메모리 사용량 제한", async ({ page }) => {
    // 메모리 측정 시작
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    await page.goto("/stress-test/queries");

    // 1000개 쿼리 생성 버튼 클릭
    await page.click('[data-testid="create-1000-queries"]');

    // 쿼리 생성 완료 대기
    await page.waitForSelector('[data-testid="queries-created"]');

    // 메모리 사용량 측정
    const afterCreationMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // 캐시 통계 확인
    const cacheStats = await page.evaluate(() => {
      return window.__NEXT_UNIFIED_QUERY_CACHE_STATS__;
    });

    expect(cacheStats?.cacheSize).toBeLessThanOrEqual(1000); // maxQueries 제한

    // LRU eviction 동작 확인 (1000개 초과 생성)
    await page.click('[data-testid="create-additional-queries"]');
    await page.waitForTimeout(1000);

    const finalCacheStats = await page.evaluate(() => {
      return window.__NEXT_UNIFIED_QUERY_CACHE_STATS__;
    });

    // 캐시 크기가 제한 내에 유지되어야 함
    expect(finalCacheStats?.cacheSize).toBeLessThanOrEqual(1000);

    // 메모리 사용량이 과도하게 증가하지 않았는지 확인
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

    // 메모리 증가량이 합리적인 범위 내에 있는지 확인 (1000개 쿼리 + 데이터 + 컴포넌트)
    expect(memoryIncreaseMB).toBeLessThan(100); // 100MB 이하로 조정 (더 현실적)
  });

  test("컴포넌트 마운트/언마운트 반복 시 메모리 누수 검증", async ({
    page,
  }) => {
    await page.goto("/stress-test/mount-unmount");

    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // 100번 마운트/언마운트 반복
    for (let i = 0; i < 100; i++) {
      await page.click('[data-testid="mount-component"]');
      await page.waitForSelector('[data-testid="test-component"]');

      await page.click('[data-testid="unmount-component"]');
      await expect(
        page.locator('[data-testid="test-component"]')
      ).not.toBeVisible();

      // 10번마다 가비지 컬렉션 실행
      if (i % 10 === 0) {
        await page.evaluate(() => {
          if (window.gc) {
            window.gc();
          }
        });
      }
    }

    // 최종 가비지 컬렉션
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });

    await page.waitForTimeout(1000);

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

    // 메모리 누수가 없다면 증가량이 최소화되어야 함 (예: 10MB 이하)
    expect(memoryIncreaseMB).toBeLessThan(10);

    // 활성 구독자 수가 0이어야 함
    const subscriptionStats = await page.evaluate(() => {
      return window.__NEXT_UNIFIED_QUERY_CACHE_STATS__;
    });

    expect(subscriptionStats?.subscribersCount).toBe(0);
    expect(subscriptionStats?.listenersCount).toBe(0);
  });

  test("gcTime 동작으로 메모리 자동 정리", async ({ page }) => {
    await page.goto("/stress-test/gc-time");

    // 짧은 gcTime (1초) 설정으로 쿼리 생성
    await page.click('[data-testid="create-short-gc-queries"]');
    await page.waitForSelector('[data-testid="queries-created"]');

    const initialCacheSize = await page.evaluate(() => {
      return window.__NEXT_UNIFIED_QUERY_CACHE_STATS__?.cacheSize;
    });

    expect(initialCacheSize).toBeGreaterThan(0);

    // 컴포넌트 언마운트 (구독자 제거)
    await page.click('[data-testid="unmount-all-components"]');

    // gcTime + 여유시간 대기
    await page.waitForTimeout(2000);

    const finalCacheSize = await page.evaluate(() => {
      return window.__NEXT_UNIFIED_QUERY_CACHE_STATS__?.cacheSize;
    });

    // 캐시가 자동으로 정리되었는지 확인
    expect(finalCacheSize).toBeLessThan(initialCacheSize || 0);
  });
});

test.describe("Performance Benchmarks", () => {
  test("동시 쿼리 요청 처리 성능", async ({ page }) => {
    test.setTimeout(60000); // 60초 타임아웃 설정
    await page.goto("/performance/concurrent-queries");

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
    await page.click('[data-testid="start-concurrent-queries"]');

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
      await page.waitForSelector('[data-testid="all-queries-completed"]', {
        timeout: 5000,
      });
    } else {
      throw new Error(
        `테스트 타임아웃: ${completedCount}/100 완료됨 (${attempts}회 시도)`
      );
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // 성능 메트릭 수집
    const performanceMetrics = await page.evaluate(() => {
      return {
        successfulQueries: window.__QUERY_PERFORMANCE_STATS__?.successful,
        failedQueries: window.__QUERY_PERFORMANCE_STATS__?.failed,
        averageResponseTime: window.__QUERY_PERFORMANCE_STATS__?.averageTime,
        cacheHits: window.__QUERY_PERFORMANCE_STATS__?.cacheHits,
      };
    });

    // 성능 기준 검증 (워밍업 후 실제 처리 시간만 측정)
    expect(totalTime).toBeLessThan(10000); // 10초 이내 완료 (워밍업 후)
    expect(performanceMetrics.successfulQueries).toBe(100);
    expect(performanceMetrics.averageResponseTime).toBeLessThan(1200); // 평균 1200ms 이하 (개발 환경 + 100개 동시 요청 고려)
  });

  test("캐시 조회 성능 (대량 데이터)", async ({ page }) => {
    test.setTimeout(60000); // 60초 타임아웃 설정
    await page.goto("/performance/cache-lookup");

    // 100개 캐시 엔트리 생성
    await page.click('[data-testid="populate-large-cache"]');
    await page.waitForSelector('[data-testid="cache-populated"]', {
      timeout: 30000, // 30초 대기
    });

    // 캐시 조회 성능 측정
    const lookupTimes: number[] = [];

    for (let i = 0; i < 100; i++) {
      const startTime = await page.evaluate(() => performance.now());

      await page.click('[data-testid="random-cache-lookup"]');
      await page.waitForSelector('[data-testid="lookup-result"]');

      const endTime = await page.evaluate(() => performance.now());
      lookupTimes.push(endTime - startTime);
    }

    const averageLookupTime =
      lookupTimes.reduce((a, b) => a + b) / lookupTimes.length;
    const maxLookupTime = Math.max(...lookupTimes);

    // 캐시 조회가 충분히 빨라야 함 (Playwright 환경 고려)
    expect(averageLookupTime).toBeLessThan(60); // 평균 60ms 이하 (브라우저 자동화 오버헤드 고려)
    expect(maxLookupTime).toBeLessThan(200); // 최대 200ms 이하
  });
});

test.describe("Network Performance", () => {
  test("다양한 네트워크 조건에서 성능", async ({ page }) => {
    const networkConditions = [
      {
        name: "3G Fast",
        downloadThroughput: 1600,
        uploadThroughput: 750,
        latency: 150,
      },
      {
        name: "3G Slow",
        downloadThroughput: 500,
        uploadThroughput: 500,
        latency: 400,
      },
      {
        name: "2G",
        downloadThroughput: 280,
        uploadThroughput: 256,
        latency: 800,
      },
    ];

    for (const condition of networkConditions) {
      // 먼저 페이지를 정상적으로 로드
      await page.goto("/performance/network-test");

      // 페이지 로드 후 네트워크 조건 설정
      const client = await page.context().newCDPSession(page);
      await client.send("Network.emulateNetworkConditions", {
        offline: false,
        downloadThroughput: (condition.downloadThroughput * 1024) / 8, // KB/s to bytes/s
        uploadThroughput: (condition.uploadThroughput * 1024) / 8,
        latency: condition.latency,
      });

      const startTime = Date.now();

      // 표준 쿼리 세트 실행
      await page.click('[data-testid="start-network-test"]');
      await page.waitForSelector('[data-testid="network-test-complete"]');

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      console.log(`${condition.name} performance: ${loadTime}ms`);

      // 각 네트워크 조건에 대한 합리적인 기대치 설정
      const expectedMaxTime =
        condition.name === "3G Fast"
          ? 3000
          : condition.name === "3G Slow"
          ? 8000
          : 15000;

      expect(loadTime).toBeLessThan(expectedMaxTime);

      await client.detach();
    }
  });

  test("캐시 효율성 측정", async ({ page }) => {
    await page.goto("/performance/cache-efficiency");

    // 첫 번째 라운드: 모든 요청이 네트워크에서
    await page.click('[data-testid="clear-all-cache"]');
    await page.click('[data-testid="load-test-data"]');
    await page.waitForSelector('[data-testid="first-load-complete"]');

    const firstLoadStats = await page.evaluate(() => {
      return window.__CACHE_PERFORMANCE_STATS__.firstLoad;
    });

    // 두 번째 라운드: 캐시에서 로드
    await page.click('[data-testid="load-test-data"]');
    await page.waitForSelector('[data-testid="second-load-complete"]');

    const secondLoadStats = await page.evaluate(() => {
      return window.__CACHE_PERFORMANCE_STATS__.secondLoad;
    });

    // 캐시 효율성 검증
    const cacheEfficiency = {
      firstLoadTime: firstLoadStats.totalTime,
      secondLoadTime: secondLoadStats.totalTime,
      speedImprovement: firstLoadStats.totalTime / secondLoadStats.totalTime,
      cacheHitRatio: secondLoadStats.cacheHits / secondLoadStats.totalRequests,
    };

    // 캐시로 인한 성능 향상 확인
    expect(cacheEfficiency.speedImprovement).toBeGreaterThan(2); // 최소 2배 빨라짐
    expect(cacheEfficiency.cacheHitRatio).toBeGreaterThan(0.8); // 80% 이상 캐시 히트

    console.log("Cache efficiency metrics:", cacheEfficiency);
  });
});
