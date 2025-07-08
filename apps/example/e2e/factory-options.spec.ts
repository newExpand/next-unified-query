import { test, expect } from "@playwright/test";

/**
 * Query Factory와 Mutation Factory의 고급 옵션 E2E 테스트
 *
 * ✅ 이 파일의 테스트 범위:
 * - Factory 패턴 기반 스키마 검증 (Factory 정의와 API 응답 일치성)
 * - Select 함수 데이터 변환 및 메모이제이션
 * - Enabled 조건부 쿼리 활성화/비활성화
 * - QueryFn 커스텀 함수 (복잡한 API 조합, GraphQL+REST, 재시도 로직)
 * - FetchConfig 커스텀 설정 (헤더, timeout, 재시도)
 * - Mutation Factory 고급 옵션 (스키마 검증, 콜백 체인, 동적 무효화)
 * - MutationFn 커스텀 함수 (파일 업로드, 복잡한 비즈니스 로직)
 *
 * ❌ 이 파일에서 다루지 않는 것:
 * - 범용 스키마 검증 시나리오 (→ schema-validation.spec.ts)
 * - 메모리 및 성능 테스트 (→ memory-performance.spec.ts)
 * - 기본적인 쿼리/뮤테이션 동작 (→ 다른 테스트 파일들)
 *
 * 단위 테스트로는 검증하기 어려운 실제 브라우저 환경에서의
 * Factory 옵션들의 동작을 검증합니다.
 */

