import { test, expect } from '@playwright/test';

test.describe('Error Boundary Real-World Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/examples/error-boundary');
  });

  test('should display error boundary page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Error Boundary + Suspense Example');
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

test.describe('Suspense + Error Boundary Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/examples/error-boundary');
    // Enable Suspense mode
    await page.click('[data-testid="suspense-toggle"]');
  });

  test('should show Suspense fallback before error with throwOnError', async ({ page }) => {
    // Click query error test
    await page.click('[data-testid="query-error-test"]');
    
    // Should see Suspense fallback first
    await expect(page.locator('[data-testid="suspense-fallback"]')).toBeVisible();
    await expect(page.locator('[data-testid="suspense-fallback"]')).toContainText('Loading with Suspense');
    
    // Then error boundary catches the error
    await page.waitForSelector('[data-testid="error-boundary-fallback"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="error-boundary-fallback"]')).toContainText('Error Boundary Caught an Error');
    
    // Suspense fallback should be gone
    await expect(page.locator('[data-testid="suspense-fallback"]')).not.toBeVisible();
  });

  test('should handle parallel loading with independent error boundaries', async ({ page }) => {
    // Click dashboard test
    await page.click('[data-testid="dashboard-test"]');
    
    // Should see multiple loading states
    await expect(page.locator('text=Loading Stats')).toBeVisible();
    await expect(page.locator('text=Loading Activity')).toBeVisible();
    await expect(page.locator('text=Loading Notifications')).toBeVisible();
    
    // Wait for widgets to load
    await page.waitForTimeout(2000);
    
    // Should see widget content (or errors if APIs fail)
    const widgetStats = page.locator('[data-testid="widget-stats"]');
    const widgetActivity = page.locator('[data-testid="widget-activity"]');
    const widgetNotifications = page.locator('[data-testid="widget-notifications"]');
    
    // At least one widget should be visible
    await expect(async () => {
      const statsVisible = await widgetStats.isVisible();
      const activityVisible = await widgetActivity.isVisible();
      const notificationsVisible = await widgetNotifications.isVisible();
      const errorVisible = await page.locator('[data-testid="error-boundary-fallback"]').isVisible();
      
      expect(statsVisible || activityVisible || notificationsVisible || errorVisible).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });

  test('should reset from Error Boundary and show Suspense again', async ({ page }) => {
    // Trigger an error
    await page.click('[data-testid="query-error-test"]');
    
    // Wait for error boundary
    await page.waitForSelector('[data-testid="error-boundary-fallback"]', { timeout: 5000 });
    
    // Reset the error
    await page.click('[data-testid="error-boundary-reset-button"]');
    
    // Wait a bit for reset
    await page.waitForTimeout(500);
    
    // Component re-mounts and immediately tries to fetch again
    // It might show Suspense briefly or go straight to error
    await expect(async () => {
      const suspenseVisible = await page.locator('[data-testid="suspense-fallback"]').isVisible();
      const errorVisible = await page.locator('[data-testid="error-boundary-fallback"]').isVisible();
      expect(suspenseVisible || errorVisible).toBeTruthy();
    }).toPass({ timeout: 5000 });
    
    // Eventually error occurs again
    await page.waitForSelector('[data-testid="error-boundary-fallback"]', { timeout: 5000 });
  });

  test('should work with user profile pattern', async ({ page }) => {
    // Click user profile test
    await page.click('[data-testid="user-profile-test"]');
    
    // Should see Suspense fallback
    await expect(page.locator('[data-testid="suspense-fallback"]')).toBeVisible();
    
    // Wait for profile to load
    await page.waitForTimeout(2000);
    
    // Should see user profile or error
    await expect(async () => {
      const profileVisible = await page.locator('[data-testid="user-profile"]').isVisible();
      const errorVisible = await page.locator('[data-testid="error-boundary-fallback"]').isVisible();
      
      expect(profileVisible || errorVisible).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });

  test('should toggle between legacy and modern patterns', async ({ page }) => {
    // Start with Suspense mode (already enabled in beforeEach)
    await page.click('[data-testid="query-error-test"]');
    
    // Should see Suspense fallback
    await expect(page.locator('[data-testid="suspense-fallback"]')).toBeVisible();
    
    // Reset
    await page.click('[data-testid="reset-all-button"]');
    await page.waitForTimeout(500);
    
    // Disable Suspense mode
    await page.click('[data-testid="suspense-toggle"]');
    
    // Click query error test again
    await page.click('[data-testid="query-error-test"]');
    
    // Should NOT see Suspense fallback (legacy mode shows "Loading..." text instead)
    await expect(page.locator('[data-testid="suspense-fallback"]')).not.toBeVisible();
    
    // But should still see error boundary
    await page.waitForSelector('[data-testid="error-boundary-fallback"]', { timeout: 5000 });
  });
});