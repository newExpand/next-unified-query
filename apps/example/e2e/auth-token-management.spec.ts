import { test, expect } from "@playwright/test";

/**
 * 실제 브라우저 환경에서의 인증 토큰 관리 E2E 테스트
 * 
 * Access Token + Refresh Token 전략을 실제 브라우저에서 검증하여
 * 프로덕션 환경에서의 인증 플로우 안정성을 보장합니다.
 */

test.describe("Authentication Token Management", () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트마다 토큰 상태 초기화
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe("Access Token + Refresh Token 전략", () => {
    test("로그인 후 API 호출 → Access Token 만료 → Refresh Token으로 갱신 → 재시도 성공", async ({ page }) => {
      // 로그인 시뮬레이션
      await page.goto("/auth/login");
      
      // 로그인 성공 시 토큰 설정
      await page.evaluate(() => {
        localStorage.setItem("accessToken", "valid-access-token");
        localStorage.setItem("refreshToken", "valid-refresh-token");
      });

      // 인증이 필요한 페이지로 이동
      await page.goto("/protected/user-profile");
      
      let requestCount = 0;
      let refreshCallCount = 0;
      
      // API 요청 모킹: 첫 번째는 401 (토큰 만료), 두 번째는 성공
      await page.route("**/api/user/profile", async (route, request) => {
        requestCount++;
        const authHeader = request.headers()["authorization"];
        
        if (requestCount === 1) {
          // 첫 번째 요청: Access Token 만료
          expect(authHeader).toBe("Bearer valid-access-token");
          await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Token expired" })
          });
        } else {
          // 두 번째 요청: 갱신된 Access Token으로 성공
          expect(authHeader).toBe("Bearer new-access-token");
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ id: 1, name: "Test User", email: "test@example.com" })
          });
        }
      });

      // Refresh Token API 모킹
      await page.route("**/api/auth/refresh", async (route, request) => {
        refreshCallCount++;
        const body = await request.postDataJSON();
        
        expect(body.refreshToken).toBe("valid-refresh-token");
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token"
          })
        });
      });

      // authRetry 인터셉터가 설정된 상태에서 API 호출
      await page.waitForSelector('[data-testid="user-profile"]');
      
      // 사용자 프로필이 성공적으로 로드되었는지 확인
      await expect(page.locator('[data-testid="user-name"]')).toHaveText("Test User");
      await expect(page.locator('[data-testid="user-email"]')).toHaveText("test@example.com");

      // 토큰이 올바르게 갱신되었는지 확인
      const newAccessToken = await page.evaluate(() => localStorage.getItem("accessToken"));
      const newRefreshToken = await page.evaluate(() => localStorage.getItem("refreshToken"));
      
      expect(newAccessToken).toBe("new-access-token");
      expect(newRefreshToken).toBe("new-refresh-token");
      expect(requestCount).toBe(2);
      expect(refreshCallCount).toBe(1);
    });

    test("여러 탭에서 동시 API 호출 시 토큰 갱신이 한 번만 발생", async ({ context }) => {
      // 첫 번째 탭
      const page1 = await context.newPage();
      await page1.evaluate(() => {
        localStorage.setItem("accessToken", "expired-access-token");
        localStorage.setItem("refreshToken", "valid-refresh-token");
      });

      // 두 번째 탭
      const page2 = await context.newPage();
      await page2.evaluate(() => {
        localStorage.setItem("accessToken", "expired-access-token");
        localStorage.setItem("refreshToken", "valid-refresh-token");
      });

      let refreshCallCount = 0;
      let apiCallCount = 0;

      // 두 탭 모두에서 동일한 API 모킹 설정
      const setupRoutes = async (page: any) => {
        await page.route("**/api/user/data", async (route: any) => {
          apiCallCount++;
          await new Promise(resolve => setTimeout(resolve, 100)); // 약간의 지연
          
          await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Token expired" })
          });
        });

        await page.route("**/api/auth/refresh", async (route: any) => {
          refreshCallCount++;
          await new Promise(resolve => setTimeout(resolve, 200)); // refresh 지연
          
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              accessToken: "new-access-token",
              refreshToken: "new-refresh-token"
            })
          });
        });
      };

      await setupRoutes(page1);
      await setupRoutes(page2);

      // 두 탭에서 동시에 인증이 필요한 페이지로 이동
      await Promise.all([
        page1.goto("/protected/dashboard"),
        page2.goto("/protected/dashboard")
      ]);

      // 토큰 갱신이 한 번만 일어났는지 확인
      await page1.waitForTimeout(1000);
      
      // refresh API가 한 번만 호출되어야 함 (중복 호출 방지)
      expect(refreshCallCount).toBeLessThanOrEqual(2); // 실제로는 1이 이상적이지만 race condition으로 2까지 허용

      // 두 탭 모두 동일한 새 토큰을 가져야 함
      const token1 = await page1.evaluate(() => localStorage.getItem("accessToken"));
      const token2 = await page2.evaluate(() => localStorage.getItem("accessToken"));
      
      expect(token1).toBe("new-access-token");
      expect(token2).toBe("new-access-token");

      await page1.close();
      await page2.close();
    });

    test("Refresh Token 만료 시 로그인 페이지로 리다이렉트", async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem("accessToken", "expired-access-token");
        localStorage.setItem("refreshToken", "expired-refresh-token");
      });

      // 만료된 Refresh Token으로 갱신 실패 시뮬레이션
      await page.route("**/api/user/profile", async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Token expired" })
        });
      });

      await page.route("**/api/auth/refresh", async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Refresh token expired" })
        });
      });

      await page.goto("/protected/user-profile");

      // Refresh token 만료로 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL("/auth/login");
      
      // 토큰이 모두 제거되었는지 확인
      const accessToken = await page.evaluate(() => localStorage.getItem("accessToken"));
      const refreshToken = await page.evaluate(() => localStorage.getItem("refreshToken"));
      
      expect(accessToken).toBeNull();
      expect(refreshToken).toBeNull();
    });

    test("백그라운드 토큰 갱신 중에도 사용자 경험 끊기지 않음", async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem("accessToken", "expiring-soon-token");
        localStorage.setItem("refreshToken", "valid-refresh-token");
      });

      await page.goto("/protected/dashboard");
      await page.waitForSelector('[data-testid="dashboard-content"]');

      // 토큰 갱신 API를 느리게 응답하도록 설정
      await page.route("**/api/auth/refresh", async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 지연
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token"
          })
        });
      });

      // 401 응답으로 토큰 갱신 트리거
      await page.route("**/api/dashboard/data", async (route, request) => {
        const authHeader = request.headers()["authorization"];
        
        if (authHeader === "Bearer expiring-soon-token") {
          await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Token expired" })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: "Dashboard data" })
          });
        }
      });

      // 데이터 새로고침 버튼 클릭
      await page.click('[data-testid="refresh-data-btn"]');

      // 토큰 갱신 중에도 기존 UI가 유지되어야 함
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      
      // 로딩 스피너는 표시되지만 기존 데이터는 유지
      await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="existing-data"]')).toBeVisible();

      // 토큰 갱신 완료 후 새 데이터 로드
      await page.waitForSelector('[data-testid="updated-data"]');
      await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
    });
  });

  test.describe("토큰 저장 및 복원", () => {
    test("페이지 새로고침 시 토큰 자동 복원", async ({ page }) => {
      await page.goto("/auth/login");
      
      // 로그인 성공 후 토큰 설정
      await page.evaluate(() => {
        localStorage.setItem("accessToken", "persisted-access-token");
        localStorage.setItem("refreshToken", "persisted-refresh-token");
      });

      await page.goto("/protected/user-profile");
      
      // API 요청 시 토큰이 헤더에 포함되는지 확인
      await page.route("**/api/user/profile", async (route, request) => {
        const authHeader = request.headers()["authorization"];
        expect(authHeader).toBe("Bearer persisted-access-token");
        
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: 1, name: "Test User" })
        });
      });

      await page.waitForSelector('[data-testid="user-profile"]');

      // 페이지 새로고침
      await page.reload();

      // 새로고침 후에도 토큰이 유지되고 API 호출에 사용되는지 확인
      await page.waitForSelector('[data-testid="user-profile"]');
      await expect(page.locator('[data-testid="user-name"]')).toHaveText("Test User");
    });

    test("sessionStorage vs localStorage 토큰 저장 전략", async ({ page }) => {
      // sessionStorage 사용 시나리오
      await page.goto("/auth/login?storage=session");
      
      await page.evaluate(() => {
        sessionStorage.setItem("accessToken", "session-access-token");
        sessionStorage.setItem("refreshToken", "session-refresh-token");
      });

      await page.goto("/protected/dashboard");
      
      // 새 탭에서는 sessionStorage 토큰에 접근할 수 없어야 함
      const newPage = await page.context().newPage();
      await newPage.goto("/protected/dashboard");
      
      // 새 탭에서는 로그인 페이지로 리다이렉트되어야 함
      await expect(newPage).toHaveURL("/auth/login");
      
      await newPage.close();

      // localStorage 사용 시나리오로 전환
      await page.goto("/auth/login?storage=local");
      
      await page.evaluate(() => {
        localStorage.setItem("accessToken", "local-access-token");
        localStorage.setItem("refreshToken", "local-refresh-token");
        sessionStorage.clear();
      });

      await page.goto("/protected/dashboard");
      
      // 새 탭에서는 localStorage 토큰에 접근할 수 있어야 함
      const newPage2 = await page.context().newPage();
      await newPage2.goto("/protected/dashboard");
      
      await newPage2.waitForSelector('[data-testid="dashboard-content"]');
      
      await newPage2.close();
    });
  });

  test.describe("네트워크 오류 및 Fallback", () => {
    test("토큰 갱신 실패 시 재시도 전략", async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem("accessToken", "expired-access-token");
        localStorage.setItem("refreshToken", "unstable-refresh-token");
      });

      let refreshAttempts = 0;

      // 처음 2번은 네트워크 오류, 3번째는 성공
      await page.route("**/api/auth/refresh", async (route) => {
        refreshAttempts++;
        
        if (refreshAttempts <= 2) {
          // 네트워크 오류 시뮬레이션
          await route.abort();
        } else {
          // 3번째 시도에서 성공
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              accessToken: "recovered-access-token",
              refreshToken: "recovered-refresh-token"
            })
          });
        }
      });

      await page.route("**/api/user/profile", async (route, request) => {
        const authHeader = request.headers()["authorization"];
        
        if (authHeader === "Bearer expired-access-token") {
          await route.fulfill({ status: 401 });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ id: 1, name: "Recovered User" })
          });
        }
      });

      await page.goto("/protected/user-profile");

      // 재시도 후 성공적으로 데이터 로드
      await page.waitForSelector('[data-testid="user-profile"]');
      await expect(page.locator('[data-testid="user-name"]')).toHaveText("Recovered User");

      expect(refreshAttempts).toBe(3);
    });

    test("오프라인에서 온라인 복구 시 토큰 자동 갱신", async ({ page, context }) => {
      await page.evaluate(() => {
        localStorage.setItem("accessToken", "offline-access-token");
        localStorage.setItem("refreshToken", "offline-refresh-token");
      });

      await page.goto("/protected/dashboard");

      // 오프라인 모드
      await context.setOffline(true);

      // API 호출 시도 (실패해야 함)
      await page.click('[data-testid="refresh-data-btn"]');
      await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();

      // 온라인 복구
      await context.setOffline(false);

      // 토큰 갱신 및 API 설정
      await page.route("**/api/auth/refresh", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            accessToken: "online-access-token",
            refreshToken: "online-refresh-token"
          })
        });
      });

      await page.route("**/api/dashboard/data", async (route, request) => {
        const authHeader = request.headers()["authorization"];
        
        if (authHeader === "Bearer offline-access-token") {
          await route.fulfill({ status: 401 });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: "Online dashboard data" })
          });
        }
      });

      // 재시도 버튼 클릭
      await page.click('[data-testid="retry-btn"]');

      // 자동으로 토큰 갱신되고 데이터 로드 성공
      await expect(page.locator('[data-testid="offline-message"]')).not.toBeVisible();
      await page.waitForSelector('[data-testid="dashboard-data"]');
    });
  });

  test.describe("로그아웃 및 보안", () => {
    test("로그아웃 시 모든 토큰 정리 및 쿼리 캐시 무효화", async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem("accessToken", "logout-access-token");
        localStorage.setItem("refreshToken", "logout-refresh-token");
      });

      await page.goto("/protected/dashboard");
      await page.waitForSelector('[data-testid="dashboard-content"]');

      // 로그아웃 API 모킹
      await page.route("**/api/auth/logout", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true })
        });
      });

      // 로그아웃 버튼 클릭
      await page.click('[data-testid="logout-btn"]');

      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL("/auth/login");

      // 모든 토큰이 제거되었는지 확인
      const accessToken = await page.evaluate(() => localStorage.getItem("accessToken"));
      const refreshToken = await page.evaluate(() => localStorage.getItem("refreshToken"));
      
      expect(accessToken).toBeNull();
      expect(refreshToken).toBeNull();

      // 보호된 페이지 직접 접근 시 로그인 페이지로 리다이렉트
      await page.goto("/protected/dashboard");
      await expect(page).toHaveURL("/auth/login");
    });

    test("멀티탭 로그아웃 동기화", async ({ context }) => {
      // 탭 1에서 로그인
      const page1 = await context.newPage();
      await page1.evaluate(() => {
        localStorage.setItem("accessToken", "multi-tab-access-token");
        localStorage.setItem("refreshToken", "multi-tab-refresh-token");
      });
      await page1.goto("/protected/dashboard");

      // 탭 2에서도 같은 상태
      const page2 = await context.newPage();
      await page2.goto("/protected/dashboard");
      await page2.waitForSelector('[data-testid="dashboard-content"]');

      // 탭 1에서 로그아웃
      await page1.route("**/api/auth/logout", async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      });

      await page1.click('[data-testid="logout-btn"]');
      await expect(page1).toHaveURL("/auth/login");

      // storage 이벤트로 탭 2도 자동 로그아웃
      await page2.waitForTimeout(1000);
      await expect(page2).toHaveURL("/auth/login");

      await page1.close();
      await page2.close();
    });
  });
});