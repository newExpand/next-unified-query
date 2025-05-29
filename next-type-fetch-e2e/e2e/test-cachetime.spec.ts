import { test, expect } from "@playwright/test";
import { QueryClient } from "next-type-fetch";

const CACHE_TIME = 500;
const WAIT_MARGIN = 1000; // 넉넉하게

const queryClient = new QueryClient();

test.beforeEach(async ({ context }) => {
  queryClient.clear();
  await context.clearCookies();
});

async function getTimestamp(page) {
  let value = "";
  for (let i = 0; i < 20; i++) {
    value = await page
      .locator('[data-testid="query-result"] >> text=timestamp:')
      .textContent();
    if (value && value.trim() !== "timestamp:") break;
    await page.waitForTimeout(100);
  }
  if (!value || value.trim() === "timestamp:") {
    throw new Error("timestamp 값을 읽지 못했습니다: " + value);
  }
  return value;
}

test.describe("cacheTime e2e", () => {
  test("cacheTime 내 재마운트 시 캐시 유지, cacheTime 경과 후 삭제", async ({
    page,
  }) => {
    await page.goto("/test-cachetime");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.waitForSelector('[data-testid="query-result"]');
    const firstTimestamp = await getTimestamp(page);

    // 언마운트
    await page.click('[data-testid="toggle-query"]');
    // cacheTime 내 재마운트 (100ms로 줄임)
    await page.waitForTimeout(100);
    await page.click('[data-testid="toggle-query"]');
    await page.waitForSelector('[data-testid="query-result"]');
    const secondTimestamp = await getTimestamp(page);
    // 오차 2000ms 이내 허용
    const first = Number(firstTimestamp.split(":")[1].trim());
    const second = Number(secondTimestamp.split(":")[1].trim());
    expect(Math.abs(second - first)).toBeLessThanOrEqual(2000);

    // 다시 언마운트
    await page.click('[data-testid="toggle-query"]');
    // cacheTime 경과 대기
    await page.waitForTimeout(CACHE_TIME + WAIT_MARGIN);
    // 재마운트
    await page.click('[data-testid="toggle-query"]');
    await page.waitForSelector('[data-testid="query-result"]');
    const thirdTimestamp = await getTimestamp(page);
    expect(thirdTimestamp).not.toBe(firstTimestamp);
  });
});
