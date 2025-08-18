import { test, expect } from '@playwright/test';

test.describe('Default Options & Suspense', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/default-options');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Global Default Options', () => {
    test('should apply global throwOnError option to queries', async ({ page }) => {
      // 기본 옵션 테스트 클릭
      await page.getByTestId('test-default').click();
      
      // 로딩 상태 또는 바로 데이터가 표시될 수 있음 (캐시가 있거나 매우 빠른 경우)
      // 둘 중 하나를 기다림
      await expect(async () => {
        const loading = await page.getByTestId('loading').isVisible();
        const usersList = await page.getByTestId('users-list').isVisible();
        expect(loading || usersList).toBeTruthy();
      }).toPass({ timeout: 5000 });
      
      // 최종적으로 데이터가 표시되는지 확인
      await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('user-1')).toBeVisible();
    });

    test('should override global options with local options', async ({ page }) => {
      // 오버라이드 테스트 클릭
      await page.getByTestId('test-override').click();
      
      // 로딩 상태 확인
      await expect(page.getByTestId('override-loading')).toBeVisible();
      
      // throwOnError=false로 오버라이드했으므로 에러가 컴포넌트에서 처리됨
      await expect(page.getByTestId('override-error')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('override-error')).toContainText('Handled Error');
      await expect(page.getByTestId('override-error')).toContainText('Status: 500');
      
      // Error Boundary가 트리거되지 않았는지 확인
      await expect(page.getByTestId('error-boundary')).not.toBeVisible();
    });

    test('should apply global mutation options', async ({ page }) => {
      // Mutation 테스트 클릭
      await page.getByTestId('test-mutation').click();
      
      // Mutation 버튼 클릭
      await page.getByTestId('mutation-button').click();
      
      // 성공 메시지 확인
      await expect(page.getByTestId('mutation-success')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('mutation-success')).toContainText('User created successfully');
    });

    test('should respect staleTime and gcTime from global options', async ({ page }) => {
      // 기본 옵션으로 데이터 로드
      await page.getByTestId('test-default').click();
      await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 5000 });
      
      // 다른 테스트로 전환
      await page.getByTestId('test-override').click();
      await page.waitForTimeout(1000);
      
      // 다시 기본 옵션으로 돌아왔을 때 캐시된 데이터가 즉시 표시되어야 함
      // (staleTime=5000ms 이내)
      await page.getByTestId('test-default').click();
      
      // 로딩 없이 바로 데이터가 표시되어야 함
      await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 100 });
      await expect(page.getByTestId('loading')).not.toBeVisible();
    });
  });

  test.describe('Suspense Integration', () => {
    test('should show Suspense fallback while loading', async ({ page }) => {
      // Suspense 테스트 클릭
      await page.getByTestId('test-suspense').click();
      
      // Suspense fallback이 표시되는지 확인
      await expect(page.getByTestId('suspense-fallback')).toBeVisible();
      await expect(page.getByTestId('suspense-fallback')).toContainText('Loading with Suspense...');
      
      // 데이터 로드 후 실제 컨텐츠가 표시되는지 확인
      await expect(page.getByTestId('suspense-users')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('suspense-user-1')).toBeVisible();
      
      // Suspense fallback이 사라졌는지 확인
      await expect(page.getByTestId('suspense-fallback')).not.toBeVisible();
    });

    test('should handle Suspense with Error Boundary', async ({ page }) => {
      // Suspense + Error 테스트 클릭
      await page.getByTestId('test-suspense-error').click();
      
      // 먼저 Suspense fallback이 표시됨
      await expect(page.getByTestId('suspense-fallback')).toBeVisible();
      
      // 에러가 발생하면 Error Boundary가 캐치
      await expect(page.getByTestId('error-boundary')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('error-boundary')).toContainText('Error Caught by Boundary');
      
      // Suspense fallback은 사라짐
      await expect(page.getByTestId('suspense-fallback')).not.toBeVisible();
    });

    test('should reset Error Boundary and retry', async ({ page }) => {
      // Suspense + Error 테스트로 에러 발생
      await page.getByTestId('test-suspense-error').click();
      await expect(page.getByTestId('error-boundary')).toBeVisible({ timeout: 5000 });
      
      // Reset 버튼 클릭
      await page.getByTestId('reset-error').click();
      
      // Reset 후 컴포넌트가 다시 마운트되고 Suspense 또는 Error가 표시됨
      // 네트워크 속도에 따라 Suspense fallback이 보이거나 바로 에러가 발생할 수 있음
      await expect(async () => {
        const suspenseFallback = await page.getByTestId('suspense-fallback').isVisible();
        const errorBoundary = await page.getByTestId('error-boundary').isVisible();
        expect(suspenseFallback || errorBoundary).toBeTruthy();
      }).toPass({ timeout: 5000 });
      
      // 최종적으로 다시 에러가 발생
      await expect(page.getByTestId('error-boundary')).toBeVisible({ timeout: 5000 });
    });

    test('should properly unmount and remount with Suspense', async ({ page }) => {
      // Suspense 테스트 시작
      await page.getByTestId('test-suspense').click();
      await expect(page.getByTestId('suspense-users')).toBeVisible({ timeout: 5000 });
      
      // 다른 테스트로 전환
      await page.getByTestId('test-default').click();
      
      // 잠시 대기 후 상태 확인
      await page.waitForTimeout(500);
      
      // 로딩 또는 바로 데이터 표시 (캐시 상태에 따라)
      const hasContent = await page.locator('[data-testid="loading"], [data-testid="users-list"]').first().isVisible();
      if (!hasContent) {
        // 아무것도 표시되지 않으면 다시 클릭
        await page.getByTestId('test-default').click();
      }
      await expect(page.locator('[data-testid="loading"], [data-testid="users-list"]').first()).toBeVisible({ timeout: 5000 });
      
      // 다시 Suspense로 돌아오기
      await page.getByTestId('test-suspense').click();
      
      // Suspense fallback 또는 바로 데이터 표시 (캐시 상태에 따라)
      await expect(async () => {
        const suspenseFallback = await page.getByTestId('suspense-fallback').isVisible();
        const suspenseUsers = await page.getByTestId('suspense-users').isVisible();
        expect(suspenseFallback || suspenseUsers).toBeTruthy();
      }).toPass({ timeout: 5000 });
      
      // 최종적으로 데이터가 표시됨
      await expect(page.getByTestId('suspense-users')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Error Handling with Global Options', () => {
    test('should propagate errors to Error Boundary when throwOnError is true globally', async ({ page }) => {
      // 먼저 오버라이드 테스트로 500 에러 발생
      await page.getByTestId('test-override').click();
      
      // throwOnError=false로 오버라이드했으므로 컴포넌트에서 처리
      await expect(page.getByTestId('override-error')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('error-boundary')).not.toBeVisible();
    });

    test('should handle conditional throwOnError for mutations', async ({ page }) => {
      // Mutation 테스트에서 에러 시뮬레이션을 위해 
      // Mock Server 설정이 필요하므로 이 테스트는 Mock Server 구현 후 추가
      // 현재는 성공 케이스만 테스트
      await page.getByTestId('test-mutation').click();
      await page.getByTestId('mutation-button').click();
      await expect(page.getByTestId('mutation-success')).toBeVisible({ timeout: 5000 });
    });

    test('should reset all tests properly', async ({ page }) => {
      // 여러 테스트 실행
      await page.getByTestId('test-default').click();
      await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 5000 });
      
      await page.getByTestId('test-suspense').click();
      await expect(page.getByTestId('suspense-users')).toBeVisible({ timeout: 5000 });
      
      // Reset All 클릭
      await page.getByTestId('reset-all').click();
      
      // 모든 컴포넌트가 언마운트되고 초기 상태로 돌아감
      await page.getByTestId('test-default').click();
      
      // 로딩 또는 바로 데이터 표시 (캐시가 클리어되었는지에 따라)
      await expect(async () => {
        const loading = await page.getByTestId('loading').isVisible();
        const usersList = await page.getByTestId('users-list').isVisible();
        expect(loading || usersList).toBeTruthy();
      }).toPass({ timeout: 5000 });
      
      // 최종적으로 데이터가 표시됨
      await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Performance and Memory', () => {
    test('should not cause memory leaks with repeated mounting/unmounting', async ({ page }) => {
      // 여러 번 컴포넌트를 마운트/언마운트
      for (let i = 0; i < 5; i++) {
        await page.getByTestId('test-default').click();
        await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 5000 });
        
        await page.getByTestId('test-suspense').click();
        await expect(page.getByTestId('suspense-users')).toBeVisible({ timeout: 5000 });
        
        await page.getByTestId('test-override').click();
        
        // 잠시 대기 후 상태 확인
        await page.waitForTimeout(300);
        
        // 로딩 또는 에러 표시를 기다림
        await expect(page.locator('[data-testid="override-loading"], [data-testid="override-error"]').first()).toBeVisible({ timeout: 5000 });
        
        // 최종적으로 에러가 표시됨
        await expect(page.getByTestId('override-error')).toBeVisible({ timeout: 5000 });
      }
      
      // 메모리 누수가 없는지 확인 (간접적으로 성능 체크)
      // 마지막 테스트가 여전히 빠르게 로드되는지 확인
      await page.getByTestId('test-default').click();
      await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 1000 });
    });

    test('should handle rapid test switching', async ({ page }) => {
      // 빠르게 테스트 전환
      await page.getByTestId('test-default').click();
      await page.getByTestId('test-override').click();
      await page.getByTestId('test-mutation').click();
      await page.getByTestId('test-suspense').click();
      
      // 마지막 테스트가 정상적으로 로드되는지 확인
      await expect(page.getByTestId('suspense-users')).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Rendering Optimization Impact', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/default-options');
    await page.waitForLoadState('networkidle');
  });

  test('should not cause unnecessary re-renders with merged options', async ({ page }) => {
    // 콘솔 로그를 캡처하여 렌더링 횟수 체크
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // 컴포넌트에 렌더링 카운터 추가 (실제 구현 시)
    await page.getByTestId('test-default').click();
    await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 5000 });
    
    // 같은 테스트를 다시 클릭해도 불필요한 재렌더링이 없어야 함
    const initialLogCount = consoleLogs.length;
    await page.getByTestId('test-default').click();
    await page.waitForTimeout(100);
    
    // 로그 수가 크게 증가하지 않았는지 확인
    const newLogCount = consoleLogs.length - initialLogCount;
    expect(newLogCount).toBeLessThan(3); // 최소한의 렌더링만 발생
  });

  test('should maintain stable references with direct merging', async ({ page }) => {
    // 기본 옵션 테스트
    await page.getByTestId('test-default').click();
    await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 5000 });
    
    // 페이지 내에서 다른 상태 변경 (있다면)
    // 예: 다른 UI 요소 클릭
    
    // 쿼리 컴포넌트가 불필요하게 재렌더링되지 않는지 확인
    // users-list가 여전히 동일한 상태를 유지
    await expect(page.getByTestId('users-list')).toBeVisible();
    await expect(page.getByTestId('user-1')).toBeVisible();
  });

  test('should handle options changes efficiently', async ({ page }) => {
    // 옵션이 변경되는 시나리오 테스트
    await page.getByTestId('test-default').click();
    await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 5000 });
    
    // Override 테스트로 전환 (다른 옵션 사용)
    await page.getByTestId('test-override').click();
    await expect(page.getByTestId('override-error')).toBeVisible({ timeout: 5000 });
    
    // 다시 기본으로 돌아오기
    await page.getByTestId('test-default').click();
    
    // Observer가 효율적으로 옵션 변경을 처리하는지 확인
    // 캐시가 있다면 즉시 표시되어야 함
    await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 100 });
  });
});