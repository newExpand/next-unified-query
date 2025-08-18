'use client';

import React, { Suspense, useState } from 'react';
import { useQuery, useMutation, QueryClientProvider, HydrationBoundary } from 'next-unified-query/react';
import { configureQueryClient } from 'next-unified-query';

interface User {
  id: number;
  name: string;
  email: string;
}

// 기본 옵션이 적용된 컴포넌트
function DefaultOptionsQuery() {
  const { data, isLoading, error } = useQuery<User[]>({
    cacheKey: ['default-options-users'],
    url: '/users',
    // throwOnError가 전역 기본값으로 설정됨
  });

  if (isLoading) return <div data-testid="loading">Loading...</div>;
  if (error) return <div data-testid="error">Error: {error.message}</div>;

  return (
    <div data-testid="users-list">
      <h3>Users with Default Options</h3>
      {data?.map(user => (
        <div key={user.id} data-testid={`user-${user.id}`}>
          {user.name}
        </div>
      ))}
    </div>
  );
}

// 개별 옵션으로 오버라이드하는 컴포넌트
function OverrideOptionsQuery() {
  const { data, isLoading, error } = useQuery<User[]>({
    cacheKey: ['override-users'],
    url: '/users?error=500',
    throwOnError: false, // 전역 설정 오버라이드
  });

  if (isLoading) return <div data-testid="override-loading">Loading...</div>;
  
  return (
    <div data-testid="override-result">
      {error ? (
        <div data-testid="override-error" className="text-red-500">
          Handled Error: {error.message} (Status: {error.response?.status})
        </div>
      ) : (
        <div>
          <h3>Override Options</h3>
          {data?.map(user => (
            <div key={user.id}>{user.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// Suspense를 사용하는 컴포넌트
function SuspenseQuery() {
  const { data, error } = useQuery<User[]>({
    cacheKey: ['suspense-users'],
    url: '/users',
    suspense: true, // Suspense 모드 활성화
  });

  // Suspense 모드에서는 로딩 상태를 체크할 필요 없음
  if (error) return <div data-testid="suspense-error">Error: {error.message}</div>;

  return (
    <div data-testid="suspense-users">
      <h3>Users with Suspense</h3>
      {data?.map(user => (
        <div key={user.id} data-testid={`suspense-user-${user.id}`}>
          {user.name}
        </div>
      ))}
    </div>
  );
}

// Suspense + Error Boundary 조합
function SuspenseWithError() {
  const { data } = useQuery<User[]>({
    cacheKey: ['suspense-error-users'],
    url: '/users?error=500',
    suspense: true,
    throwOnError: true, // Error Boundary로 에러 전파
  });

  return (
    <div data-testid="suspense-with-error">
      <h3>This should not render on error</h3>
      {data?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

// Mutation with Default Options
function DefaultOptionsMutation() {
  const mutation = useMutation({
    url: '/users',
    method: 'POST',
    // throwOnError가 전역 기본값으로 설정됨
  });

  return (
    <div>
      <button
        onClick={() => mutation.mutate({ name: 'Test User', email: 'test@example.com' })}
        disabled={mutation.isPending}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        data-testid="mutation-button"
      >
        {mutation.isPending ? 'Creating...' : 'Create User'}
      </button>
      
      {mutation.isSuccess && (
        <div data-testid="mutation-success" className="text-green-500 mt-2">
          User created successfully!
        </div>
      )}
      
      {mutation.error && (
        <div data-testid="mutation-error" className="text-red-500 mt-2">
          Error: {mutation.error.message}
        </div>
      )}
    </div>
  );
}

// 커스텀 Provider로 기본 옵션 설정
function CustomProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider
      config={{
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
        defaultOptions: {
          queries: {
            throwOnError: true, // 모든 쿼리에 기본적으로 Error Boundary 사용
            suspense: false, // 기본적으로 Suspense 비활성화
            staleTime: 5000, // 5초 동안 fresh
            gcTime: 10000, // 10초 후 가비지 컬렉션
          },
          mutations: {
            throwOnError: (error: any) => error.response?.status >= 500, // 500+ 에러만 Error Boundary
          },
        },
      }}
    >
      {children}
    </QueryClientProvider>
  );
}

// Error Boundary Fallback
function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="border-2 border-red-500 p-4 rounded bg-red-50" data-testid="error-boundary">
      <h3 className="text-red-800 font-bold">Error Caught by Boundary</h3>
      <p className="text-red-700 mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
        data-testid="reset-error"
      >
        Reset
      </button>
    </div>
  );
}

// Simple Error Boundary Implementation
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: (error: Error, reset: () => void) => React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }

    return this.props.children;
  }
}

export default function DefaultOptionsPage() {
  const [testCase, setTestCase] = useState<string>('default');
  const [showSuspense, setShowSuspense] = useState(false);
  const [key, setKey] = useState(0);

  const reset = () => {
    setKey(k => k + 1);
    setTestCase('default');
    setShowSuspense(false);
  };

  return (
    <CustomProviderWrapper>
      <div className="container">
        <h1>Default Options & Suspense Example</h1>
        <p className="mb-6 text-gray-600">
          Test global default options and Suspense integration with Next Unified Query.
        </p>

        {/* Test Controls */}
        <div className="mb-8">
          <h2>Test Cases</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <button
              onClick={() => {
                setTestCase('default');
                setShowSuspense(false);
              }}
              className={`px-4 py-2 rounded ${
                testCase === 'default' && !showSuspense ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              data-testid="test-default"
            >
              Default Options
            </button>
            
            <button
              onClick={() => {
                setTestCase('override');
                setShowSuspense(false);
              }}
              className={`px-4 py-2 rounded ${
                testCase === 'override' && !showSuspense ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              data-testid="test-override"
            >
              Override Options
            </button>
            
            <button
              onClick={() => {
                setTestCase('mutation');
                setShowSuspense(false);
              }}
              className={`px-4 py-2 rounded ${
                testCase === 'mutation' && !showSuspense ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              data-testid="test-mutation"
            >
              Mutation Options
            </button>
            
            <button
              onClick={() => {
                setTestCase('suspense');
                setShowSuspense(true);
              }}
              className={`px-4 py-2 rounded ${
                testCase === 'suspense' && showSuspense ? 'bg-purple-500 text-white' : 'bg-purple-200'
              }`}
              data-testid="test-suspense"
            >
              Test Suspense
            </button>
            
            <button
              onClick={() => {
                setTestCase('suspense-error');
                setShowSuspense(true);
              }}
              className={`px-4 py-2 rounded ${
                testCase === 'suspense-error' && showSuspense ? 'bg-red-500 text-white' : 'bg-red-200'
              }`}
              data-testid="test-suspense-error"
            >
              Suspense + Error
            </button>
            
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-500 text-white rounded"
              data-testid="reset-all"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Test Area */}
        <ErrorBoundary key={key} fallback={(error, reset) => <ErrorFallback error={error} reset={reset} />}>
          <div className="border-2 border-blue-200 p-4 rounded bg-blue-50">
            <h3 className="text-blue-800 font-bold mb-4">Test Area</h3>
            
            {/* Regular Tests */}
            {!showSuspense && (
              <>
                {testCase === 'default' && <DefaultOptionsQuery />}
                {testCase === 'override' && <OverrideOptionsQuery />}
                {testCase === 'mutation' && <DefaultOptionsMutation />}
              </>
            )}
            
            {/* Suspense Tests */}
            {showSuspense && (
              <Suspense fallback={<div data-testid="suspense-fallback">Loading with Suspense...</div>}>
                {testCase === 'suspense-error' ? <SuspenseWithError /> : <SuspenseQuery />}
              </Suspense>
            )}
          </div>
        </ErrorBoundary>

        {/* Documentation */}
        <div className="mt-8">
          <h2>Configuration Used</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`defaultOptions: {
  queries: {
    throwOnError: true,        // All queries use Error Boundary by default
    suspense: false,           // Suspense disabled by default
    staleTime: 5000,          // Data stays fresh for 5 seconds
    gcTime: 10000,            // Garbage collected after 10 seconds
  },
  mutations: {
    throwOnError: (error) => error.response?.status >= 500,  // Only 500+ errors
  },
}`}
          </pre>
          
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>Default Options:</strong> Uses global throwOnError=true, so errors go to Error Boundary</p>
            <p><strong>Override Options:</strong> Sets throwOnError=false to handle errors locally</p>
            <p><strong>Suspense:</strong> Enables React Suspense for declarative loading states</p>
            <p><strong>Suspense + Error:</strong> Combines Suspense with Error Boundary for complete error handling</p>
          </div>
        </div>
      </div>
    </CustomProviderWrapper>
  );
}