'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, QueryErrorBoundary, QueryErrorResetBoundary, useErrorResetBoundary } from 'next-unified-query/react';

interface User {
  id: number;
  name: string;
  email: string;
}

// 500 에러를 발생시키는 컴포넌트
function QueryErrorComponent() {
  const { data, isLoading, error } = useQuery<User[]>({
    cacheKey: ['error-users'],
    url: '/users?error=500',
    throwOnError: true, // Error Boundary로 에러 전파
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>This should not render due to throwOnError</div>;

  return (
    <div>
      <h3>Users (this should not render on error)</h3>
      {data?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

// 조건부 에러 전파 컴포넌트
function ConditionalErrorComponent() {
  const [errorType, setErrorType] = useState<'404' | '500'>('404');
  
  const { data, isLoading, error } = useQuery<User[]>({
    cacheKey: ['conditional-error', errorType],
    url: `/users?error=${errorType}`,
    throwOnError: (error) => (error.response?.status ?? 0) >= 500, // 500+ 에러만 Error Boundary로 전파
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="mb-4">
        <button 
          onClick={() => setErrorType('404')}
          className={`mr-2 px-3 py-1 border rounded ${errorType === '404' ? 'bg-blue-500 text-white' : ''}`}
          data-testid="404-button"
        >
          404 Error (Handled)
        </button>
        <button 
          onClick={() => setErrorType('500')}
          className={`px-3 py-1 border rounded ${errorType === '500' ? 'bg-blue-500 text-white' : ''}`}
          data-testid="500-button"
        >
          500 Error (Boundary)
        </button>
      </div>
      
      {error ? (
        <div className="text-red-500" data-testid="handled-error">
          Error handled in component: {error.message} (Status: {error.response?.status})
        </div>
      ) : (
        <div>
          <h3>Conditional Error Test</h3>
          {data?.map(user => (
            <div key={user.id}>{user.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// Mutation 에러 컴포넌트
function MutationErrorComponent() {
  const mutation = useMutation({
    url: '/users',
    method: 'POST',
    throwOnError: true,
  });

  return (
    <div>
      <button 
        onClick={() => mutation.mutate({ error: 'mutation' })}
        disabled={mutation.isPending}
        className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        data-testid="mutation-error-button"
      >
        {mutation.isPending ? 'Mutating...' : 'Trigger Mutation Error'}
      </button>
      
      {mutation.error && (
        <div className="text-red-500 mt-2">
          This should not render due to throwOnError
        </div>
      )}
    </div>
  );
}

// 프로그래매틱 리셋 컴포넌트
function ResetButtonComponent({ onReset }: { onReset: () => void }) {
  return (
    <button 
      onClick={onReset}
      className="px-4 py-2 bg-green-500 text-white rounded"
      data-testid="programmatic-reset-button"
    >
      Reset from Child Component
    </button>
  );
}

// useErrorResetBoundary를 사용하는 컴포넌트
function DeepChildWithReset() {
  const resetErrorBoundary = useErrorResetBoundary();
  const [hasTriggeredError, setHasTriggeredError] = useState(false);

  const { data, error, isLoading } = useQuery<User[]>({
    cacheKey: ['deep-child-error'],
    url: '/users?error=500',
    throwOnError: true,
    enabled: hasTriggeredError,
  });

  if (!hasTriggeredError) {
    return (
      <div>
        <p className="mb-4">This component can trigger an error and reset it from deep within the component tree.</p>
        <button
          onClick={() => setHasTriggeredError(true)}
          className="px-4 py-2 bg-red-500 text-white rounded"
          data-testid="trigger-deep-error"
        >
          Trigger Error in Deep Child
        </button>
      </div>
    );
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h3>This should not render due to error</h3>
      {data?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

// useErrorResetBoundary를 사용하는 복구 컴포넌트
function RecoveryComponent() {
  const resetErrorBoundary = useErrorResetBoundary();
  
  const handleReset = () => {
    // 여기서 상태 초기화나 캐시 무효화 등을 수행할 수 있습니다
    console.log('Resetting from deep child component...');
    resetErrorBoundary();
  };

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
      <p className="text-sm text-yellow-800 mb-2">
        This component can reset the Error Boundary using useErrorResetBoundary hook
      </p>
      <button
        onClick={handleReset}
        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        data-testid="deep-reset-button"
      >
        Reset from Deep Child
      </button>
    </div>
  );
}

// 커스텀 Fallback UI - 올바른 타입 시그니처 사용
const CustomErrorFallback = (error: Error, reset: () => void) => {
  // 안전한 에러 정보 추출
  const errorMessage = error?.message || 'Unknown error occurred';
  const errorStatus = (error as any)?.response?.status || (error as any)?.status;
  const errorName = error?.name || 'Error';
  
  return (
    <div className="border-2 border-red-500 p-4 rounded bg-red-50" data-testid="error-boundary-fallback">
      <h3 className="text-red-800 font-bold">🚨 Error Boundary Caught an Error</h3>
      <p className="text-red-700 mt-2">
        <strong>Error:</strong> {errorMessage}
      </p>
      <p className="text-red-700">
        <strong>Type:</strong> {errorName}
      </p>
      {errorStatus && (
        <p className="text-red-700">
          <strong>Status:</strong> {errorStatus}
        </p>
      )}
      <div className="mt-4 space-x-2">
        <button 
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          data-testid="error-boundary-reset-button"
        >
          Try Again
        </button>
        <ResetButtonComponent onReset={reset} />
      </div>
    </div>
  );
};

// Error Boundary 래퍼 컴포넌트
function ErrorBoundaryWrapper({ children, resetKey }: { children: React.ReactNode; resetKey: number }) {
  return (
    <QueryErrorBoundary
      resetKeys={[resetKey]}
      fallback={CustomErrorFallback}
      onReset={() => console.log('Error boundary reset')}
    >
      {children}
    </QueryErrorBoundary>
  );
}

// QueryErrorResetBoundary를 사용한 래퍼 컴포넌트
function ResetBoundaryWrapper({ children, resetKey }: { children: React.ReactNode; resetKey: number }) {
  // resetKey가 변경되면 컴포넌트를 다시 마운트하여 리셋
  return (
    <QueryErrorResetBoundary
      key={resetKey}
      fallback={(error, reset) => (
        <div className="border-2 border-purple-500 p-4 rounded bg-purple-50" data-testid="reset-boundary-fallback">
          <h3 className="text-purple-800 font-bold">🔄 Error Reset Boundary Active</h3>
          <p className="text-purple-700 mt-2">
            <strong>Error:</strong> {error?.message || 'Unknown error'}
          </p>
          <div className="mt-4 space-y-2">
            <button 
              onClick={reset}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              data-testid="reset-boundary-reset-button"
            >
              Reset Error Boundary
            </button>
            <RecoveryComponent />
          </div>
        </div>
      )}
      onReset={() => console.log('QueryErrorResetBoundary was reset')}
    >
      {children}
    </QueryErrorResetBoundary>
  );
}

export default function ErrorBoundaryPage() {
  const [activeTest, setActiveTest] = useState<string>('none');
  const [resetKey, setResetKey] = useState(0);
  const [boundaryType, setBoundaryType] = useState<'standard' | 'reset'>('standard');

  const resetAll = () => {
    setActiveTest('none');
    setResetKey(k => k + 1);
  };

  return (
    <div className="container">
      <h1>Error Boundary Example</h1>
      <p className="mb-6 text-gray-600">
        Test various Error Boundary scenarios with useQuery and useMutation hooks.
      </p>

      {/* Boundary Type Selector */}
      <div className="mb-6">
        <h2>Select Error Boundary Type</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setBoundaryType('standard')}
            className={`px-4 py-2 rounded ${
              boundaryType === 'standard' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            data-testid="standard-boundary-button"
          >
            QueryErrorBoundary (Standard)
          </button>
          <button
            onClick={() => setBoundaryType('reset')}
            className={`px-4 py-2 rounded ${
              boundaryType === 'reset' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            data-testid="reset-boundary-button"
          >
            QueryErrorResetBoundary (with Hook)
          </button>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-8">
        <h2>Error Boundary Tests</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button 
            onClick={() => setActiveTest('query-error')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            data-testid="query-error-test"
          >
            Test Query Error (500)
          </button>
          
          <button 
            onClick={() => setActiveTest('conditional-error')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            data-testid="conditional-error-test"
          >
            Test Conditional Error
          </button>
          
          <button 
            onClick={() => setActiveTest('mutation-error')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            data-testid="mutation-error-test"
          >
            Test Mutation Error
          </button>
          
          <button 
            onClick={() => setActiveTest('deep-child-error')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            data-testid="deep-child-error-test"
          >
            Test Deep Child Error
          </button>
          
          <button 
            onClick={resetAll}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            data-testid="reset-all-button"
          >
            Reset All Tests
          </button>
        </div>
      </div>

      {/* Error Boundary based on selected type */}
      {boundaryType === 'standard' ? (
        <ErrorBoundaryWrapper resetKey={resetKey}>
          <div className="border-2 border-blue-200 p-4 rounded bg-blue-50">
            <h3 className="text-blue-800 font-bold mb-4">Protected Area (Standard Error Boundary)</h3>
          
          {activeTest === 'none' && (
            <div data-testid="no-active-test">
              <p>No active test. Click a button above to trigger an error.</p>
            </div>
          )}
          
            {activeTest === 'query-error' && <QueryErrorComponent />}
            {activeTest === 'conditional-error' && <ConditionalErrorComponent />}
            {activeTest === 'mutation-error' && <MutationErrorComponent />}
            {activeTest === 'deep-child-error' && <DeepChildWithReset />}
          </div>
        </ErrorBoundaryWrapper>
      ) : (
        <ResetBoundaryWrapper resetKey={resetKey}>
          <div className="border-2 border-purple-200 p-4 rounded bg-purple-50">
            <h3 className="text-purple-800 font-bold mb-4">Protected Area (Reset Boundary with Hook)</h3>
            
            {activeTest === 'none' && (
              <div data-testid="no-active-test">
                <p>No active test. Click a button above to trigger an error.</p>
              </div>
            )}
            
            {activeTest === 'query-error' && <QueryErrorComponent />}
            {activeTest === 'conditional-error' && <ConditionalErrorComponent />}
            {activeTest === 'mutation-error' && <MutationErrorComponent />}
            {activeTest === 'deep-child-error' && <DeepChildWithReset />}
          </div>
        </ResetBoundaryWrapper>
      )}

      {/* Documentation */}
      <div className="mt-8">
        <h2>How it works</h2>
        <div className="space-y-4 text-sm">
          <div className="card">
            <h3 className="font-semibold">Query Error (500)</h3>
            <p>Uses <code>throwOnError: true</code> to propagate all errors to Error Boundary.</p>
          </div>
          
          <div className="card">
            <h3 className="font-semibold">Conditional Error</h3>
            <p>Uses <code>throwOnError: (error) =&gt; error.response?.status &gt;= 500</code> to only propagate 500+ errors.</p>
          </div>
          
          <div className="card">
            <h3 className="font-semibold">Mutation Error</h3>
            <p>Shows that <code>useMutation</code> can also propagate errors to Error Boundary with <code>throwOnError</code>.</p>
          </div>
          
          <div className="card">
            <h3 className="font-semibold">Reset Mechanisms</h3>
            <ul className="list-disc list-inside">
              <li>Reset button in fallback UI</li>
              <li>Programmatic reset using <code>useErrorResetBoundary</code></li>
              <li>Automatic reset on <code>resetKeys</code> change</li>
            </ul>
          </div>
          
          <div className="card">
            <h3 className="font-semibold">QueryErrorResetBoundary</h3>
            <p>Provides <code>useErrorResetBoundary</code> hook for programmatic reset from any child component.</p>
            <p>Automatically manages reset keys internally, simplifying the API.</p>
          </div>
        </div>
      </div>
    </div>
  );
}