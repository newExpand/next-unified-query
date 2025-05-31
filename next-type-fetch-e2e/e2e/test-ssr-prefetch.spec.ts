import { test, expect } from "@playwright/test";

test.describe("SSR prefetch + hydrate e2e", () => {
  test("SSR에서 prefetch된 데이터가 클라이언트에서 fetch 없이 바로 노출된다", async ({
    page,
  }) => {
    await page.goto("/test-ssr-prefetch");
    await page.waitForSelector('[data-testid="ssr-query-result"]');
    const name = await page
      .locator('[data-testid="ssr-query-result"] >> text=name:')
      .textContent();
    expect(name).toContain("name:");
  });
});
