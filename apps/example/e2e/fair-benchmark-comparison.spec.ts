import { test, expect } from "@playwright/test";

/**
 * 공정한 라이브러리 벤치마크 비교 테스트
 * 
 * 각 라이브러리의 설계 철학을 존중하여 공정한 비교를 수행합니다.
 * - SWR: stale-while-revalidate 패턴의 사용자 체감 성능 중심
 * - TanStack Query: 조건부 캐싱과 네트워크 효율성 중심  
 * - Next Unified Query: 절대적 캐시 성능과 개발자 경험 중심
 */

test.describe("Fair Library Benchmark Comparison", () => {
  
  test.describe("SWR: User Experience Focused Testing", () => {
    test("SWR stale-while-revalidate 사용자 체감 성능", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/benchmark/swr");

      // 첫 번째 실행: 초기 데이터 로드
      await page.click('[data-testid="start-swr-concurrent-queries"]');
      await page.waitForSelector('[data-testid="swr-all-queries-completed"]');

      // SWR의 핵심: 즉시 stale 데이터 제공하면서 백그라운드 revalidation
      await page.waitForTimeout(2000); // SWR dedupingInterval 고려
      
      const startTime = Date.now();
      await page.click('[data-testid="start-swr-concurrent-queries"]');
      await page.waitForSelector('[data-testid="swr-all-queries-completed"]');
      const endTime = Date.now();

      // SWR 고급 메트릭 수집
      const swrMetrics = await page.evaluate(() => {
        return window.__SWR_ADVANCED_METRICS__;
      });

      // SWR 설계 철학에 맞는 검증
      expect(swrMetrics.userExperience.immediateDisplay).toBeGreaterThan(50); // 즉시 표시 가능한 응답
      expect(swrMetrics.userExperience.timeToFirstData).toBeLessThan(50); // 첫 데이터까지 빠른 시간
      expect(swrMetrics.librarySpecific.staleWhileRevalidateEfficiency.stalenessAcceptability).toBeGreaterThan(0.5);

      console.log("SWR stale-while-revalidate 성능:", swrMetrics);
    });

    test("SWR 백그라운드 업데이트 효율성", async ({ page }) => {
      await page.goto("/benchmark/swr");

      // 캐시된 데이터로 첫 번째 로드
      await page.click('[data-testid="start-swr-concurrent-queries"]');
      await page.waitForSelector('[data-testid="swr-all-queries-completed"]');

      // 백그라운드 revalidation 동작 확인
      const swrMetrics = await page.evaluate(() => {
        return window.__SWR_ADVANCED_METRICS__;
      });

      expect(swrMetrics.networkEfficiency.backgroundUpdates).toBeGreaterThan(0); // 백그라운드 업데이트 발생
      expect(swrMetrics.librarySpecific.staleWhileRevalidateEfficiency.backgroundUpdateSpeed).toBeLessThan(200);

      console.log("SWR 백그라운드 업데이트:", swrMetrics.networkEfficiency);
    });
  });

  test.describe("TanStack Query: Network Efficiency Focused Testing", () => {
    test("TanStack Query 조건부 캐싱 효율성", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/benchmark/tanstack-query");

      // 첫 번째 실행: 네트워크 요청
      await page.click('[data-testid="start-tanstack-concurrent-queries"]');
      await page.waitForSelector('[data-testid="tanstack-all-queries-completed"]');

      // 두 번째 실행: staleTime 내에서 캐시 활용
      await page.waitForTimeout(1000);
      const startTime = Date.now();
      await page.click('[data-testid="start-tanstack-concurrent-queries"]');
      await page.waitForSelector('[data-testid="tanstack-all-queries-completed"]');
      const endTime = Date.now();

      // TanStack Query 고급 메트릭 수집
      const tanstackMetrics = await page.evaluate(() => {
        return window.__TANSTACK_QUERY_ADVANCED_METRICS__;
      });

      // TanStack Query 설계 철학에 맞는 검증
      expect(tanstackMetrics.networkEfficiency.actualNetworkRequests).toBeLessThan(100); // 불필요한 요청 방지
      expect(tanstackMetrics.librarySpecific.conditionalCacheEfficiency.intelligentCacheHits).toBeGreaterThan(70);
      expect(tanstackMetrics.librarySpecific.conditionalCacheEfficiency.staleTimeRespected).toBeGreaterThan(0.7);

      console.log("TanStack Query 조건부 캐싱:", tanstackMetrics);
    });

    test("TanStack Query 네트워크 효율성", async ({ page }) => {
      await page.goto("/benchmark/tanstack-query");

      await page.click('[data-testid="start-tanstack-concurrent-queries"]');
      await page.waitForSelector('[data-testid="tanstack-all-queries-completed"]');

      const tanstackMetrics = await page.evaluate(() => {
        return window.__TANSTACK_QUERY_ADVANCED_METRICS__;
      });

      // 네트워크 효율성 검증
      expect(tanstackMetrics.networkEfficiency.bandwidthSaved).toBeGreaterThan(50000); // 50KB 이상 절약
      expect(tanstackMetrics.librarySpecific.conditionalCacheEfficiency.conditionalRefetches).toBeLessThan(50);

      console.log("TanStack Query 네트워크 효율성:", tanstackMetrics.networkEfficiency);
    });
  });

  test.describe("Next Unified Query: Absolute Cache Performance Testing", () => {
    test("Next Unified Query 절대적 캐시 성능", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/performance/concurrent-queries");

      // 첫 번째 실행: 초기 캐시 구축
      await page.click('[data-testid="start-concurrent-queries"]');
      await page.waitForSelector('[data-testid="all-queries-completed"]');

      // 두 번째 실행: 완전한 캐시 히트
      await page.waitForTimeout(1000);
      const startTime = Date.now();
      await page.click('[data-testid="start-concurrent-queries"]');
      await page.waitForSelector('[data-testid="all-queries-completed"]');
      const endTime = Date.now();

      // Next Unified Query 고급 메트릭 수집
      const nextUnifiedMetrics = await page.evaluate(() => {
        return window.__NEXT_UNIFIED_QUERY_ADVANCED_METRICS__;
      });

      // Next Unified Query 설계 철학에 맞는 검증
      expect(nextUnifiedMetrics.librarySpecific.absoluteCacheEfficiency.trueCacheHits).toBe(100); // 100% 캐시 히트
      expect(nextUnifiedMetrics.librarySpecific.absoluteCacheEfficiency.zeroNetworkRequests).toBe(100);
      expect(nextUnifiedMetrics.librarySpecific.absoluteCacheEfficiency.cacheConsistency).toBe(1.0); // 완전한 일관성

      console.log("Next Unified Query 절대적 캐시:", nextUnifiedMetrics);
    });

    test("Next Unified Query 개발자 경험", async ({ page }) => {
      await page.goto("/performance/concurrent-queries");

      await page.click('[data-testid="start-concurrent-queries"]');
      await page.waitForSelector('[data-testid="all-queries-completed"]');

      const nextUnifiedMetrics = await page.evaluate(() => {
        return window.__NEXT_UNIFIED_QUERY_ADVANCED_METRICS__;
      });

      // 개발자 경험 지표 검증
      expect(nextUnifiedMetrics.userExperience.timeToFirstData).toBeLessThan(20); // 매우 빠른 첫 데이터
      expect(nextUnifiedMetrics.userExperience.immediateDisplay).toBe(100); // 모든 응답이 즉시 표시

      console.log("Next Unified Query 개발자 경험:", nextUnifiedMetrics.userExperience);
    });
  });

  test.describe("Cross-Library Fair Comparison", () => {
    test("각 라이브러리의 강점 영역 비교", async ({ page }) => {
      // 각 라이브러리 테스트 실행 및 결과 수집
      const results = {
        swr: null as any,
        tanstack: null as any,
        nextUnified: null as any,
      };

      // SWR 테스트
      await page.goto("/benchmark/swr");
      await page.click('[data-testid="start-swr-concurrent-queries"]');
      await page.waitForSelector('[data-testid="swr-all-queries-completed"]');
      results.swr = await page.evaluate(() => window.__SWR_ADVANCED_METRICS__);

      // TanStack Query 테스트
      await page.goto("/benchmark/tanstack-query");
      await page.click('[data-testid="start-tanstack-concurrent-queries"]');
      await page.waitForSelector('[data-testid="tanstack-all-queries-completed"]');
      results.tanstack = await page.evaluate(() => window.__TANSTACK_QUERY_ADVANCED_METRICS__);

      // Next Unified Query 테스트
      await page.goto("/performance/concurrent-queries");
      await page.click('[data-testid="start-concurrent-queries"]');
      await page.waitForSelector('[data-testid="all-queries-completed"]');
      results.nextUnified = await page.evaluate(() => window.__NEXT_UNIFIED_QUERY_ADVANCED_METRICS__);

      // 각 라이브러리의 강점 영역에서 우위 확인
      
      // SWR: 사용자 체감 성능에서 우위 (stale data 즉시 제공)
      expect(results.swr.userExperience.immediateDisplay).toBeGreaterThanOrEqual(
        Math.min(results.tanstack.userExperience.immediateDisplay, results.nextUnified.userExperience.immediateDisplay)
      );

      // TanStack Query: 네트워크 효율성에서 우위 (조건부 캐싱)
      expect(results.tanstack.networkEfficiency.bandwidthSaved).toBeGreaterThanOrEqual(
        results.swr.networkEfficiency.bandwidthSaved
      );

      // Next Unified Query: 절대적 캐시 성능에서 우위
      expect(results.nextUnified.librarySpecific.absoluteCacheEfficiency.trueCacheHits).toBeGreaterThanOrEqual(
        Math.max(
          results.swr.userExperience.immediateDisplay,
          results.tanstack.librarySpecific.conditionalCacheEfficiency.intelligentCacheHits
        )
      );

      console.log("공정한 라이브러리 비교 결과:", {
        swr: {
          immediateDisplay: results.swr.userExperience.immediateDisplay,
          stalenessAcceptability: results.swr.librarySpecific.staleWhileRevalidateEfficiency.stalenessAcceptability
        },
        tanstack: {
          networkEfficiency: results.tanstack.networkEfficiency.bandwidthSaved,
          intelligentCaching: results.tanstack.librarySpecific.conditionalCacheEfficiency.intelligentCacheHits
        },
        nextUnified: {
          absoluteCache: results.nextUnified.librarySpecific.absoluteCacheEfficiency.trueCacheHits,
          consistency: results.nextUnified.librarySpecific.absoluteCacheEfficiency.cacheConsistency
        }
      });
    });
  });

  test.describe("Real-World Scenario Testing", () => {
    test("시나리오 1: 자주 변경되는 데이터 (SWR 최적)", async ({ page }) => {
      // SWR의 stale-while-revalidate가 유리한 시나리오
      test.setTimeout(120000);
      
      await page.goto("/benchmark/swr");
      
      // 연속적인 데이터 업데이트 시뮬레이션
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="start-swr-concurrent-queries"]');
        await page.waitForSelector('[data-testid="swr-all-queries-completed"]');
        await page.waitForTimeout(3000); // 데이터 변경 시뮬레이션
      }

      const swrMetrics = await page.evaluate(() => window.__SWR_ADVANCED_METRICS__);
      
      // SWR이 이 시나리오에서 우위를 보여야 함
      expect(swrMetrics.userExperience.immediateDisplay).toBeGreaterThan(80);
      expect(swrMetrics.librarySpecific.staleWhileRevalidateEfficiency.stalenessAcceptability).toBeGreaterThan(0.8);
    });

    test("시나리오 2: 안정적인 데이터 + 효율성 중시 (TanStack Query 최적)", async ({ page }) => {
      // TanStack Query의 조건부 캐싱이 유리한 시나리오
      test.setTimeout(90000);
      
      await page.goto("/benchmark/tanstack-query");
      
      // 초기 로드 후 안정적인 데이터 액세스 패턴
      await page.click('[data-testid="start-tanstack-concurrent-queries"]');
      await page.waitForSelector('[data-testid="tanstack-all-queries-completed"]');
      
      // staleTime 내에서 반복 접근
      for (let i = 0; i < 3; i++) {
        await page.waitForTimeout(2000);
        await page.click('[data-testid="start-tanstack-concurrent-queries"]');
        await page.waitForSelector('[data-testid="tanstack-all-queries-completed"]');
      }

      const tanstackMetrics = await page.evaluate(() => window.__TANSTACK_QUERY_ADVANCED_METRICS__);
      
      // TanStack Query가 이 시나리오에서 우위를 보여야 함
      expect(tanstackMetrics.networkEfficiency.actualNetworkRequests).toBeLessThan(50);
      expect(tanstackMetrics.librarySpecific.conditionalCacheEfficiency.staleTimeRespected).toBeGreaterThan(0.9);
    });

    test("시나리오 3: 대규모 애플리케이션 + 성능 최우선 (Next Unified Query 최적)", async ({ page }) => {
      // Next Unified Query의 절대적 캐시가 유리한 시나리오
      test.setTimeout(90000);
      
      await page.goto("/performance/concurrent-queries");
      
      // 초기 캐시 구축
      await page.click('[data-testid="start-concurrent-queries"]');
      await page.waitForSelector('[data-testid="all-queries-completed"]');
      
      // 반복적인 대량 액세스
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(1000);
        await page.click('[data-testid="start-concurrent-queries"]');
        await page.waitForSelector('[data-testid="all-queries-completed"]');
      }

      const nextUnifiedMetrics = await page.evaluate(() => window.__NEXT_UNIFIED_QUERY_ADVANCED_METRICS__);
      
      // Next Unified Query가 이 시나리오에서 우위를 보여야 함
      expect(nextUnifiedMetrics.librarySpecific.absoluteCacheEfficiency.trueCacheHits).toBe(100);
      expect(nextUnifiedMetrics.librarySpecific.absoluteCacheEfficiency.zeroNetworkRequests).toBe(100);
      expect(nextUnifiedMetrics.userExperience.timeToFirstData).toBeLessThan(10);
    });
  });
});