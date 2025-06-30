import { test, expect } from "@playwright/test";

/**
 * 인터셉터 체인 통합 E2E 테스트
 *
 * 실제 브라우저 환경에서 Request → Response → Error 인터셉터 체인이
 * 올바르게 동작하는지 검증합니다.
 */

test.describe("Interceptor Chain Integration", () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트마다 캐시 및 인터셉터 초기화 (페이지 이동 없이)
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // localStorage 접근 불가능한 경우 무시
      }
      // 전역 인터셉터 상태 초기화
      if (window.__INTERCEPTOR_LOGS__) {
        window.__INTERCEPTOR_LOGS__ = [];
      }
    });
  });

  test.describe("Request → Response → Error 체인 실행 순서", () => {
    test("정상 요청 시 Request → Response 인터셉터 순서", async ({ page }) => {
      await page.route("**/api/chain-test", async (route, request) => {
        // 인터셉터에서 추가된 헤더 확인
        const headers = request.headers();

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            receivedHeaders: {
              authorization: headers["authorization"],
              "x-request-id": headers["x-request-id"],
              "x-interceptor-chain": headers["x-interceptor-chain"],
            },
            success: true,
          }),
        });
      });

      await page.goto("/interceptor-chain/execution-order");

      // 페이지 로드 완료 대기
      await page.waitForLoadState("networkidle");

      // 인터셉터 등록 버튼 클릭
      await page.click('[data-testid="register-interceptors-btn"]');

      // API 호출 트리거
      await page.click('[data-testid="make-request-btn"]');

      // 응답 받을 때까지 대기
      await page.waitForSelector('[data-testid="request-complete"]');

      // 인터셉터 실행 순서 확인
      const executionLog = await page
        .locator('[data-testid="interceptor-execution-log"]')
        .textContent();
      const logEntries = JSON.parse(executionLog || "[]");

      // 예상 순서: Request Interceptor 1 → Request Interceptor 2 → Response Interceptor 1 → Response Interceptor 2
      expect(logEntries[0]).toContain("request-interceptor-1");
      expect(logEntries[1]).toContain("request-interceptor-2");
      expect(logEntries[2]).toContain("response-interceptor-1");
      expect(logEntries[3]).toContain("response-interceptor-2");

      // 헤더가 인터셉터 체인을 거쳐 올바르게 설정되었는지 확인
      const responseData = await page
        .locator('[data-testid="response-data"]')
        .textContent();
      const data = JSON.parse(responseData || "{}");

      expect(data.receivedHeaders.authorization).toBe(
        "Bearer interceptor-token"
      );
      expect(data.receivedHeaders["x-request-id"]).toBeDefined();
      expect(data.receivedHeaders["x-interceptor-chain"]).toBe("req1,req2");
    });

    test("에러 발생 시 Request → Error 인터셉터 순서", async ({ page }) => {
      await page.route("**/api/error-chain-test", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Internal Server Error",
            code: "INTERNAL_ERROR",
          }),
        });
      });

      await page.goto("/interceptor-chain/error-handling");

      // 에러 처리 인터셉터 등록
      await page.click('[data-testid="register-error-interceptors-btn"]');

      // 에러를 발생시키는 API 호출
      await page.click('[data-testid="trigger-error-btn"]');

      // 에러 처리 완료까지 대기
      await page.waitForSelector('[data-testid="error-handled"]');

      // 인터셉터 실행 순서 확인
      const errorExecutionLog = await page
        .locator('[data-testid="error-execution-log"]')
        .textContent();
      const logEntries = JSON.parse(errorExecutionLog || "[]");

      // 예상 순서: Request Interceptor → API Call (Error) → Error Interceptor
      expect(logEntries).toContain("request-interceptor");
      expect(logEntries).toContain("api-error-occurred");
      expect(logEntries).toContain("error-interceptor-handled");

      // 에러가 적절히 처리되어 사용자에게 표시되는지 확인
      const errorMessage = await page
        .locator('[data-testid="user-error-message"]')
        .textContent();
      expect(errorMessage).toBe(
        "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    });

    test("인터셉터에서 요청 변환 및 응답 수정", async ({ page }) => {
      await page.route("**/api/transform-test", async (route, request) => {
        const body = await request.postDataJSON();

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            originalData: body,
            processed: true,
          }),
        });
      });

      await page.goto("/interceptor-chain/data-transformation");

      // 데이터 변환 인터셉터 등록
      await page.click('[data-testid="register-transform-interceptors-btn"]');

      // 원본 데이터 입력
      await page.fill(
        '[data-testid="original-data-input"]',
        JSON.stringify({
          name: "test",
          value: 123,
          timestamp: "2023-01-01",
        })
      );

      await page.click('[data-testid="submit-data-btn"]');

      // 변환 결과 확인
      await page.waitForSelector('[data-testid="transformation-complete"]');

      // Request 인터셉터에서 변환된 데이터 확인
      const transformedRequestData = await page
        .locator('[data-testid="transformed-request"]')
        .textContent();
      const requestData = JSON.parse(transformedRequestData || "{}");

      expect(requestData.name).toBe("TEST"); // 대문자 변환
      expect(requestData.value).toBe(246); // 2배 증가
      expect(requestData.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
      ); // ISO 형식
      expect(requestData.processedBy).toBe("request-interceptor");

      // Response 인터셉터에서 추가 변환된 데이터 확인
      const finalResponseData = await page
        .locator('[data-testid="final-response"]')
        .textContent();
      const responseData = JSON.parse(finalResponseData || "{}");

      expect(responseData.processed).toBe(true);
      expect(responseData.enhancedBy).toBe("response-interceptor");
      expect(responseData.metadata.processedAt).toBeDefined();
    });
  });

  test.describe("인터셉터 타입별 동시 동작", () => {
    test("Auth, Logging, Error 인터셉터 동시 등록 및 동작", async ({
      page,
    }) => {
      let requestCount = 0;

      // Auth refresh API 모킹
      await page.route("**/api/auth/refresh", async (route, request) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            accessToken: "valid-token-123",
            refreshToken: "refresh_token_456",
            expiresIn: 3600,
            tokenType: "Bearer",
          }),
        });
      });

      await page.route(
        "**/api/multi-interceptor-test",
        async (route, request) => {
          requestCount++;
          const headers = request.headers();

          // 첫 번째 요청은 인증 실패로 시뮬레이션 (invalid-token인 경우)
          if (
            requestCount === 1 ||
            headers["authorization"]?.includes("invalid-token")
          ) {
            await route.fulfill({
              status: 401,
              contentType: "application/json",
              body: JSON.stringify({ error: "Unauthorized" }),
            });
            return;
          }

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: "Protected data",
              requestCount,
              headers: {
                authorization: headers["authorization"],
                "x-request-id": headers["x-request-id"],
                "x-user-agent": headers["x-user-agent"],
              },
            }),
          });
        }
      );

      await page.goto("/multi-interceptors/comprehensive-test");

      // 모든 타입의 인터셉터 등록
      await page.click('[data-testid="register-all-interceptors-btn"]');

      // 첫 번째 요청 (인증 실패 예상)
      await page.click('[data-testid="make-protected-request-btn"]');

      // Auth 인터셉터가 자동으로 토큰 갱신 후 재시도
      await page.waitForSelector('[data-testid="auth-retry-complete"]', {
        state: "attached",
      });

      // 로깅 인터셉터 기록 확인
      const loggingData = await page
        .locator('[data-testid="logging-data"]')
        .textContent();
      const logs = JSON.parse(loggingData || "[]");

      expect(
        logs.some((log: any) => log.type === "request" && log.attempt === 1)
      ).toBe(true);
      expect(
        logs.some((log: any) => log.type === "error" && log.status === 401)
      ).toBe(true);
      expect(
        logs.some((log: any) => log.type === "request" && log.attempt === 2)
      ).toBe(true);
      expect(
        logs.some((log: any) => log.type === "response" && log.status === 200)
      ).toBe(true);

      // 최종 응답 데이터 확인
      const finalData = await page
        .locator('[data-testid="protected-data"]')
        .textContent();
      expect(finalData).toBe("Protected data");

      // 총 요청 횟수 확인 (재시도 포함)
      const totalRequests = await page
        .locator('[data-testid="total-requests"]')
        .textContent();
      expect(totalRequests).toBe("2");
    });

    test("인터셉터 간 데이터 공유 및 상태 전파", async ({ page }) => {
      await page.route("**/api/shared-context", async (route, request) => {
        const headers = request.headers();

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sharedData: headers["x-shared-context"],
            correlationId: headers["x-correlation-id"],
            processingTime: headers["x-processing-time"],
          }),
        });
      });

      await page.goto("/interceptor-context/data-sharing");

      // 컨텍스트 공유 인터셉터 등록
      await page.click('[data-testid="register-context-interceptors-btn"]');

      await page.click('[data-testid="make-context-request-btn"]');

      await page.waitForSelector('[data-testid="context-response"]');

      // 인터셉터 간 공유된 컨텍스트 확인
      const contextData = await page
        .locator('[data-testid="shared-context-data"]')
        .textContent();
      const context = JSON.parse(contextData || "{}");

      expect(context.correlationId).toBeDefined();
      expect(context.sharedData).toContain("request-interceptor");
      expect(context.sharedData).toContain("response-interceptor");
      expect(context.processingTime).toBeDefined();

      // 전역 상태에 컨텍스트가 저장되었는지 확인
      const globalContext = await page.evaluate(() => {
        return window.__INTERCEPTOR_CONTEXT__;
      });

      expect(globalContext.currentRequestId).toBeDefined();
      expect(globalContext.requestHistory.length).toBeGreaterThan(0);
    });
  });

  test.describe("인터셉터 등록/해제 동적 관리", () => {
    test("인터셉터 등록 순서에 따른 실행 순서", async ({ page }) => {
      await page.route("**/api/order-test", async (route, request) => {
        const executionOrder = request.headers()["x-execution-order"];

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            executionOrder: executionOrder?.split(",") || [],
            success: true,
          }),
        });
      });

      await page.goto("/interceptor-management/registration-order");

      // 인터셉터를 특정 순서로 등록
      await page.click('[data-testid="register-interceptor-a-btn"]');
      await page.click('[data-testid="register-interceptor-b-btn"]');
      await page.click('[data-testid="register-interceptor-c-btn"]');

      await page.click('[data-testid="test-execution-order-btn"]');

      await page.waitForSelector('[data-testid="order-test-complete"]');

      const executionOrder = await page
        .locator('[data-testid="execution-order"]')
        .textContent();
      const order = JSON.parse(executionOrder || "[]");

      // 등록 순서대로 실행되어야 함: A → B → C
      expect(order).toEqual([
        "interceptor-a",
        "interceptor-b",
        "interceptor-c",
      ]);

      // 인터셉터 B 제거 후 다시 테스트
      await page.click('[data-testid="remove-interceptor-b-btn"]');
      await page.click('[data-testid="test-execution-order-btn"]');

      await page.waitForSelector('[data-testid="order-test-complete"]');

      const orderAfterRemoval = await page
        .locator('[data-testid="execution-order"]')
        .textContent();
      const newOrder = JSON.parse(orderAfterRemoval || "[]");

      // B가 제거되어 A → C 순서로 실행되어야 함
      expect(newOrder).toEqual(["interceptor-a", "interceptor-c"]);
    });

    test("인터셉터 제거 시 기존 요청에 미치는 영향", async ({ page }) => {
      let longRequestInProgress = false;

      await page.route("**/api/long-request", async (route, request) => {
        longRequestInProgress = true;
        const hasInterceptor = request.headers()["x-interceptor-present"];

        // 긴 요청 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 2000));

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            hadInterceptor: hasInterceptor === "true",
            completedAt: Date.now(),
          }),
        });

        longRequestInProgress = false;
      });

      await page.goto("/interceptor-management/removal-impact");

      // 인터셉터 등록
      await page.click('[data-testid="register-header-interceptor-btn"]');

      // 긴 요청 시작
      await page.click('[data-testid="start-long-request-btn"]');

      // 요청이 진행 중일 때 인터셉터 제거
      await page.waitForTimeout(500);
      await page.click('[data-testid="remove-header-interceptor-btn"]');

      // 진행 중인 요청은 기존 인터셉터가 적용된 상태로 완료되어야 함
      await page.waitForSelector('[data-testid="long-request-complete"]');

      const firstResult = await page
        .locator('[data-testid="first-request-result"]')
        .textContent();
      const result1 = JSON.parse(firstResult || "{}");
      expect(result1.hadInterceptor).toBe(true);

      // 새로운 요청은 인터셉터가 적용되지 않아야 함
      await page.click('[data-testid="start-second-request-btn"]');
      await page.waitForSelector('[data-testid="second-request-complete"]');

      const secondResult = await page
        .locator('[data-testid="second-request-result"]')
        .textContent();
      const result2 = JSON.parse(secondResult || "{}");
      expect(result2.hadInterceptor).toBe(false);
    });
  });

  test.describe("인터셉터와 쿼리 무효화 연동", () => {
    test("인터셉터에서 쿼리 무효화 트리거", async ({ page }) => {
      // 각 테스트마다 user-profile API 버전을 초기화하기 위해 DELETE 호출
      await page.request.delete("http://localhost:3001/api/user-profile");

      // API 모킹 제거 - 실제 API 사용

      await page.goto("/interceptor-invalidation/auto-refresh");

      // 자동 무효화 인터셉터 등록
      await page.click('[data-testid="register-invalidation-interceptor-btn"]');

      // 초기 사용자 데이터 로드
      await page.click('[data-testid="load-user-profile-btn"]');
      await page.waitForSelector('[data-testid="user-profile"]');

      const initialData = await page
        .locator('[data-testid="user-name"]')
        .textContent();
      expect(initialData).toBe("User Name v1");

      // 사용자 업데이트 요청 (인터셉터가 자동으로 프로필 쿼리 무효화)
      await page.click('[data-testid="update-user-btn"]');

      // 업데이트 성공 후 자동으로 프로필이 새로고침되어야 함
      await page.waitForSelector('[data-testid="profile-auto-updated"]');

      // 무효화 로그가 나타날 때까지 기다림
      await page.waitForSelector('[data-testid="invalidation-log"]');

      // 실제로 사용자 이름이 v2로 변경될 때까지 기다림
      let currentUserName = "";
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        await page.waitForTimeout(500);
        currentUserName =
          (await page.locator('[data-testid="user-name"]').textContent()) || "";

        console.log(
          `Attempt ${attempts + 1}: Current user name = "${currentUserName}"`
        );

        if (currentUserName.includes("v2")) {
          break;
        }
        attempts++;
      }

      const updatedData = await page
        .locator('[data-testid="user-name"]')
        .textContent();

      console.log(`Final user name: "${updatedData}"`);
      expect(updatedData).toBe("User Name v2");

      // 무효화 로그 확인
      const invalidationLog = await page
        .locator('[data-testid="invalidation-log"]')
        .textContent();
      expect(invalidationLog).toContain("user-profile invalidated");
      expect(invalidationLog).toContain(
        "triggered by user-profile PUT response"
      );
    });

    test("조건부 쿼리 무효화", async ({ page }) => {
      await page.route("**/api/notifications**", async (route, request) => {
        const url = new URL(request.url());
        const userId = url.searchParams.get("userId");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            notifications: [
              {
                id: 1,
                message: `Notification for user ${userId}`,
                read: false,
              },
            ],
            userId: parseInt(userId || "0"),
          }),
        });
      });

      await page.route("**/api/mark-read", async (route, request) => {
        const body = await request.postDataJSON();

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            affectedUserId: body.userId,
          }),
        });
      });

      await page.goto("/interceptor-invalidation/conditional");

      // 조건부 무효화 인터셉터 등록
      await page.click('[data-testid="register-conditional-interceptor-btn"]');

      // 사용자 1 알림 로드
      await page.selectOption('[data-testid="user-select"]', "1");
      await page.click('[data-testid="load-notifications-btn"]');

      await page.waitForSelector('[data-testid="notifications-loaded"]');

      // 사용자 2 알림도 로드
      await page.selectOption('[data-testid="user-select"]', "2");
      await page.click('[data-testid="load-notifications-btn"]');

      await page.waitForSelector('[data-testid="notifications-loaded"]');

      // 사용자 1의 알림을 읽음 처리
      await page.selectOption('[data-testid="user-select"]', "1");
      await page.click('[data-testid="mark-read-btn"]');

      await page.waitForSelector('[data-testid="mark-read-complete"]');

      // 조건부 무효화 로그 확인
      const conditionalLog = await page
        .locator('[data-testid="conditional-invalidation-log"]')
        .textContent();
      const logEntries = JSON.parse(conditionalLog || "[]");

      // 사용자 1의 알림만 무효화되어야 함
      expect(
        logEntries.some(
          (log: any) =>
            log.action === "invalidated" &&
            log.queryKey.includes("notifications") &&
            log.queryKey.includes("userId:1")
        )
      ).toBe(true);

      // 사용자 2의 알림은 무효화되지 않아야 함
      expect(
        logEntries.some(
          (log: any) =>
            log.action === "invalidated" && log.queryKey.includes("userId:2")
        )
      ).toBe(false);
    });
  });

  test.describe("에러 복구 및 재시도 전략", () => {
    test("인터셉터 기반 자동 재시도 및 백오프", async ({ page }) => {
      let attemptCount = 0;

      await page.route("**/api/unstable-endpoint", async (route) => {
        attemptCount++;

        // 처음 3번은 실패, 4번째에 성공
        if (attemptCount <= 3) {
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({
              error: "Service Temporarily Unavailable",
              retryAfter: 1,
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: "Success after retry",
              attemptNumber: attemptCount,
            }),
          });
        }
      });

      await page.goto("/interceptor-retry/backoff-strategy");

      // 재시도 인터셉터 등록
      await page.click('[data-testid="register-retry-interceptor-btn"]');

      const startTime = Date.now();

      // 불안정한 API 호출
      await page.click('[data-testid="call-unstable-api-btn"]');

      // 재시도 과정 확인
      await page.waitForSelector('[data-testid="retry-attempt-1"]');
      await page.waitForSelector('[data-testid="retry-attempt-2"]');
      await page.waitForSelector('[data-testid="retry-attempt-3"]');

      // 최종 성공
      await page.waitForSelector('[data-testid="retry-success"]');

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 백오프 전략으로 인한 지연 시간 확인 (최소 3초 이상)
      expect(totalTime).toBeGreaterThan(3000);

      const successData = await page
        .locator('[data-testid="success-data"]')
        .textContent();
      const result = JSON.parse(successData || "{}");
      expect(result.data).toBe("Success after retry");
      expect(result.attemptNumber).toBe(4);

      // 재시도 통계 확인
      const retryStats = await page
        .locator('[data-testid="retry-stats"]')
        .textContent();
      const stats = JSON.parse(retryStats || "{}");
      expect(stats.totalAttempts).toBe(4);
      expect(stats.totalRetries).toBe(3);
    });

    test("서킷 브레이커 패턴 구현", async ({ page }) => {
      let consecutiveFailures = 0;

      await page.route("**/api/circuit-breaker-test", async (route) => {
        consecutiveFailures++;

        // 5번 연속 실패 후 서킷 브레이커 동작
        if (consecutiveFailures <= 5) {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: "Server Error" }),
          });
        } else {
          // 복구된 후
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: "Service recovered" }),
          });
        }
      });

      await page.goto("/interceptor-retry/circuit-breaker");

      // 서킷 브레이커 인터셉터 등록
      await page.click('[data-testid="register-circuit-breaker-btn"]');

      // 연속 실패를 통한 서킷 브레이커 활성화
      for (let i = 1; i <= 5; i++) {
        await page.click('[data-testid="make-request-btn"]');
        await page.waitForSelector(`[data-testid="failure-${i}"]`);
      }

      // 서킷 브레이커 개방 상태 확인
      await page.waitForSelector('[data-testid="circuit-breaker-open"]');

      const circuitState = await page
        .locator('[data-testid="circuit-state"]')
        .textContent();
      expect(circuitState).toBe("OPEN");

      // 서킷 브레이커 개방 상태에서 요청 시 즉시 실패
      await page.click('[data-testid="make-request-btn"]');
      await page.waitForSelector('[data-testid="circuit-breaker-blocked"]');

      // 일정 시간 후 Half-Open 상태로 전환
      await page.waitForTimeout(3000);
      await page.click('[data-testid="make-request-btn"]');

      await page.waitForSelector('[data-testid="circuit-breaker-half-open"]');

      // 성공 요청으로 서킷 브레이커 닫기
      consecutiveFailures = 6; // 성공 응답을 위해
      await page.click('[data-testid="make-request-btn"]');

      await page.waitForSelector('[data-testid="circuit-breaker-closed"]');
      const finalState = await page
        .locator('[data-testid="circuit-state"]')
        .textContent();
      expect(finalState).toBe("CLOSED");
    });
  });
});
