import { test, expect } from '@playwright/test';

test.describe('Error Boundary Real-World Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/examples/error-boundary');
  });

  test('should display error boundary page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Error Boundary Example');
  });

  test('should catch query error with throwOnError', async ({ page }) => {
    // Click test button for query error
    await page.click('[data-testid="query-error-test"]');
    
    // Wait for error boundary to catch the error
    await page.waitForSelector('[data-testid="error-boundary-fallback"]', { timeout: 5000 });
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-boundary-fallback"]')).toContainText('Error Boundary Caught an Error');
    
    // First, reset all tests to clear the activeTest state
    await page.click('[data-testid="reset-all-button"]');
    
    // Wait a bit for reset to complete
    await page.waitForTimeout(500);
    
    // Now verify the no-active-test message is shown
    await expect(page.locator('[data-testid="no-active-test"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-active-test"]')).toContainText('No active test');
  });

  test('should handle conditional error properly', async ({ page }) => {
    // Click conditional error test
    await page.click('[data-testid="conditional-error-test"]');
    
    // Click 404 button - should NOT trigger error boundary
    await page.click('[data-testid="404-button"]');
    await page.waitForTimeout(1000);
    
    // Should see handled error message, not error boundary
    await expect(page.locator('[data-testid="handled-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="handled-error"]')).toContainText('Error handled in component');
    await expect(page.locator('[data-testid="handled-error"]')).toContainText('404');
    
    // Click 500 button - should trigger error boundary
    await page.click('[data-testid="500-button"]');
    await page.waitForTimeout(1000);
    
    // Should see error boundary fallback
    await expect(page.locator('[data-testid="error-boundary-fallback"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-boundary-fallback"]')).toContainText('Error Boundary Caught an Error');
  });

  test('should catch mutation error with throwOnError', async ({ page }) => {
    // Click mutation error test
    await page.click('[data-testid="mutation-error-test"]');
    
    // Click mutate button
    await page.click('[data-testid="mutation-error-button"]');
    
    // Wait for error boundary to catch the error
    await page.waitForSelector('[data-testid="error-boundary-fallback"]', { timeout: 5000 });
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-boundary-fallback"]')).toContainText('Error Boundary Caught an Error');
  });

  test('should work with QueryErrorResetBoundary', async ({ page }) => {
    // Switch to reset boundary
    await page.click('[data-testid="reset-boundary-button"]');
    
    // Trigger an error
    await page.click('[data-testid="query-error-test"]');
    
    // Wait for reset boundary fallback
    await page.waitForSelector('[data-testid="reset-boundary-fallback"]', { timeout: 5000 });
    
    // Verify reset boundary is active
    await expect(page.locator('[data-testid="reset-boundary-fallback"]')).toContainText('Error Reset Boundary Active');
    
    // Click the reset button in the error boundary
    await page.click('[data-testid="reset-boundary-reset-button"]');
    
    // Wait a bit for reset to complete
    await page.waitForTimeout(1000);
    
    // Since the error condition still exists (query-error test is still active),
    // the error boundary should catch the error again
    await expect(page.locator('[data-testid="reset-boundary-fallback"]')).toBeVisible();
    await expect(page.locator('[data-testid="reset-boundary-fallback"]')).toContainText('Error Reset Boundary Active');
    
    // This demonstrates that Error Boundary correctly re-catches errors when conditions haven't changed
    // Now click "Reset All Tests" to actually clear the error condition
    await page.click('[data-testid="reset-all-button"]');
    await page.waitForTimeout(500);
    
    // Now the error should be gone
    await expect(page.locator('[data-testid="reset-boundary-fallback"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="no-active-test"]')).toBeVisible();
  });
});