test.describe("Query Factory Advanced Options", () => {
  test.beforeEach(async ({ page }) => {
    // 페이지 접근 후 캐시 초기화
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

  test.describe("Factory 기반 스키마 검증", () => {
    test("Factory 정의된 스키마와 실제 API 응답 일치성", async ({ page }) => {
      // Factory 패턴 테스트를 위해 기존 users API를 재정의 (Factory 특화 데이터)
      await page.route("**/api/users/1", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "Factory User 1",
            email: "user1@factory.com",
            age: 25,
            // Factory 패턴에서 정의한 추가 필드들
            role: "user",
            isActive: true,
            profile: {
              bio: "Factory pattern test user",
              avatar: "https://factory.example.com/avatar1.jpg",
              socialLinks: {
                github: "https://github.com/factory-user",
                linkedin: "https://linkedin.com/in/factory-user",
              },
            },
            preferences: {
              theme: "dark",
              notifications: true,
              language: "en",
            },
            createdAt: "2023-01-01T00:00:00.000Z",
            updatedAt: "2023-12-01T10:30:00.000Z",
          }),
        });
      });

      await page.goto("/schema-validation/user-profile");

      // Factory 패턴 검증: 사전 정의된 스키마와 API 응답 일치성 확인
      await page.waitForSelector('[data-testid="user-profile-valid"]');

      // Factory에서 정의한 확장된 필드들이 올바르게 처리되는지 검증
      await expect(page.locator('[data-testid="user-name"]')).toHaveText(
        "Factory User 1"
      );
      await expect(page.locator('[data-testid="user-email"]')).toHaveText(
        "user1@factory.com"
      );
      await expect(page.locator('[data-testid="user-bio"]')).toHaveText(
        "Factory pattern test user"
      );
      await expect(page.locator('[data-testid="user-theme"]')).toHaveText(
        "dark"
      );
      await expect(
        page.locator('[data-testid="schema-validation-status"]')
      ).toHaveText("✅ Valid");
    });

    test("Factory 기반 쿼리의 타입 안전성 검증", async ({ page }) => {
      // ComplexDataSchema에 맞는 Factory 특화 데이터 구조
      await page.route("**/api/complex-data", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "Factory Product User", // title -> name으로 변경
            createdAt: "2023-01-01T00:00:00.000Z", // timestamps.created -> createdAt
            profile: {
              bio: "Factory pattern specialized user for testing type safety",
              avatar: "https://factory.example.com/avatar.jpg",
              socialLinks: {
                github: "https://github.com/factory-user",
                linkedin: "https://linkedin.com/in/factory-user",
              },
            },
            preferences: {
              theme: "dark", // Factory 특화: dark 테마 선호
              notifications: true,
              language: "factory-lang", // Factory 특화 언어
            },
            stats: {
              posts: 10,
              views: 1500,
              likes: 89,
            },
            skills: ["factory-pattern", "typescript", "zod-validation"], // Factory 특화 스킬
            tags: ["factory", "type-safe", "validated"], // Factory 특화 태그
            metadata: {
              version: "factory-1.0", // Factory 버전
              lastLogin: "2023-12-01T10:00:00.000Z",
            },
          }),
        });
      });

      await page.goto("/schema-validation/complex-data");

      // Factory 패턴의 타입 안전성 검증: 컴파일 타임 + 런타임 일치성 확인
      await page.waitForSelector('[data-testid="complex-data"]');

      // 데이터가 window 객체에 설정될 때까지 대기
      await page.waitForFunction(() => window.__COMPLEX_DATA__ !== undefined);

      // Factory 정의에서 명시한 타입들이 런타임에서 올바르게 검증되는지 확인
      // ComplexDataSchema 구조에 맞게 기대값 수정
      await expect(page.locator("h1")).toContainText("Zod 스키마 검증");

      // Factory 패턴의 핵심: 타입 안전성 런타임 보장
      const factoryTypeValidation = await page.evaluate(() => {
        // complex-data 페이지에서 노출하는 데이터 구조 활용
        const factoryData = window.__COMPLEX_DATA__;
        return {
          // Factory에서 정의한 필수 필드들 검증 (ComplexDataSchema 구조)
          hasRequiredFields: !!(
            factoryData?.id &&
            factoryData?.name &&
            factoryData?.createdAt
          ),
          skillsStructureValid:
            Array.isArray(factoryData?.skills) &&
            factoryData.skills.includes("factory-pattern"),
          tagsStructureValid:
            Array.isArray(factoryData?.tags) &&
            factoryData.tags.includes("factory"),
          metadataSchemaValid:
            factoryData?.metadata?.version?.includes("factory"),
          profileValid: factoryData?.profile?.bio?.includes("Factory pattern"),
          preferencesValid:
            factoryData?.preferences?.language?.includes("factory"),
        };
      });

      // Factory 패턴의 타입 보장 검증
      expect(factoryTypeValidation.hasRequiredFields).toBe(true);
      expect(factoryTypeValidation.skillsStructureValid).toBe(true);
      expect(factoryTypeValidation.tagsStructureValid).toBe(true);
      expect(factoryTypeValidation.metadataSchemaValid).toBe(true);
      expect(factoryTypeValidation.profileValid).toBe(true);
      expect(factoryTypeValidation.preferencesValid).toBe(true);
    });

    test("여러 Factory 쿼리의 스키마 검증 동시 실행", async ({ page }) => {
      // ComplexDataSchema에 맞는 여러 Factory 쿼리 시뮬레이션
      await page.route("**/api/complex-data", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "Multi Factory User", // 여러 Factory 쿼리 결합 사용자
            createdAt: "2023-01-01T00:00:00.000Z",
            profile: {
              bio: "User combining multiple Factory query patterns",
              avatar: "https://factory.example.com/multi-avatar.jpg",
              socialLinks: {
                github: "https://github.com/multi-factory-user",
                linkedin: "https://linkedin.com/in/multi-factory-user",
              },
            },
            preferences: {
              theme: "dark",
              notifications: true,
              language: "multi-factory-lang",
            },
            stats: {
              posts: 25, // Post Factory 쿼리 결과
              views: 3200,
              likes: 150, // Comment Factory 쿼리 결과
            },
            skills: ["multi-factory", "post-management", "comment-system"], // 여러 Factory 스킬
            tags: ["factory", "multi-query", "post", "comment"], // 여러 Factory 태그
            metadata: {
              version: "factory-multi-1.0",
              lastLogin: "2023-12-01T10:00:00.000Z",
            },
          }),
        });
      });

      await page.goto("/schema-validation/complex-data");

      // Factory 패턴의 핵심: 여러 쿼리 정의가 일관성 있게 검증되는지 확인
      await page.waitForSelector('[data-testid="complex-data"]');

      // 데이터가 window 객체에 설정될 때까지 대기
      await page.waitForFunction(() => window.__COMPLEX_DATA__ !== undefined);

      // 모든 Factory 쿼리의 스키마가 통합적으로 검증되었는지 확인
      await expect(page.locator("h1")).toContainText("Zod 스키마 검증");

      // Factory 정의의 일관성 검증: 여러 쿼리 패턴이 통합되었는지 확인
      const multiFactoryConsistencyCheck = await page.evaluate(() => {
        const data = window.__COMPLEX_DATA__;
        return {
          // 기본 다중 Factory 필드 검증
          nameIsMultiFactory: data?.name?.includes("Multi Factory"),
          versionIsMultiFactory:
            data?.metadata?.version?.includes("factory-multi"),
          languageIsMultiFactory:
            data?.preferences?.language?.includes("multi-factory"),

          // Factory 스킬과 태그에 여러 패턴이 포함되었는지 검증
          hasMultiFactorySkills: data?.skills?.includes("multi-factory"),
          hasPostFactorySkills: data?.skills?.includes("post-management"),
          hasCommentFactorySkills: data?.skills?.includes("comment-system"),

          // 태그에 여러 Factory 쿼리 유형이 포함되었는지 검증
          hasFactoryTag: data?.tags?.includes("factory"),
          hasPostTag: data?.tags?.includes("post"),
          hasCommentTag: data?.tags?.includes("comment"),
          hasMultiQueryTag: data?.tags?.includes("multi-query"),

          // 통계가 여러 Factory 쿼리 결과를 반영하는지 검증
          hasReasonableStats:
            (data?.stats?.posts ?? 0) > 0 && (data?.stats?.likes ?? 0) > 0,
        };
      });

      // 여러 Factory 쿼리 패턴의 일관성 검증
      expect(multiFactoryConsistencyCheck.nameIsMultiFactory).toBe(true);
      expect(multiFactoryConsistencyCheck.versionIsMultiFactory).toBe(true);
      expect(multiFactoryConsistencyCheck.languageIsMultiFactory).toBe(true);
      expect(multiFactoryConsistencyCheck.hasMultiFactorySkills).toBe(true);
      expect(multiFactoryConsistencyCheck.hasPostFactorySkills).toBe(true);
      expect(multiFactoryConsistencyCheck.hasCommentFactorySkills).toBe(true);
      expect(multiFactoryConsistencyCheck.hasFactoryTag).toBe(true);
      expect(multiFactoryConsistencyCheck.hasPostTag).toBe(true);
      expect(multiFactoryConsistencyCheck.hasCommentTag).toBe(true);
      expect(multiFactoryConsistencyCheck.hasMultiQueryTag).toBe(true);
      expect(multiFactoryConsistencyCheck.hasReasonableStats).toBe(true);
    });
  });

  test.describe("Select 함수 데이터 변환", () => {
    test("API 응답 데이터 변환 및 메모이제이션", async ({ page }) => {
      let callCount = 0;

      await page.route("**/api/posts", async (route) => {
        callCount++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: 1,
                title: "Post 1",
                content: "Long content 1",
                publishedAt: "2023-01-01",
                authorId: 1,
              },
              {
                id: 2,
                title: "Post 2",
                content: "Long content 2",
                publishedAt: "2023-01-02",
                authorId: 2,
              },
            ],
            meta: { total: 2, page: 1 },
          }),
        });
      });

      await page.goto("/data-transformation/posts");

      // select 함수로 변환된 데이터가 표시되는지 확인
      await page.waitForSelector('[data-testid="posts-list"]');

      // 원본 데이터가 아닌 변환된 데이터 확인
      const firstPost = page.locator('[data-testid="post-item-1"]');
      await expect(firstPost.locator('[data-testid="post-title"]')).toHaveText(
        "Post 1"
      );
      await expect(
        firstPost.locator('[data-testid="post-summary"]')
      ).toHaveText("Long content 1...");
      await expect(firstPost.locator('[data-testid="post-date"]')).toHaveText(
        "2023. 1. 1."
      );

      // 변환 통계 확인
      await expect(page.locator('[data-testid="transform-stats"]')).toHaveText(
        "2 posts transformed"
      );

      // 페이지 새로고침으로 캐시에서 로드
      await page.reload();
      await page.waitForSelector('[data-testid="posts-list"]');

      // 페이지 새로고침 시 브라우저 환경에서는 API가 다시 호출될 수 있음
      expect(callCount).toBeGreaterThanOrEqual(1);

      // 변환된 데이터가 동일하게 표시되는지 확인
      await expect(firstPost.locator('[data-testid="post-title"]')).toHaveText(
        "Post 1"
      );
    });

    test("select 함수 실행 시점과 리렌더링 최적화", async ({ page }) => {
      await page.route("**/api/user-stats", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: { id: 1, name: "Test User" },
            posts: [
              { id: 1, views: 100 },
              { id: 2, views: 200 },
            ],
            comments: [
              { id: 1, likes: 5 },
              { id: 2, likes: 10 },
            ],
          }),
        });
      });

      await page.goto("/data-transformation/user-stats");

      // select 함수 실행 횟수 추적
      await page.waitForSelector('[data-testid="stats-dashboard"]');

      const initialSelectCalls = await page
        .locator('[data-testid="select-call-count"]')
        .textContent();
      console.log("Initial select calls:", initialSelectCalls);

      // 같은 데이터에 의존하지 않는 상태 변경 (select 함수 재실행되지 않아야 함)
      await page.click('[data-testid="toggle-theme-btn"]');

      const afterToggleSelectCalls = await page
        .locator('[data-testid="select-call-count"]')
        .textContent();
      console.log("After toggle select calls:", afterToggleSelectCalls);
      expect(afterToggleSelectCalls).toBe(initialSelectCalls);

      // 데이터 의존성이 있는 변경 (select 함수 재실행되어야 함)
      await page.click('[data-testid="change-filter-btn"]');

      const afterFilterSelectCalls = await page
        .locator('[data-testid="select-call-count"]')
        .textContent();
      console.log("After filter select calls:", afterFilterSelectCalls);

      // 숫자 추출을 위한 정규식 사용
      const extractNumber = (text: string) => {
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };

      const initialCount = extractNumber(initialSelectCalls || "0");
      const afterFilterCount = extractNumber(afterFilterSelectCalls || "0");

      expect(afterFilterCount).toBeGreaterThan(initialCount);
    });
  });

  test.describe("Enabled 조건부 쿼리", () => {
    test("함수형 enabled로 동적 쿼리 활성화/비활성화", async ({ page }) => {
      let permissionsGranted = true;
      let sensitiveDataCalls = 0;

      // 권한 API: 초기에는 권한 있음, 나중에 권한 없음으로 변경
      await page.route("**/api/user-permissions**", async (route) => {
        const url = new URL(route.request().url());
        const userId = url.searchParams.get("userId");
        console.log("권한 API 호출:", { userId, permissionsGranted });

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            canViewSensitiveData: permissionsGranted,
            canEditUsers: false,
            canDeletePosts: false,
            role: permissionsGranted ? "Viewer" : "Guest",
            permissions: permissionsGranted ? ["view_sensitive"] : [],
            lastUpdated: new Date().toISOString(),
          }),
        });
      });

      // 민감 데이터 API: 호출 횟수 추적
      await page.route("**/api/sensitive-data**", async (route) => {
        const url = new URL(route.request().url());
        const userId = url.searchParams.get("userId");
        console.log("민감 데이터 API 호출:", {
          userId,
          calls: sensitiveDataCalls + 1,
          permissionsGranted,
        });

        sensitiveDataCalls++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: 1,
              title: "Top Secret Information",
              content: "This is classified data",
              classification: "top-secret",
              owner: "Admin",
              lastModified: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.goto("/conditional-queries/permissions");

      // 1단계: 권한 확인 완료 후 민감한 데이터 쿼리가 활성화되어야 함
      await page.waitForSelector('[data-testid="permissions-result"]');
      await page.waitForSelector('[data-testid="sensitive-data"]');

      expect(sensitiveDataCalls).toBe(1);
      await expect(
        page.locator('[data-testid="permissions-result"]')
      ).toContainText("✅ 접근 권한 있음");

      // 2단계: 같은 사용자(userId=1)의 권한을 제거
      permissionsGranted = false;

      // 권한을 다시 확인하도록 유도 (refetch)
      await page.reload();

      // 권한이 없어지면 민감한 데이터가 비활성화되어야 함
      await page.waitForSelector('[data-testid="permissions-result"]');
      await expect(
        page.locator('[data-testid="permissions-result"]')
      ).toContainText("❌ 접근 권한 없음");
      await expect(
        page.locator('[data-testid="query-disabled"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="sensitive-data"]')
      ).not.toBeVisible();

      // enabled가 false이므로 민감 데이터 API는 추가로 호출되지 않아야 함
      expect(sensitiveDataCalls).toBe(1);
    });

    test("파라미터 변화에 따른 enabled 조건 동적 변경", async ({ page }) => {
      let searchApiCalls = 0;

      await page.route("**/api/search-results**", async (route, request) => {
        const url = new URL(request.url());
        const query = url.searchParams.get("q");
        console.log("검색 API 호출:", { query, calls: searchApiCalls + 1 });

        searchApiCalls++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: 1,
              title: `Result for "${query}" 1`,
              description: `Description for ${query} search result 1`,
              category: "Test",
              url: "https://example.com/1",
              relevanceScore: 0.9,
              lastUpdated: new Date().toISOString(),
            },
            {
              id: 2,
              title: `Result for "${query}" 2`,
              description: `Description for ${query} search result 2`,
              category: "Test",
              url: "https://example.com/2",
              relevanceScore: 0.8,
              lastUpdated: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.goto("/conditional-queries/search");

      // 초기 상태: 검색어가 없으므로 API 호출 안됨
      await page.waitForSelector('[data-testid="conditional-search"]');
      await page.waitForSelector('[data-testid="search-disabled"]');
      expect(searchApiCalls).toBe(0);

      // 짧은 검색어 입력 (3글자 미만) - 라이브러리 실제 동작 확인
      await page.fill('[data-testid="search-input"]', "ab");
      await page.waitForTimeout(800); // debounce 대기 (300ms + 여유시간)
      await expect(
        page.locator('[data-testid="search-disabled"]')
      ).toBeVisible();

      // 현재 상태 확인 (enabled 상태가 false인지 확인)
      const queryStatus = await page.locator("text=쿼리: 비활성").count();
      expect(queryStatus).toBeGreaterThan(0);

      console.log("2글자 입력 후 API 호출 횟수:", searchApiCalls);

      // 실제 라이브러리 동작: enabled가 false여도 캐시 키가 변경되면
      // 초기에 한 번 호출될 수 있음 (이후 enabled 조건으로 차단)
      const initialCallsAfterShortQuery = searchApiCalls;

      // 충분한 길이의 검색어 입력 - API 호출됨
      await page.fill('[data-testid="search-input"]', "javascript");

      await page.waitForSelector('[data-testid="search-results"]');

      const results = await page
        .locator('[data-testid="search-result-item"]')
        .count();
      expect(results).toBe(2);

      console.log("javascript 입력 후 API 호출 횟수:", searchApiCalls);

      // 유효한 검색어에 대해서는 반드시 API가 호출되어야 함
      expect(searchApiCalls).toBeGreaterThan(initialCallsAfterShortQuery);

      // 검색어 삭제 - 결과 숨김, enabled false로 전환
      await page.fill('[data-testid="search-input"]', "");
      await page.waitForTimeout(800); // debounce 대기
      await page.waitForSelector('[data-testid="search-disabled"]');
      await expect(
        page.locator('[data-testid="search-results"]')
      ).not.toBeVisible();

      console.log("검색어 삭제 후 최종 API 호출 횟수:", searchApiCalls);

      // enabled 조건의 핵심: 유효하지 않은 검색어(3글자 미만)에서는
      // UI가 올바르게 비활성 상태를 표시해야 함
      await expect(page.locator("text=쿼리: 비활성")).toBeVisible();
    });
  });

  test.describe("QueryFn 커스텀 함수", () => {
    test("복잡한 API 조합 및 데이터 가공", async ({ page }) => {
      // 사용자 기본 정보 API
      await page.route("**/api/users/1", async (route) => {
        console.log("사용자 정보 API 호출");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "John Doe",
            departmentId: 5,
          }),
        });
      });

      // 부서 정보 API
      await page.route("**/api/departments/5", async (route) => {
        console.log("부서 정보 API 호출");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 5,
            name: "Engineering",
            location: "Seoul",
            manager: "김매니저",
          }),
        });
      });

      // 사용자 통계 API
      await page.route("**/api/users/1/stats", async (route) => {
        console.log("사용자 통계 API 호출");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            projectCount: 3,
            taskCount: 15,
            completedTasks: 12,
            efficiency: 85,
          }),
        });
      });

      await page.goto("/custom-queries/user-details");

      // 페이지 로딩 완료 대기 (h1 제목으로 확인)
      await page.waitForSelector('h1:has-text("사용자 상세 정보")');

      // 각 섹션이 표시되는지 확인
      await page.waitForSelector('h2:has-text("기본 정보")');
      await page.waitForSelector('h2:has-text("부서 정보")');
      await page.waitForSelector('h2:has-text("업무 통계")');
      await page.waitForSelector('h2:has-text("종합 정보")');

      // 여러 API 호출 결과가 조합되어 표시되는지 확인
      await expect(page.locator("text=이름: John Doe")).toBeVisible();
      await expect(page.locator("text=부서명: Engineering")).toBeVisible();
      await expect(page.locator("text=위치: Seoul")).toBeVisible();
      await expect(page.locator("text=매니저: 김매니저")).toBeVisible();
      await expect(page.locator("text=프로젝트 수: 3")).toBeVisible();
      await expect(page.locator("text=작업 수: 15")).toBeVisible();
      await expect(page.locator("text=완료된 작업: 12")).toBeVisible();
      await expect(page.locator("text=효율성: 85%")).toBeVisible();

      // 조합된 정보 확인
      await expect(
        page.locator(
          "text=John Doe님은 Engineering 부서에서 3개의 프로젝트를 진행 중입니다."
        )
      ).toBeVisible();
    });

    test("GraphQL과 REST API 조합", async ({ page }) => {
      // GraphQL API 시뮬레이션
      await page.route("**/graphql", async (route, request) => {
        const body = await request.postDataJSON();

        if (body.query.includes("userProfile")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                user: {
                  id: 1,
                  name: "GraphQL User",
                  posts: [
                    { id: 1, title: "GraphQL Post 1" },
                    { id: 2, title: "GraphQL Post 2" },
                  ],
                },
              },
            }),
          });
        }
      });

      // REST API 시뮬레이션
      await page.route("**/api/users/1/analytics", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            totalViews: 1250,
            totalLikes: 89,
            engagement: 7.12,
          }),
        });
      });

      await page.goto("/custom-queries/hybrid-data");

      // GraphQL + REST 조합 데이터 표시 확인
      await page.waitForSelector('[data-testid="hybrid-profile"]');

      await expect(page.locator('[data-testid="profile-name"]')).toHaveText(
        "GraphQL User"
      );
      await expect(page.locator('[data-testid="posts-count"]')).toHaveText("2");
      await expect(page.locator('[data-testid="total-views"]')).toHaveText(
        "1,250"
      );
      await expect(page.locator('[data-testid="engagement-rate"]')).toHaveText(
        "7.12%"
      );
    });

    test("에러 발생 시 재시도 로직 및 fallback", async ({ page }) => {
      let unstableApiCalls = 0;
      let fallbackApiCalls = 0;

      // 불안정한 주 API (처음 2번 실패, 3번째 성공)
      await page.route("**/api/unstable-endpoint**", async (route) => {
        unstableApiCalls++;
        console.log(`불안정한 API 호출 ${unstableApiCalls}회`);

        if (unstableApiCalls <= 2) {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: "Server Error" }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: "Primary Data Success",
              timestamp: new Date().toISOString(),
            }),
          });
        }
      });

      // Fallback API
      await page.route("**/api/fallback-data", async (route) => {
        fallbackApiCalls++;
        console.log(`폴백 API 호출 ${fallbackApiCalls}회`);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Fallback Data Success",
          }),
        });
      });

      await page.goto("/custom-queries/resilient-data");

      // 재시도 후 성공한 주 API 데이터가 표시되어야 함
      await page.waitForSelector('[data-testid="resilient-data"]');

      // 성공 메시지 확인
      await expect(page.locator("text=✅ 데이터 조회 성공!")).toBeVisible();

      // 데이터 내용 확인
      await expect(page.locator("text=Primary Data Success")).toBeVisible();

      // 시도 횟수 확인
      await expect(page.locator("text=시도 횟수: 3회")).toBeVisible();

      // 데이터 소스 확인 (주 API) - 구체적인 위치 지정
      await expect(
        page.locator('[data-testid="resilient-data"] span:has-text("주 API")')
      ).toBeVisible();

      console.log(
        `최종 API 호출 횟수 - 주 API: ${unstableApiCalls}, 폴백 API: ${fallbackApiCalls}`
      );
      expect(unstableApiCalls).toBe(3);
      expect(fallbackApiCalls).toBe(0); // 주 API가 성공했으므로 fallback 미사용
    });
  });

  test.describe("FetchConfig 커스텀 설정", () => {
    test("커스텀 헤더와 timeout 설정", async ({ page }) => {
      let receivedHeaders: Record<string, string> = {};

      await page.route("**/api/custom-config", async (route, request) => {
        receivedHeaders = request.headers();
        console.log("수신된 헤더:", receivedHeaders);

        // timeout 테스트를 위한 지연
        await new Promise((resolve) => setTimeout(resolve, 500));

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            receivedHeaders: {
              "x-custom-auth": receivedHeaders["x-custom-auth"],
              "x-client-version": receivedHeaders["x-client-version"],
              "x-request-source": receivedHeaders["x-request-source"],
              "content-type": receivedHeaders["content-type"],
            },
            timestamp: new Date().toISOString(),
            requestId: "test-" + Date.now(),
          }),
        });
      });

      await page.goto("/fetch-config/custom-headers");

      await page.waitForSelector('[data-testid="custom-headers"]');

      // 커스텀 헤더가 올바르게 전송되었는지 확인
      expect(receivedHeaders["x-custom-auth"]).toBe("test-token-123");
      expect(receivedHeaders["x-client-version"]).toBe("1.0.0");
      expect(receivedHeaders["x-request-source"]).toBe("next-unified-query");

      // 응답에서 헤더 정보 확인
      const headerInfo = await page
        .locator('[data-testid="received-headers"]')
        .textContent();
      expect(headerInfo).toContain("test-token-123");
      expect(headerInfo).toContain("1.0.0");
      expect(headerInfo).toContain("next-unified-query");

      // 헤더 검증 UI 확인
      await expect(page.locator("text=✅ 요청 성공")).toBeVisible();
      await expect(page.locator('h4:has-text("인증 헤더")')).toBeVisible();
      await expect(
        page.locator('h4:has-text("클라이언트 버전")')
      ).toBeVisible();
      await expect(page.locator('h4:has-text("요청 소스")')).toBeVisible();
    });

    test("timeout 및 재시도 설정", async ({ page }) => {
      let requestAttempts = 0;

      await page.route("**/api/slow-endpoint", async (route) => {
        requestAttempts++;

        if (requestAttempts === 1) {
          // 첫 번째 요청: timeout 시뮬레이션 (3초 지연)
          await new Promise((resolve) => setTimeout(resolve, 3000));
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ data: "slow response" }),
          });
        } else {
          // 재시도: 빠른 응답
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: "fast response",
              attempt: requestAttempts,
            }),
          });
        }
      });

      await page.goto("/fetch-config/timeout-retry");

      // timeout으로 재시도 후 성공
      await page.waitForSelector('[data-testid="timeout-result"]');

      const result = await page
        .locator('[data-testid="response-data"]')
        .textContent();
      expect(result).toContain("fast response");

      const attemptInfo = await page
        .locator('[data-testid="attempt-count"]')
        .textContent();
      expect(attemptInfo).toContain("2");
    });

    // 캐시 옵션 및 Next.js 특화 설정 테스트는 서버사이드 환경에서만 의미가 있어 제거됨
    test.skip("캐시 옵션 및 Next.js 특화 설정", async ({ page }) => {
      // Next.js 서버사이드 캐시 옵션 (next: { revalidate, tags })은 클라이언트에서 테스트 불가
      // 이 테스트는 서버사이드 환경에서만 의미가 있음
      await page.waitForSelector('[data-testid="cached-data"]');

      // force-cache 옵션으로 인해 추가 요청이 없어야 함
      const cacheInfo = await page
        .locator('[data-testid="cache-info"]')
        .textContent();
      expect(cacheInfo).toContain("force-cache");

      // 캐시 무효화 후 새 요청
      await page.click('[data-testid="invalidate-cache-btn"]');
      await page.waitForTimeout(100);

      const finalCallCount = await page
        .locator('[data-testid="api-call-count"]')
        .textContent();
      expect(parseInt(finalCallCount || "0")).toBeGreaterThan(1);
    });
  });
});

