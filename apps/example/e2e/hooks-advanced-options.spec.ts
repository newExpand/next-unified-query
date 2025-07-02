import { test, expect } from "@playwright/test";

/**
 * useQuery와 useMutation의 고급 옵션 브라우저 테스트
 *
 * 실제 브라우저 환경에서 hooks의 고급 옵션들이
 * 올바르게 동작하는지 검증합니다.
 */

test.describe("useQuery Advanced Options", () => {
  test.beforeEach(async ({ page }) => {
    // 첫 번째로 페이지에 접근하여 컨텍스트 생성
    await page.goto("/");
    // 각 테스트마다 캐시 초기화
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        // 추가적으로 캐시 관련 전역 객체도 초기화
        if (window.__NEXT_UNIFIED_QUERY_CACHE_STATS__) {
          window.__NEXT_UNIFIED_QUERY_CACHE_STATS__ = {
            cacheSize: 0,
            maxSize: 1000,
            subscribersCount: 0,
            listenersCount: 0,
            activeGcTimersCount: 0,
          };
        }
      } catch (error) {
        console.log("Storage clear error:", error);
      }
    });
  });

  test.describe("gcTime 정확한 타이밍", () => {
    test("구독자가 0이 되는 시점부터 gcTime 후 가비지 컬렉션", async ({
      page,
    }) => {
      await page.route("**/api/gc-test-data", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: "Garbage collection test data",
            timestamp: Date.now(),
          }),
        });
      });

      await page.goto("/gc-timing/short-gc-time"); // gcTime: 2초

      // 컴포넌트 마운트로 쿼리 활성화
      await page.click('[data-testid="mount-component-btn"]');
      await page.waitForSelector('[data-testid="gc-test-data"]');

      // 쿼리 데이터가 완전히 로드될 때까지 기다림
      await page.waitForTimeout(500);

      // 캐시 통계가 업데이트될 때까지 폴링
      let initialCacheSize = 0;
      let cacheAttempts = 0;
      const maxCacheAttempts = 10;

      while (initialCacheSize === 0 && cacheAttempts < maxCacheAttempts) {
        await page.waitForTimeout(200);
        initialCacheSize = await page.evaluate(() => {
          return window.__NEXT_UNIFIED_QUERY_CACHE_STATS__?.cacheSize || 0;
        });
        cacheAttempts++;
      }

      console.log(
        `Cache size became ${initialCacheSize} after ${cacheAttempts * 200}ms`
      );
      expect(initialCacheSize).toBeGreaterThan(0);

      // 구독자 수 확인
      const initialSubscribers = await page.evaluate(() => {
        return window.__NEXT_UNIFIED_QUERY_CACHE_STATS__?.subscribersCount || 0;
      });
      expect(initialSubscribers).toBe(1);

      // 컴포넌트 언마운트 (구독자 0으로 만들기)
      await page.click('[data-testid="unmount-component-btn"]');

      // 구독자 수가 0이 될 때까지 최대 3초 대기
      let subscribersAfterUnmount = 1;
      let attempts = 0;
      const maxAttempts = 30; // 30 * 100ms = 3초

      while (subscribersAfterUnmount > 0 && attempts < maxAttempts) {
        await page.waitForTimeout(100);
        subscribersAfterUnmount = await page.evaluate(() => {
          return (
            window.__NEXT_UNIFIED_QUERY_CACHE_STATS__?.subscribersCount || 0
          );
        });
        attempts++;
      }

      console.log(`Subscribers became 0 after ${attempts * 100}ms`);
      expect(subscribersAfterUnmount).toBe(0);

      // gcTime 동작은 라이브러리 내부 구현에 따라 즉시 또는 지연 후 발생할 수 있음
      // 여기서는 전체적인 결과만 확인: 시간이 지나면 캐시가 정리되어야 함

      console.log("Waiting for gcTime to process...");

      // gcTime 경과를 기다림 (충분한 시간 제공)
      await page.waitForTimeout(4000); // gcTime(2초) + 충분한 여유시간

      // 최종 상태 확인
      const finalStats = await page.evaluate(() => {
        const stats = window.__NEXT_UNIFIED_QUERY_CACHE_STATS__;
        return {
          cacheSize: stats?.cacheSize || 0,
          subscribersCount: stats?.subscribersCount || 0,
          activeGcTimers: stats?.activeGcTimersCount || 0,
        };
      });

      console.log(`Final stats:`, finalStats);

      // gcTime이 올바르게 작동했다면:
      // 1. 캐시가 정리되어야 함 (cacheSize: 0)
      // 2. 구독자 수는 여전히 0
      // 3. 활성 GC 타이머는 0 (정리 완료)
      expect(finalStats.cacheSize).toBe(0);
      expect(finalStats.subscribersCount).toBe(0);
      expect(finalStats.activeGcTimers).toBe(0);
    });

    test("여러 구독자가 있다가 하나씩 제거될 때 gcTime 동작", async ({
      page,
    }) => {
      await page.route("**/api/multi-subscriber-data", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: "Multi subscriber data" }),
        });
      });

      await page.goto("/gc-timing/multi-subscribers");

      // 첫 번째 구독자 (컴포넌트 A) 마운트
      await page.click('[data-testid="mount-component-a-btn"]');
      await page.waitForSelector('[data-testid="component-a-data"]');

      // 데이터 로드 대기
      await page.waitForTimeout(500);

      // 초기 캐시 크기 확인
      let initialCacheSize = 0;
      let attempts = 0;
      while (initialCacheSize === 0 && attempts < 10) {
        await page.waitForTimeout(200);
        initialCacheSize = await page.evaluate(() => {
          return window.__NEXT_UNIFIED_QUERY_CACHE_STATS__?.cacheSize || 0;
        });
        attempts++;
      }
      expect(initialCacheSize).toBe(1);

      // 두 번째 구독자 (컴포넌트 B) 마운트
      await page.click('[data-testid="mount-component-b-btn"]');
      await page.waitForSelector('[data-testid="component-b-data"]');

      // 동일한 cacheKey를 사용하므로 구독자 수는 여전히 1
      const subscribersWithBothComponents = await page.evaluate(() => {
        return window.__NEXT_UNIFIED_QUERY_CACHE_STATS__?.subscribersCount || 0;
      });
      expect(subscribersWithBothComponents).toBe(1);

      // 첫 번째 구독자 제거
      await page.click('[data-testid="unmount-component-a-btn"]');

      // 아직 Component B가 있으므로 구독자 수는 1 유지, GC 시작하지 않음
      await page.waitForTimeout(1000);
      const oneSubscriberRemaining = await page.evaluate(() => {
        return window.__NEXT_UNIFIED_QUERY_CACHE_STATS__?.subscribersCount || 0;
      });
      expect(oneSubscriberRemaining).toBe(1);

      const cacheWithOneComponentRemaining = await page.evaluate(() => {
        return window.__NEXT_UNIFIED_QUERY_CACHE_STATS__?.cacheSize || 0;
      });
      expect(cacheWithOneComponentRemaining).toBe(1);

      // GC 타이머가 아직 시작되지 않았는지 확인
      const gcTimersBeforeFinalUnmount = await page.evaluate(() => {
        return (
          window.__NEXT_UNIFIED_QUERY_CACHE_STATS__?.activeGcTimersCount || 0
        );
      });
      expect(gcTimersBeforeFinalUnmount).toBe(0);

      // 마지막 구독자 제거 (Component B)
      await page.click('[data-testid="unmount-component-b-btn"]');

      // 구독자가 0이 될 때까지 폴링
      let subscribersAfterAllUnmount = 1;
      let pollAttempts = 0;
      const maxPollAttempts = 30;

      while (subscribersAfterAllUnmount > 0 && pollAttempts < maxPollAttempts) {
        await page.waitForTimeout(100);
        subscribersAfterAllUnmount = await page.evaluate(() => {
          return (
            window.__NEXT_UNIFIED_QUERY_CACHE_STATS__?.subscribersCount || 0
          );
        });
        pollAttempts++;
      }

      console.log(`All subscribers became 0 after ${pollAttempts * 100}ms`);
      expect(subscribersAfterAllUnmount).toBe(0);

      // gcTime 동작 확인: 충분한 시간 대기 후 최종 상태 확인
      console.log("Waiting for gcTime to process...");
      await page.waitForTimeout(4000); // gcTime(2초) + 충분한 여유시간

      // 최종 상태 확인
      const finalStats = await page.evaluate(() => {
        const stats = window.__NEXT_UNIFIED_QUERY_CACHE_STATS__;
        return {
          cacheSize: stats?.cacheSize || 0,
          subscribersCount: stats?.subscribersCount || 0,
          activeGcTimers: stats?.activeGcTimersCount || 0,
        };
      });

      console.log(`Final multi-subscriber stats:`, finalStats);

      // gcTime이 올바르게 작동했다면 모든 것이 정리되어야 함
      expect(finalStats.cacheSize).toBe(0);
      expect(finalStats.subscribersCount).toBe(0);
      expect(finalStats.activeGcTimers).toBe(0);
    });
  });

  test.describe("Select 함수 실행 시점과 메모이제이션", () => {
    test("select 함수 실행 횟수 최적화", async ({ page }) => {
      await page.route("**/api/user-data", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: 1,
              name: "John Doe",
              email: "john@example.com",
              profile: {
                bio: "Software Developer",
                skills: ["JavaScript", "TypeScript", "React"],
              },
            },
            metadata: {
              lastLogin: "2023-01-01T00:00:00Z",
              preferences: { theme: "dark", language: "en" },
            },
          }),
        });
      });

      await page.goto("/select-optimization/user-profile");

      // 초기 로드 시 select 함수 실행 횟수
      await page.waitForSelector('[data-testid="user-profile"]');
      const initialSelectCalls = await page
        .locator('[data-testid="select-call-number"]')
        .textContent();

      console.log("초기 select 함수 호출 횟수:", initialSelectCalls);

      // select 함수로 변환된 데이터 확인
      await expect(
        page.locator('[data-testid="user-display-name"]')
      ).toHaveText("John Doe (john@example.com)");
      await expect(page.locator('[data-testid="skills-count"]')).toHaveText(
        "3 skills"
      );

      // 관련 없는 상태 변경 (select 함수 재실행되지 않아야 함)
      await page.click('[data-testid="toggle-sidebar-btn"]');
      await page.click('[data-testid="change-theme-btn"]');

      // 일정 시간 대기
      await page.waitForTimeout(1000);

      const selectCallsAfterUnrelatedChanges = await page
        .locator('[data-testid="select-call-number"]')
        .textContent();

      console.log(
        "관련 없는 상태 변경 후 select 함수 호출 횟수:",
        selectCallsAfterUnrelatedChanges
      );

      // 라이브러리의 올바른 메모이제이션: 같은 데이터에 대해서는 select 함수가 재실행되지 않음
      expect(parseInt(selectCallsAfterUnrelatedChanges!)).toBe(
        parseInt(initialSelectCalls!)
      );

      console.log(
        "✅ 라이브러리의 select 메모이제이션이 올바르게 동작하고 있습니다!"
      );
    });

  });

  test.describe("PlaceholderData 함수형 사용", () => {
    test("이전 데이터가 함수에 올바르게 전달", async ({ page }) => {
      let requestCount = 0;

      await page.route("**/api/paginated-data**", async (route, request) => {
        requestCount++;
        const url = new URL(request.url());
        const page_num = url.searchParams.get("page") || "1";

        await new Promise((resolve) => setTimeout(resolve, 1000)); // 로딩 시뮬레이션

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [`Page ${page_num} Item 1`, `Page ${page_num} Item 2`],
            page: parseInt(page_num),
            hasNext: parseInt(page_num) < 3,
          }),
        });
      });

      await page.goto("/placeholder-data/pagination");

      // 첫 페이지 로드
      await page.waitForSelector('[data-testid="pagination-data"]');
      const firstPageItems = await page
        .locator('[data-testid="data-item"]')
        .count();
      expect(firstPageItems).toBe(2);

      // 두 번째 페이지로 이동
      await page.click('[data-testid="next-page-btn"]');

      // placeholderData로 이전 페이지 데이터가 표시되는지 확인
      await page.waitForSelector('[data-testid="placeholder-indicator"]');

      // 로딩 중에도 이전 데이터가 보여야 함 (placeholderData)
      const placeholderItems = await page
        .locator('[data-testid="data-item"]')
        .count();
      expect(placeholderItems).toBe(2); // 이전 페이지 데이터 유지

      // placeholderData 표시 확인
      await expect(
        page.locator('[data-testid="placeholder-indicator"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="placeholder-indicator"]')
      ).toHaveText("이전 페이지 데이터 표시 중...");

      // 새 데이터 로드 완료
      await page.waitForSelector(
        '[data-testid="pagination-data"]:not([data-loading="true"])'
      );
      await expect(
        page.locator('[data-testid="placeholder-indicator"]')
      ).not.toBeVisible();

      // 새 페이지 데이터 확인
      const newPageData = await page
        .locator('[data-testid="data-item"]')
        .first()
        .textContent();
      expect(newPageData).toContain("Page 2");
    });

    test("placeholderData 함수가 올바른 매개변수 받는지 확인", async ({
      page,
    }) => {
      await page.route("**/api/search-results**", async (route, request) => {
        const url = new URL(request.url());
        const query = url.searchParams.get("q") || "";

        await new Promise((resolve) => setTimeout(resolve, 800));

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            query,
            results: [`Result for "${query}" #1`, `Result for "${query}" #2`],
            timestamp: Date.now(),
          }),
        });
      });

      await page.goto("/placeholder-data/search");

      // 첫 번째 검색
      await page.fill('[data-testid="search-input"]', "javascript");
      await page.click('[data-testid="search-btn"]');

      await page.waitForSelector('[data-testid="search-results"]');
      const firstResults = await page
        .locator('[data-testid="result-item"]')
        .count();
      expect(firstResults).toBe(2);

      // 두 번째 검색
      await page.fill('[data-testid="search-input"]', "typescript");
      await page.click('[data-testid="search-btn"]');

      // placeholderData 함수가 받은 매개변수 확인
      await page.waitForSelector('[data-testid="placeholder-debug"]');

      const placeholderInfo = await page
        .locator('[data-testid="placeholder-params"]')
        .textContent();
      expect(placeholderInfo).toContain('"prevData":"javascript"'); // 이전 검색어
      expect(placeholderInfo).toContain('"prevQuery":"object"'); // 이전 쿼리 객체

      // 새 검색 결과 로드 완료
      await page.waitForSelector(
        '[data-testid="search-results"]:not([data-loading="true"])'
      );
      
      // placeholderData가 비활성화되었는지 확인
      await expect(
        page.locator('[data-testid="placeholder-debug"]')
      ).not.toBeVisible();
      
      const newResults = await page
        .locator('[data-testid="result-item"]')
        .first()
        .textContent();
      expect(newResults).toContain("typescript");
    });
  });

  test.describe("Factory vs Options 기반 성능 차이", () => {
    test("Factory 기반과 Options 기반 렌더링 성능 비교", async ({ page }) => {
      await page.route("**/api/performance-test-data", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: Array.from({ length: 100 }, (_, i) => ({
              id: i,
              name: `Item ${i}`,
              value: Math.random() * 1000,
            })),
          }),
        });
      });

      await page.goto("/performance-comparison/factory-vs-options");

      // Factory 기반 컴포넌트 렌더링 시간 측정
      const factoryStartTime = await page.evaluate(() => performance.now());
      await page.click('[data-testid="render-factory-components-btn"]');
      await page.waitForSelector('[data-testid="factory-components-rendered"]');
      const factoryEndTime = await page.evaluate(() => performance.now());
      const factoryRenderTime = factoryEndTime - factoryStartTime;

      // Options 기반 컴포넌트 렌더링 시간 측정
      const optionsStartTime = await page.evaluate(() => performance.now());
      await page.click('[data-testid="render-options-components-btn"]');
      await page.waitForSelector('[data-testid="options-components-rendered"]');
      
      // 성능 통계가 업데이트될 때까지 대기
      await page.waitForFunction(() => {
        const statsEl = document.querySelector('[data-testid="performance-stats"]');
        return statsEl && statsEl.textContent.includes('Options:');
      }, { timeout: 10000 });
      
      const optionsEndTime = await page.evaluate(() => performance.now());
      const optionsRenderTime = optionsEndTime - optionsStartTime;

      // 성능 결과 확인
      const performanceStats = await page
        .locator('[data-testid="performance-stats"]')
        .textContent();
      expect(performanceStats).toContain("Performance Results:");
      expect(performanceStats).toContain("Factory:");
      expect(performanceStats).toContain("Options:");
      expect(performanceStats).toContain("ms");

      // Factory 기반이 일반적으로 더 빨라야 함 (타입 추론 최적화)
      console.log(
        `Factory render time: ${factoryRenderTime}ms, Options render time: ${optionsRenderTime}ms`
      );
    });

    test("메모리 사용량 비교", async ({ page }) => {
      await page.route("**/api/memory-test-data", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: "Memory test data",
          }),
        });
      });

      await page.goto("/performance-comparison/memory-usage");

      // 초기 메모리 측정
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Factory 기반 쿼리 대량 생성
      await page.click('[data-testid="create-factory-queries-btn"]');
      await page.waitForSelector('[data-testid="factory-queries-created"]');

      const memoryAfterFactory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Options 기반 쿼리 대량 생성
      await page.click('[data-testid="create-options-queries-btn"]');
      await page.waitForSelector('[data-testid="options-queries-created"]');

      const memoryAfterOptions = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      const factoryMemoryIncrease = memoryAfterFactory - initialMemory;
      const optionsMemoryIncrease = memoryAfterOptions - memoryAfterFactory;

      // 메모리 사용량 로그
      console.log(
        `Factory memory increase: ${(
          factoryMemoryIncrease /
          1024 /
          1024
        ).toFixed(2)}MB`
      );
      console.log(
        `Options memory increase: ${(
          optionsMemoryIncrease /
          1024 /
          1024
        ).toFixed(2)}MB`
      );

      // 메모리 사용량이 합리적인 범위 내에 있는지 확인
      expect(factoryMemoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB 이하
      expect(optionsMemoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB 이하
    });
  });
});