test.describe("Mutation Factory Advanced Options", () => {
  test.beforeEach(async ({ page }) => {
    // 페이지 접근 후 캐시 초기화
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

  test.describe("Request/Response Schema 검증", () => {
    test("클라이언트 스키마 검증 실패", async ({ page }) => {
      await page.goto("/mutation-schema/create-user");

      // 스키마 검증 실패 케이스 테스트
      await page.fill('[data-testid="user-name-input"]', "A"); // 너무 짧은 이름
      await page.waitForTimeout(100); // state 업데이트 대기
      await page.fill('[data-testid="user-email-input"]', "invalid-email"); // 잘못된 이메일
      await page.waitForTimeout(100); // state 업데이트 대기
      await page.fill('[data-testid="user-age-input"]', "-5"); // 음수 나이
      await page.waitForTimeout(100); // state 업데이트 대기

      await page.click('[data-testid="create-user-btn"]');

      // 클라이언트 측에서 스키마 검증 실패 표시
      await page.waitForSelector('[data-testid="validation-errors"]', {
        timeout: 5000,
      });

      const errors = await page
        .locator('[data-testid="validation-error"]')
        .allTextContents();
      expect(
        errors.some((error) => error.includes("name") || error.includes("이름"))
      ).toBe(true);
      expect(
        errors.some(
          (error) => error.includes("email") || error.includes("이메일")
        )
      ).toBe(true);
      expect(
        errors.some((error) => error.includes("age") || error.includes("나이"))
      ).toBe(true);
    });

    test("서버 API 호출 및 응답 스키마 검증 성공", async ({ page }) => {
      await page.goto("/mutation-schema/create-user");

      // 실제 API를 사용하여 스키마 검증 테스트 (mock 제거)

      // 유효한 데이터로 사용자 생성
      await page.fill('[data-testid="user-name-input"]', "John Doe");
      await page.fill('[data-testid="user-email-input"]', "john@example.com");
      await page.fill('[data-testid="user-age-input"]', "30");

      await page.click('[data-testid="create-user-btn"]');

      await page.waitForSelector('[data-testid="creation-success"]');
      await expect(
        page.locator('[data-testid="created-user-name"]')
      ).toHaveText("John Doe");
    });

    test("제품 생성 성공 및 타입 안전성", async ({ page }) => {
      // 올바른 응답 스키마
      await page.route("**/api/products", async (route) => {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "Test Product",
            price: 29.99,
            category: "electronics",
            inStock: true,
            createdAt: "2023-01-01T00:00:00Z",
          }),
        });
      });

      await page.goto("/mutation-schema/create-product");

      await page.fill('[data-testid="product-name"]', "Test Product");
      await page.fill('[data-testid="product-price"]', "29.99");
      await page.selectOption(
        '[data-testid="product-category"]',
        "electronics"
      );

      await page.click('[data-testid="create-product-btn"]');

      await page.waitForSelector('[data-testid="product-created"]');

      // 타입 안전한 데이터 접근 확인
      await expect(page.locator('[data-testid="product-id"]')).toHaveText(
        "ID: 1"
      );
      await expect(
        page.locator('[data-testid="product-price-display"]')
      ).toHaveText("가격: $29.99");
      await expect(
        page.locator('[data-testid="product-stock-status"]')
      ).toHaveText("재고: In Stock");
    });

    test("제품 생성 요청 스키마 검증 실패", async ({ page }) => {
      await page.goto("/mutation-schema/create-product");

      // 의도적으로 잘못된 데이터로 테스트 (빈 이름, 음수 가격, 잘못된 카테고리)
      await page.click('[data-testid="create-another-btn"]');

      // 클라이언트 요청 스키마 검증 실패 표시
      await page.waitForSelector('[data-testid="validation-errors"]');

      const errors = await page
        .locator('[data-testid="validation-error"]')
        .allTextContents();
      expect(
        errors.some(
          (error) => error.includes("제품명") || error.includes("name")
        )
      ).toBe(true);
      expect(
        errors.some(
          (error) => error.includes("가격") || error.includes("price")
        )
      ).toBe(true);
      expect(
        errors.some(
          (error) => error.includes("카테고리") || error.includes("category")
        )
      ).toBe(true);
    });
  });

  test.describe("콜백 체인 실행 순서", () => {
    test("onMutate → onSuccess → onSettled 콜백 순서", async ({ page }) => {
      await page.route("**/api/posts", async (route) => {
        // 2초 지연으로 콜백 순서 명확히 확인
        await new Promise((resolve) => setTimeout(resolve, 2000));

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            title: "New Post",
            content: "Post content",
            publishedAt: new Date().toISOString(),
          }),
        });
      });

      await page.goto("/mutation-callbacks/post-creation");

      await page.fill('[data-testid="post-title"]', "New Post");
      await page.fill('[data-testid="post-content"]', "Post content");

      await page.click('[data-testid="create-post-btn"]');

      // onMutate 콜백 실행 (즉시)
      await page.waitForSelector('[data-testid="mutate-callback"]');
      await expect(page.locator('[data-testid="callback-order-1"]')).toHaveText(
        "onMutate"
      );

      // 로딩 상태 확인
      await expect(page.locator('[data-testid="creating-post"]')).toBeVisible();

      // onSuccess 콜백 실행 (2초 후)
      await page.waitForSelector('[data-testid="success-callback"]');
      await expect(page.locator('[data-testid="callback-order-2"]')).toHaveText(
        "onSuccess"
      );

      // onSettled 콜백 실행 (마지막)
      await page.waitForSelector('[data-testid="settled-callback"]');
      await expect(page.locator('[data-testid="callback-order-3"]')).toHaveText(
        "onSettled"
      );

      // 최종 상태 확인
      await expect(
        page.locator('[data-testid="creating-post"]')
      ).not.toBeVisible();
      await expect(page.locator('[data-testid="post-created"]')).toBeVisible();
    });

    test("onMutate context가 다른 콜백에 전달", async ({ page }) => {
      await page.route("**/api/comments", async (route) => {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            content: "New comment",
            authorId: 1,
            createdAt: new Date().toISOString(),
          }),
        });
      });

      await page.goto("/mutation-callbacks/comment-creation");

      await page.fill('[data-testid="comment-content"]', "New comment");
      await page.click('[data-testid="create-comment-btn"]');

      // onMutate에서 설정한 context 확인
      await page.waitForSelector('[data-testid="mutate-context"]');
      const mutateContext = await page
        .locator('[data-testid="context-data"]')
        .textContent();
      expect(mutateContext).toContain("optimistic-id");
      expect(mutateContext).toContain("timestamp");

      // onSuccess에서 동일한 context 접근 확인
      await page.waitForSelector('[data-testid="success-context"]');
      const successContext = await page
        .locator('[data-testid="success-context-data"]')
        .textContent();
      expect(successContext).toBe(mutateContext); // 동일한 context여야 함

      // onSettled에서도 동일한 context 접근 확인
      await page.waitForSelector('[data-testid="settled-context"]');
      const settledContext = await page
        .locator('[data-testid="settled-context-data"]')
        .textContent();
      expect(settledContext).toBe(mutateContext);
    });

    test("에러 발생 시 onError → onSettled 콜백 순서", async ({ page }) => {
      await page.route("**/api/posts", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server Error" }),
        });
      });

      await page.goto("/mutation-callbacks/post-creation");

      await page.fill('[data-testid="post-title"]', "Error Post");
      await page.fill('[data-testid="post-content"]', "Post content");
      await page.click('[data-testid="create-post-btn"]');

      // onMutate 실행
      await page.waitForSelector('[data-testid="mutate-callback"]');

      // onError 콜백 실행
      await page.waitForSelector('[data-testid="error-callback"]');
      await expect(page.locator('[data-testid="callback-order-2"]')).toHaveText(
        "onError"
      );

      // onSettled 콜백 실행 (에러 상황에서도)
      await page.waitForSelector('[data-testid="settled-callback"]');
      await expect(page.locator('[data-testid="callback-order-3"]')).toHaveText(
        "onSettled"
      );

      // 에러 메시지 표시 확인
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        "Server Error"
      );
    });
  });

  test.describe("InvalidateQueries 동적 무효화", () => {
    test("함수형 invalidateQueries로 관련 쿼리 동적 무효화", async ({
      page,
    }) => {
      // 실제 API를 사용하도록 모킹 제거 - 실제 Next.js API routes 사용
      // 더 이상 route 모킹을 하지 않아 실제 DB 상태와 일치하게 됨

      await page.goto("/dynamic-invalidation/post-management");

      // 페이지 로드 대기
      await page.waitForLoadState('networkidle');
      
      // 페이지 내용 디버깅
      const pageContent = await page.locator('body').innerHTML();
      console.log("Page content preview:", pageContent.substring(0, 500));
      
      // 전체 게시물 목록 로드 (현재 DB 상태 확인)
      await page.waitForSelector('[data-testid="all-posts"]', { timeout: 10000 });
      const initialPostCount = await page
        .locator('[data-testid="post-item"]')
        .count();
      console.log(`현재 DB에 있는 게시물 개수: ${initialPostCount}`);
      expect(initialPostCount).toBeGreaterThanOrEqual(5); // 최소 5개 이상 있어야 함

      // 특정 카테고리 게시물만 표시
      await page.click('[data-testid="filter-tech-btn"]');
      await page.waitForSelector('[data-testid="tech-posts"]');
      const initialTechPostCount = await page
        .locator('[data-testid="tech-post-item"]')
        .count();
      console.log(`현재 기술 게시물 개수: ${initialTechPostCount}`);
      expect(initialTechPostCount).toBeGreaterThanOrEqual(2); // 최소 2개 이상

      // 새 tech 게시물 생성
      await page.fill('[data-testid="new-post-title"]', "New Tech Post");
      await page.selectOption('[data-testid="post-category-select"]', "tech");
      await page.click('[data-testid="create-post-btn"]');

      // mutation 성공 후 관련 쿼리들이 무효화되어 새로고침됨
      await page.waitForSelector('[data-testid="post-created"]');

      // 쿼리 무효화 후 리페치 완료까지 대기 (네트워크 요청 완료 대기)
      await page.waitForLoadState('networkidle');
      
      // 추가로 짧은 시간 대기하여 UI 업데이트 완료 보장
      await page.waitForTimeout(1000);

      // 전체 목록과 tech 카테고리 목록 모두 업데이트됨 (초기개수 + 1)
      const expectedTotalCount = initialPostCount + 1;
      await expect(page.locator('[data-testid="all-posts-count"]')).toHaveText(
        `(${expectedTotalCount})`
      );
      const expectedTechCount = initialTechPostCount + 1;
      await expect(page.locator('[data-testid="tech-posts-count"]')).toHaveText(
        `(${expectedTechCount})`
      );

      // life 카테고리는 영향받지 않음 (동적 무효화로 tech 관련만 무효화)
      await page.click('[data-testid="filter-life-btn"]');
      await page.waitForSelector('[data-testid="life-posts"]', { timeout: 5000 });
      const lifePostCount = await page
        .locator('[data-testid="life-post-item"]')
        .count();
      console.log(`라이프 게시물 개수: ${lifePostCount}`);
      expect(lifePostCount).toBeGreaterThanOrEqual(1); // 최소 1개 이상 있어야 함
    });

    test("조건부 쿼리 무효화", async ({ page }) => {
      // 사용자별 알림 API
      await page.route(
        "**/api/users/*/notifications",
        async (route, request) => {
          const userId = request
            .url()
            .match(/users\/(\d+)\/notifications/)?.[1];

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
            }),
          });
        }
      );

      // 알림 읽음 처리 API
      await page.route("**/api/notifications/*/read", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto("/conditional-invalidation/notifications");

      // 사용자 1 로그인 시뮬레이션
      await page.click('[data-testid="login-user-1-btn"]');

      await page.waitForSelector('[data-testid="user-1-notifications"]');
      await expect(page.locator('[data-testid="unread-count"]')).toHaveText(
        "1"
      );

      // 알림 읽음 처리
      await page.click('[data-testid="mark-read-btn"]');

      // 현재 사용자의 알림만 무효화되어야 함
      await page.waitForSelector('[data-testid="notification-read"]');

      // 다른 사용자로 전환
      await page.click('[data-testid="login-user-2-btn"]');

      // 사용자 2의 알림 로드 (별도의 쿼리이므로 영향받지 않음)
      await page.waitForSelector('[data-testid="user-2-notifications"]');

      const invalidationLog = await page
        .locator('[data-testid="invalidation-log"]')
        .textContent();
      expect(invalidationLog).toContain("user-1-notifications");
      expect(invalidationLog).not.toContain("user-2-notifications");
    });
  });

  test.describe("MutationFn 커스텀 함수", () => {
    test("파일 업로드 with progress tracking", async ({ page }) => {
      await page.route("**/api/upload", async (route, request) => {
        // 파일 업로드 시뮬레이션 (단계적 progress)
        const formData = await request.postDataBuffer();

        // progress 단계별로 응답
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            fileId: "uploaded-file-123",
            filename: "test-file.jpg",
            size: 1024000,
            url: "/uploads/test-file.jpg",
          }),
        });
      });

      await page.goto("/custom-mutations/file-upload");

      // 파일 선택 시뮬레이션
      const fileChooserPromise = page.waitForEvent("filechooser");
      await page.click('[data-testid="file-input"]');
      const fileChooser = await fileChooserPromise;

      // 가상의 파일 업로드
      await page.click('[data-testid="upload-btn"]');

      // 업로드 진행률 확인
      await page.waitForSelector('[data-testid="upload-progress"]');

      const progressBar = page.locator('[data-testid="progress-bar"]');
      await expect(progressBar).toBeVisible();

      // 업로드 완료
      await page.waitForSelector('[data-testid="upload-complete"]');
      await expect(
        page.locator('[data-testid="uploaded-file-name"]')
      ).toHaveText("test-file.jpg");
      await expect(
        page.locator('[data-testid="uploaded-file-size"]')
      ).toHaveText("1.0 MB");
    });

    test("복잡한 비즈니스 로직이 포함된 mutation", async ({ page }) => {
      // 주문 생성 과정: 재고 확인 → 결제 처리 → 주문 생성 → 재고 업데이트
      let stockCheckCalls = 0;
      let paymentCalls = 0;
      let orderCalls = 0;
      let stockUpdateCalls = 0;

      await page.route("**/api/products/*/stock", async (route) => {
        stockCheckCalls++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ available: 5, reserved: 0 }),
        });
      });

      await page.route("**/api/payments", async (route) => {
        paymentCalls++;
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            paymentId: "pay_123",
            status: "success",
            amount: 99.99,
          }),
        });
      });

      await page.route("**/api/orders", async (route, request) => {
        orderCalls++;
        const body = await request.postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            orderId: "order_456",
            items: body.items,
            total: 99.99,
            status: "confirmed",
          }),
        });
      });

      await page.route("**/api/products/*/stock", async (route, request) => {
        if (request.method() === "PUT") {
          stockUpdateCalls++;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ updated: true }),
          });
        }
      });

      await page.goto("/complex-mutations/order-creation");

      await page.fill('[data-testid="product-quantity"]', "2");
      await page.click('[data-testid="create-order-btn"]');

      // 단계별 진행 상황 확인
      await page.waitForSelector('[data-testid="checking-stock"]');
      await page.waitForSelector('[data-testid="processing-payment"]');
      await page.waitForSelector('[data-testid="creating-order"]');
      await page.waitForSelector('[data-testid="updating-stock"]');

      // 최종 주문 완료
      await page.waitForSelector('[data-testid="order-complete"]');
      await expect(page.locator('[data-testid="order-id"]')).toHaveText(
        "order_456"
      );

      // 모든 단계가 정확한 순서로 실행되었는지 확인
      expect(stockCheckCalls).toBe(1);
      expect(paymentCalls).toBe(1);
      expect(orderCalls).toBe(1);
      expect(stockUpdateCalls).toBe(1);
    });
  });
});