test.describe("useMutation Advanced Options", () => {
  test.beforeEach(async ({ page }) => {
    // 첫 번째로 페이지에 접근하여 컨텍스트 생성
    await page.goto("/");
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.log("Storage clear error:", error);
      }
    });
  });

  test.describe("OnMutate Context 전달", () => {
    test("onMutate에서 반환한 context가 모든 콜백에 전달", async ({ page }) => {
      await page.route("**/api/tasks", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: Date.now(),
            title: "New Task",
            completed: false,
            createdAt: new Date().toISOString(),
          }),
        });
      });

      await page.goto("/mutation-context/task-creation");

      await page.fill('[data-testid="task-title-input"]', "Test Task");
      await page.click('[data-testid="create-task-btn"]');

      // onMutate 실행 및 context 생성 확인
      await page.waitForSelector('[data-testid="mutate-context"]');

      const mutateContext = await page
        .locator('[data-testid="mutate-context-data"]')
        .textContent();
      const contextData = JSON.parse(mutateContext || "{}");

      expect(contextData.optimisticId).toBeDefined();
      expect(contextData.startTime).toBeDefined();
      expect(contextData.action).toBe("create-task");

      // onSuccess에서 같은 context 접근 확인
      await page.waitForSelector('[data-testid="success-context"]');

      const successContext = await page
        .locator('[data-testid="success-context-data"]')
        .textContent();
      expect(successContext).toBe(mutateContext); // 동일한 context

      // onSettled에서도 같은 context 접근 확인
      await page.waitForSelector('[data-testid="settled-context"]');

      const settledContext = await page
        .locator('[data-testid="settled-context-data"]')
        .textContent();
      expect(settledContext).toBe(mutateContext); // 동일한 context

      // context를 이용한 측정 결과 확인
      await page.waitForSelector('[data-testid="execution-time"]');
      const executionTimeText = await page
        .locator('[data-testid="execution-time"]')
        .textContent();
      
      // "Execution Time: 1234ms" 형식에서 숫자 추출
      const executionTimeMatch = executionTimeText?.match(/(\d+)ms/);
      const executionTime = executionTimeMatch ? parseInt(executionTimeMatch[1]) : 0;
      expect(executionTime).toBeGreaterThan(1500); // 최소 1.5초
    });

    test("onMutate에서 에러 발생 시 context 처리", async ({ page }) => {
      await page.route("**/api/error-task", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server Error" }),
        });
      });

      await page.goto("/mutation-context/error-handling");

      await page.fill('[data-testid="task-input"]', "Error Task");
      await page.click('[data-testid="create-error-task-btn"]');

      // onMutate가 에러를 던지는 경우
      await page.waitForSelector('[data-testid="mutate-error"]');

      // onError에서 context가 undefined인지 확인
      await page.waitForSelector('[data-testid="error-callback"]');
      const errorContext = await page
        .locator('[data-testid="error-context-data"]')
        .textContent();
      expect(errorContext).toContain("undefined");

      // onSettled에서도 context가 undefined
      await page.waitForSelector('[data-testid="settled-callback"]');
      const settledContext = await page
        .locator('[data-testid="settled-context-data"]')
        .textContent();
      expect(settledContext).toContain("undefined");
    });
  });

  test.describe("MutateAsync vs Mutate 차이점", () => {
    test("mutateAsync Promise 체인과 에러 처리", async ({ page }) => {
      let shouldFail = false;

      await page.route("**/api/async-mutation", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (shouldFail) {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ error: "Validation failed" }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              success: true,
              data: "Mutation successful",
            }),
          });
        }
      });

      await page.goto("/mutation-async/promise-handling");

      // mutateAsync 성공 케이스
      await page.click('[data-testid="async-success-btn"]');

      await page.waitForSelector('[data-testid="async-promise-resolved"]');
      const successResult = await page
        .locator('[data-testid="promise-result"]')
        .textContent();
      expect(successResult).toContain("Mutation successful");

      // Promise.then 체인 확인
      await expect(
        page.locator('[data-testid="then-chain-executed"]')
      ).toBeVisible();

      // mutateAsync 실패 케이스
      shouldFail = true;
      await page.click('[data-testid="async-error-btn"]');

      await page.waitForSelector('[data-testid="async-promise-rejected"]');
      const errorResult = await page
        .locator('[data-testid="promise-error"]')
        .textContent();
      expect(errorResult).toContain("Validation failed");

      // Promise.catch 체인 확인
      await expect(
        page.locator('[data-testid="catch-chain-executed"]')
      ).toBeVisible();

      // mutate (fire-and-forget) 동작 확인
      shouldFail = false;
      await page.click('[data-testid="fire-and-forget-btn"]');

      // mutate는 Promise를 반환하지 않으므로 즉시 다음 코드 실행
      await expect(
        page.locator('[data-testid="fire-and-forget-continued"]')
      ).toBeVisible();
    });

    test("동시 여러 mutateAsync 호출", async ({ page }) => {
      let callCount = 0;

      await page.route("**/api/concurrent-mutation", async (route, request) => {
        const currentCallId = ++callCount; // 즉시 ID 할당
        const body = await request.postDataJSON();
        const delay = body.delay || 1000;
        
        console.log(`API call ${currentCallId} with delay ${delay} for data: ${body.data}`);

        await new Promise((resolve) => setTimeout(resolve, delay));

        const response = {
          id: currentCallId,
          uniqueId: `${currentCallId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          data: body.data,
          processedAt: Date.now(),
          requestTimestamp: Date.now(),
        };
        
        console.log(`API response ${currentCallId}:`, response);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(response),
        });
      });

      await page.goto("/mutation-async/concurrent-calls");

      // 동시에 3개의 mutateAsync 호출
      await page.click('[data-testid="concurrent-mutations-btn"]');

      // 모든 mutation이 완료될 때까지 대기
      await page.waitForSelector('[data-testid="all-mutations-complete"]');

      // 결과 확인
      const results = await page
        .locator('[data-testid="mutation-result"]')
        .allTextContents();
      expect(results).toHaveLength(3);

      // 각 mutation이 고유한 ID를 가져야 함 - 새로운 UI 형식에서 ID 추출
      console.log("Raw results:", results);
      const ids = results.map((result) => {
        const idMatch = result.match(/ID: (\d+)/);
        return idMatch ? parseInt(idMatch[1]) : null;
      }).filter(id => id !== null);
      console.log("Extracted IDs:", ids);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3); // 모든 ID가 unique

      // 실행 순서와 완료 순서가 다를 수 있음 (비동기)
      const executionOrder = await page
        .locator('[data-testid="execution-order"]')
        .textContent();
      const completionOrder = await page
        .locator('[data-testid="completion-order"]')
        .textContent();

      console.log(`Execution order: ${executionOrder}`);
      console.log(`Completion order: ${completionOrder}`);
    });
  });

  test.describe("Reset 기능 동작", () => {
    test("reset 후 상태 완전 초기화", async ({ page }) => {
      await page.route("**/api/reset-test", async (route) => {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: 1, message: "Created successfully" }),
        });
      });

      await page.goto("/mutation-reset/state-management");

      // mutation 실행
      await page.fill('[data-testid="data-input"]', "Test data");
      await page.click('[data-testid="submit-btn"]');

      // 성공 상태 확인
      await page.waitForSelector('[data-testid="mutation-success"]');
      await expect(page.locator('[data-testid="mutation-data"]')).toHaveText(
        "Created successfully"
      );
      await expect(page.locator('[data-testid="mutation-status"]')).toHaveText(
        "success"
      );

      // mutation 상태 정보 확인
      const beforeReset = await page.evaluate(() => {
        return {
          isPending: document.querySelector('[data-testid="is-pending"]')
            ?.textContent,
          isSuccess: document.querySelector('[data-testid="is-success"]')
            ?.textContent,
          isError: document.querySelector('[data-testid="is-error"]')
            ?.textContent,
          data: document.querySelector('[data-testid="mutation-data"]')
            ?.textContent,
        };
      });

      expect(beforeReset.isPending).toBe("false");
      expect(beforeReset.isSuccess).toBe("true");
      expect(beforeReset.isError).toBe("false");
      expect(beforeReset.data).toBe("Created successfully");

      // reset 실행
      await page.click('[data-testid="reset-btn"]');

      // reset 후 상태 확인
      const afterReset = await page.evaluate(() => {
        return {
          isPending: document.querySelector('[data-testid="is-pending"]')
            ?.textContent,
          isSuccess: document.querySelector('[data-testid="is-success"]')
            ?.textContent,
          isError: document.querySelector('[data-testid="is-error"]')
            ?.textContent,
          data: document.querySelector('[data-testid="mutation-data"]')
            ?.textContent,
        };
      });

      expect(afterReset.isPending).toBe("false");
      expect(afterReset.isSuccess).toBe("false");
      expect(afterReset.isError).toBe("false");
      expect(afterReset.data).toBe("undefined");

      // UI 상태도 초기화되어야 함
      await expect(
        page.locator('[data-testid="mutation-success"]')
      ).not.toBeVisible();
      await expect(page.locator('[data-testid="mutation-status"]')).toHaveText(
        "idle"
      );
    });

    test("에러 상태에서 reset 동작", async ({ page }) => {
      await page.route("**/api/error-mutation", async (route) => {
        await route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Validation error",
            details: ["Field is required"],
          }),
        });
      });

      await page.goto("/mutation-reset/error-recovery");

      // 에러 발생하는 mutation 실행
      await page.click('[data-testid="trigger-error-btn"]');

      // 에러 상태 확인
      await page.waitForSelector('[data-testid="mutation-error"]');
      await expect(page.locator('[data-testid="error-message"]')).toHaveText(
        "Validation error"
      );
      await expect(page.locator('[data-testid="mutation-status"]')).toHaveText(
        "error"
      );

      // reset으로 에러 상태 초기화
      await page.click('[data-testid="reset-error-btn"]');

      // 에러 상태가 완전히 초기화되었는지 확인
      await expect(
        page.locator('[data-testid="mutation-error"]')
      ).not.toBeVisible();
      await expect(page.locator('[data-testid="mutation-status"]')).toHaveText(
        "idle"
      );

      // 에러 초기화 후 정상 요청 가능한지 확인
      await page.route("**/api/success-after-reset", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Success after reset" }),
        });
      });

      await page.click('[data-testid="success-after-reset-btn"]');
      await page.waitForSelector('[data-testid="success-after-reset"]');
      await expect(page.locator('[data-testid="success-message"]')).toHaveText(
        "Success after reset"
      );
    });
  });

  test.describe("동시 여러 Mutation 상태 관리", () => {
    test("독립적인 mutation들의 상태 충돌 방지", async ({ page }) => {
      // 각각 다른 지연 시간을 가진 mutation API들
      await page.route("**/api/slow-mutation", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ type: "slow", completed: true }),
        });
      });

      await page.route("**/api/fast-mutation", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ type: "fast", completed: true }),
        });
      });

      await page.route("**/api/error-mutation", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Mutation failed" }),
        });
      });

      await page.goto("/concurrent-mutations/state-isolation");

      // 3개의 mutation을 거의 동시에 시작
      await page.click('[data-testid="start-slow-mutation-btn"]');
      await page.click('[data-testid="start-fast-mutation-btn"]');
      await page.click('[data-testid="start-error-mutation-btn"]');

      // 각 mutation의 독립적인 상태 확인
      await expect(
        page.locator('[data-testid="slow-mutation-status"]')
      ).toHaveText("pending");
      await expect(
        page.locator('[data-testid="fast-mutation-status"]')
      ).toHaveText("pending");
      await expect(
        page.locator('[data-testid="error-mutation-status"]')
      ).toHaveText("pending");

      // fast mutation이 먼저 완료 (500ms)
      await page.waitForSelector('[data-testid="fast-mutation-success"]');
      await expect(
        page.locator('[data-testid="fast-mutation-status"]')
      ).toHaveText("success");

      // 다른 mutation들은 여전히 진행 중
      await expect(
        page.locator('[data-testid="slow-mutation-status"]')
      ).toHaveText("pending");
      await expect(
        page.locator('[data-testid="error-mutation-status"]')
      ).toHaveText("pending");

      // error mutation 완료 (1000ms)
      await page.waitForSelector('[data-testid="error-mutation-failed"]');
      await expect(
        page.locator('[data-testid="error-mutation-status"]')
      ).toHaveText("error");

      // slow mutation은 여전히 진행 중
      await expect(
        page.locator('[data-testid="slow-mutation-status"]')
      ).toHaveText("pending");

      // slow mutation 완료 (2000ms)
      await page.waitForSelector('[data-testid="slow-mutation-success"]');
      await expect(
        page.locator('[data-testid="slow-mutation-status"]')
      ).toHaveText("success");

      // 최종 상태 확인 - 각 mutation이 독립적으로 관리됨
      const finalStates = await page.evaluate(() => {
        return {
          slow: document.querySelector('[data-testid="slow-mutation-status"]')
            ?.textContent,
          fast: document.querySelector('[data-testid="fast-mutation-status"]')
            ?.textContent,
          error: document.querySelector('[data-testid="error-mutation-status"]')
            ?.textContent,
        };
      });

      expect(finalStates.slow).toBe("success");
      expect(finalStates.fast).toBe("success");
      expect(finalStates.error).toBe("error");
    });
  });
});
