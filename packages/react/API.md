# Next Unified Query API Documentation

> A comprehensive API reference for next-unified-query - a high-performance HTTP client and state management library for React applications.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Available Packages](#available-packages)
- [Core APIs](#core-apis)
  - [createFetch](#createfetch)
  - [QueryClient](#queryclient)
  - [Query Client Manager](#query-client-manager)
  - [Query Factories](#query-factories)
  - [Mutation Factories](#mutation-factories)
  - [Interceptors](#interceptors)
- [React Hooks](#react-hooks)
  - [useQuery](#usequery)
  - [useMutation](#usemutation)
  - [QueryClientProvider](#queryclientprovider)
  - [useQueryClient](#usequeryclient)
- [Type Definitions](#type-definitions)
- [Error Handling Utilities](#error-handling-utilities)
- [Response Utilities](#response-utilities)
- [SSR Support](#ssr-support)
- [Constants and Enums](#constants-and-enums)
- [Advanced Error Utilities](#advanced-error-utilities)
- [Examples](#examples)
- [Migration Guide](#migration-guide)

## Installation

사용자는 React 패키지만 설치하면 됩니다. Core 패키지는 자동으로 포함됩니다.

```bash
# npm
npm install next-unified-query

# yarn
yarn add next-unified-query

# pnpm
pnpm add next-unified-query
```

## Available Packages

### `next-unified-query`
메인 패키지로 React hooks와 core 기능을 모두 포함합니다.

```typescript
// 모든 core 기능들 (서버 안전)
import { 
  QueryClient, 
  createFetch, 
  createQueryFactory,
  createMutationFactory 
} from 'next-unified-query';

// React 전용 기능들 (클라이언트만)
import { 
  useQuery, 
  useMutation,
  QueryClientProvider 
} from 'next-unified-query/react';
```

### `next-unified-query-core` (선택사항)
Core 기능만 필요한 경우 직접 설치할 수 있습니다. 일반적으로 필요하지 않습니다.

```bash
npm install next-unified-query-core
```

## Quick Start

### Basic Setup

```tsx
import { QueryClient } from 'next-unified-query';
import { QueryClientProvider } from 'next-unified-query/react';

// Create a client instance
const queryClient = new QueryClient({
  queryCache: {
    maxQueries: 1000, // Maximum cached queries
  }
});

// Wrap your app
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}
```

### Basic Query

```tsx
import { useQuery } from 'next-unified-query/react';

function UserProfile({ userId }: { userId: number }) {
  const { data, isLoading, error } = useQuery({
    cacheKey: ['user', userId],
    url: `/api/users/${userId}`,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Hello {data.name}!</div>;
}
```

## Core APIs

### createFetch

Creates a configured HTTP client instance.

```typescript
function createFetch(config?: FetchConfig): NextTypeFetch
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `FetchConfig` | Optional configuration object |

#### FetchConfig Options

```typescript
interface FetchConfig {
  baseURL?: string;              // Base URL for requests
  timeout?: number;              // Request timeout in ms
  headers?: Record<string, string>; // Default headers
  params?: Record<string, any>;  // Default query parameters
  validateStatus?: (status: number) => boolean;
}
```

#### Example

```typescript
import { createFetch } from 'next-unified-query';

const api = createFetch({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Use the instance
const response = await api.get('/users');
```

### QueryClient

The core class for managing query cache and state.

```typescript
class QueryClient {
  constructor(options?: QueryClientOptions)
  
  // Cache methods
  get<T>(key: QueryKey): QueryState<T> | undefined
  set(key: QueryKey, state: QueryState): void
  setQueryData<T>(key: QueryKey, updater: T | ((old?: T) => T)): void
  delete(key: QueryKey): void
  clear(): void
  
  // Query methods
  invalidateQueries(patterns: string[][]): void
  prefetchQuery(options: QueryOptions): Promise<void>
  
  // Utility methods
  getCache(): QueryCache
  getFetcher(): NextTypeFetch
}
```

#### Constructor Options

```typescript
interface QueryClientOptions {
  fetcher?: NextTypeFetch;       // Custom HTTP client
  queryCache?: {
    maxQueries?: number;         // Max cached queries (default: 1000)
  };
}
```

#### Methods

##### `get<T>(key: QueryKey): QueryState<T> | undefined`

Retrieves query state from cache.

```typescript
const userState = queryClient.get(['user', 123]);
console.log(userState?.data); // User data if cached
```

##### `setQueryData<T>(key: QueryKey, updater: T | ((old?: T) => T)): void`

Updates query data optimistically.

```typescript
// Direct update
queryClient.setQueryData(['user', 123], { name: 'John' });

// Update based on previous value
queryClient.setQueryData(['user', 123], (old) => ({
  ...old,
  name: 'John Updated'
}));
```

##### `invalidateQueries(patterns: string[][]): void`

Invalidates queries matching patterns.

```typescript
// Invalidate all user queries
queryClient.invalidateQueries([['user', '*']]);

// Invalidate specific queries
queryClient.invalidateQueries([
  ['user', '123'],
  ['posts', 'user', '123']
]);
```

### Query Factories

Type-safe query definition factories.

```typescript
function createQueryFactory<T extends QueryFactoryConfig>(
  config: T
): QueryFactory<T>
```

#### Example

```typescript
import { createQueryFactory, z } from 'next-unified-query';

const userQueries = createQueryFactory({
  getUser: {
    cacheKey: (id: number) => ['user', id] as const,
    url: (id: number) => `/api/users/${id}`,
    schema: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email()
    })
  },
  
  searchUsers: {
    cacheKey: (params: { q: string }) => ['users', 'search', params.q] as const,
    queryFn: async (fetcher, params) => {
      const response = await fetcher.get('/api/users/search', { params });
      return response.data;
    },
    enabled: (params) => params.q.length > 2,
    staleTime: 30 * 1000 // 30 seconds
  }
});

// Usage with full type safety
const { data } = useQuery(userQueries.getUser, { params: 123 });
// data is typed as { id: number; name: string; email: string; }
```

### Mutation Factories

Type-safe mutation definition factories.

```typescript
function createMutationFactory<T extends MutationFactoryConfig>(
  config: T
): MutationFactory<T>
```

#### Example

```typescript
import { createMutationFactory, z } from 'next-unified-query';

const userMutations = createMutationFactory({
  updateUser: {
    url: (variables: { id: number }) => `/api/users/${variables.id}`,
    method: 'PUT',
    requestSchema: z.object({
      name: z.string().min(1),
      email: z.string().email()
    }),
    responseSchema: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      updatedAt: z.string()
    })
  },
  
  deleteUser: {
    mutationFn: async (fetcher, id: number) => {
      await fetcher.delete(`/api/users/${id}`);
      return { success: true };
    }
  }
});

// Usage
const mutation = useMutation(userMutations.updateUser);
```

### Query Client Manager

QueryClient의 생성과 전역 관리를 담당하는 유틸리티 함수들입니다.

#### `setDefaultQueryClientOptions`

전역 기본 옵션을 설정하는 핵심 함수입니다. **모든 API 호출(useQuery, useMutation, 전역 함수)에 적용되는 통합 설정 관리**를 제공합니다.

```typescript
function setDefaultQueryClientOptions(
  options: QueryClientOptionsWithInterceptors
): void
```

##### Parameters

```typescript
interface QueryClientOptionsWithInterceptors extends QueryClientOptions {
  setupInterceptors?: (fetcher: NextTypeFetch) => void;
}
```

##### Key Features

🔧 **통합 설정 관리**: 한 번의 설정으로 모든 API 호출 방식에 적용
- ✅ useQuery에서 자동으로 baseURL 적용
- ✅ useMutation에서 자동으로 baseURL 적용  
- ✅ 전역 함수(post, get 등)에서도 자동으로 baseURL 적용

🚀 **자동 동기화**: QueryClient와 전역 함수 간 설정 자동 동기화
- setDefaultQueryClientOptions 호출 시 전역 fetch 인스턴스도 함께 업데이트
- 서버/클라이언트 환경 모두에서 일관된 설정 보장

##### Example

```typescript
// app/layout.tsx (서버사이드)
import { setDefaultQueryClientOptions } from 'next-unified-query';
import { setupAllInterceptors } from './interceptors';

// 🎯 모든 API 호출에 적용되는 통합 설정
setDefaultQueryClientOptions({
  baseURL: 'https://api.example.com',  // 👈 모든 상대 URL에 자동 적용
  timeout: 30000,
  queryCache: {
    maxQueries: 1000
  },
  setupInterceptors: setupAllInterceptors
});

// 이제 어디서든 상대 URL 사용 가능:
// ✅ useQuery({ url: '/users' })      → https://api.example.com/users
// ✅ useMutation({ url: '/users/1' }) → https://api.example.com/users/1  
// ✅ post('/auth/login')              → https://api.example.com/auth/login
```

```typescript
// app/client-provider.tsx (클라이언트사이드)
"use client";

import { setDefaultQueryClientOptions } from 'next-unified-query';
import { setupAllInterceptors } from './interceptors';

// 클라이언트에서도 동일한 설정 적용 (필수)
setDefaultQueryClientOptions({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  queryCache: {
    maxQueries: 1000
  },
  setupInterceptors: setupAllInterceptors
});

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider>{children}</QueryClientProvider>;
}
```

#### `getQueryClient`

환경에 맞는 QueryClient를 자동으로 반환합니다.

```typescript
function getQueryClient(
  options?: QueryClientOptionsWithInterceptors
): QueryClient
```

**동작 방식:**
- **서버 환경**: 항상 새로운 인스턴스 생성 (요청 격리)
- **클라이언트 환경**: 싱글톤 패턴 사용 (상태 유지)

##### Example

```typescript
// 기본 설정 사용
const queryClient = getQueryClient();

// 추가 옵션과 함께 사용
const queryClient = getQueryClient({
  timeout: 5000 // 기본 설정에 추가/덮어쓰기
});
```

#### `createQueryClientWithInterceptors`

인터셉터 설정을 포함한 QueryClient를 직접 생성합니다.

```typescript
function createQueryClientWithInterceptors(
  options: QueryClientOptions,
  setupInterceptors: (fetcher: NextTypeFetch) => void
): QueryClient
```

##### Example

```typescript
const queryClient = createQueryClientWithInterceptors({
  baseURL: 'https://api.example.com'
}, (fetcher) => {
  fetcher.interceptors.request.use((config) => {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${getToken()}`
    };
    return config;
  });
});
```

#### `resetQueryClient`

클라이언트 환경에서 전역 QueryClient를 재설정합니다. 주로 테스트에서 사용됩니다.

```typescript
function resetQueryClient(): void
```

### Interceptors

Request/response/error interceptors for cross-cutting concerns.

```typescript
interface Interceptors {
  request: InterceptorManager<RequestInterceptor>;
  response: InterceptorManager<ResponseInterceptor>;
  error: InterceptorManager<ErrorInterceptor>;
}
```

#### InterceptorManager API

```typescript
interface InterceptorHandle {
  remove: () => void;
}

class InterceptorManager<T> {
  // 인터셉터 등록 - InterceptorHandle 반환
  use(handler: T, options?: InterceptorOptions): InterceptorHandle;
  
  // ID로 제거
  eject(id: number): void;
  
  // 타입별 모든 인터셉터 제거
  ejectByType(type: symbol): void;
  
  // 모든 인터셉터 제거
  clear(): void;
  
  // 디버깅: 등록된 인터셉터 목록
  getRegisteredInterceptors(): Array<{ id: number; tag: string; type: string }>;
}
```

#### Basic Usage

```typescript
const api = createFetch();

// Request interceptor - handle 반환
const requestHandle = api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${token}`
  };
  return config;
});

// Response interceptor
const responseHandle = api.interceptors.response.use(async (response) => {
  console.log(`${response.config.method} ${response.config.url}`, response.status);
  return response;
});

// Error interceptor
const errorHandle = api.interceptors.error.use(async (error, config, fetcher) => {
  if (error.status === 401) {
    await refreshAuthToken();
    return fetcher.request(config);
  }
  throw error;
});

// 인터셉터 제거 방법들
requestHandle.remove();    // 개별 제거
responseHandle.remove();   
errorHandle.remove();

// 또는 모든 인터셉터 제거
api.interceptors.request.clear();
api.interceptors.response.clear();
api.interceptors.error.clear();
```

## Next.js SSR/CSR Configuration

Next.js에서는 서버와 클라이언트가 완전히 분리된 환경이므로, **양쪽 모두에서 설정이 필요**합니다.

### Why Both Server and Client Configuration?

- **서버 설정** (`layout.tsx`): SSR, API Routes에서 사용
- **클라이언트 설정** (`client-provider.tsx`): 브라우저에서 사용하는 hooks

**하나만 설정하면 한쪽 환경에서는 기본값으로 동작**하므로 두 곳 모두 설정해야 합니다.

#### Server Configuration (app/layout.tsx)

```tsx
// app/layout.tsx
import { setDefaultQueryClientOptions } from 'next-unified-query';
import { ClientProvider } from './client-provider';
import { setupAllInterceptors } from './interceptors';

// 서버에서 사용할 설정
setDefaultQueryClientOptions({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  queryCache: {
    maxQueries: 1000,
  },
  setupInterceptors: setupAllInterceptors,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
```

#### Client Configuration (app/client-provider.tsx)

```tsx
// app/client-provider.tsx
"use client";

import { setDefaultQueryClientOptions } from 'next-unified-query';
import { QueryClientProvider } from 'next-unified-query/react';
import { setupAllInterceptors } from './interceptors';

// 클라이언트에서 사용할 설정 (서버와 동일하게)
setDefaultQueryClientOptions({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  queryCache: {
    maxQueries: 1000,
  },
  setupInterceptors: setupAllInterceptors,
});

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider>{children}</QueryClientProvider>;
}
```

### Shared Configuration Pattern

공통 설정을 별도 파일로 분리하여 DRY 원칙을 지킬 수 있습니다:

```typescript
// lib/query-config.ts
import type { QueryClientOptionsWithInterceptors } from 'next-unified-query';
import { setupAllInterceptors } from './interceptors';

export const commonQueryConfig: QueryClientOptionsWithInterceptors = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  queryCache: {
    maxQueries: 1000,
  },
  setupInterceptors: setupAllInterceptors,
};
```

```tsx
// app/layout.tsx
import { setDefaultQueryClientOptions } from 'next-unified-query';
import { commonQueryConfig } from '@/lib/query-config';
import { ClientProvider } from './client-provider';

setDefaultQueryClientOptions(commonQueryConfig);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/client-provider.tsx
"use client";

import { setDefaultQueryClientOptions } from 'next-unified-query';
import { QueryClientProvider } from 'next-unified-query/react';
import { commonQueryConfig } from '@/lib/query-config';

setDefaultQueryClientOptions(commonQueryConfig);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider>{children}</QueryClientProvider>;
}
```

## React Hooks

### useQuery

React hook for data fetching with caching.

```typescript
function useQuery<T, E = FetchError>(
  options: UseQueryOptions<T> | QueryConfig,
  hookOptions?: UseQueryHookOptions
): QueryObserverResult<T, E>
```

#### Options

```typescript
interface UseQueryOptions<T> {
  // Required
  cacheKey: readonly unknown[];
  url: string | ((params?: any) => string);
  
  // Optional
  queryFn?: (fetcher: QueryFetcher) => Promise<T>;
  params?: Record<string, any>;
  schema?: ZodType;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  placeholderData?: T | ((prev?: T) => T);
  select?: (data: T) => any;
  fetchConfig?: RequestConfig;
}
```

#### Return Value

```typescript
interface QueryObserverResult<T, E> {
  data: T | undefined;
  error: E | null;
  isLoading: boolean;      // true on first load
  isFetching: boolean;     // true during any fetch
  isError: boolean;
  isSuccess: boolean;
  isStale: boolean;
  isPlaceholderData: boolean;
  refetch: () => void;
}
```

#### Examples

##### Basic Query

```tsx
function UserList() {
  const { data, isLoading } = useQuery({
    cacheKey: ['users'],
    url: '/api/users'
  });

  if (isLoading) return <div>Loading...</div>;
  
  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

##### Query with Parameters

```tsx
function UserDetail({ userId }: { userId: number }) {
  const { data } = useQuery({
    cacheKey: ['user', userId],
    url: `/api/users/${userId}`,
    enabled: userId > 0, // Only fetch if valid ID
    staleTime: 5 * 60 * 1000 // Consider fresh for 5 minutes
  });

  return <div>{data?.name}</div>;
}
```

##### Query with Transform

```tsx
function UserStats() {
  const { data } = useQuery({
    cacheKey: ['users'],
    url: '/api/users',
    select: (users) => ({
      total: users.length,
      active: users.filter(u => u.isActive).length
    })
  });

  return <div>Total users: {data?.total}</div>;
}
```

##### Query with Custom Function

```tsx
function ComplexQuery() {
  const { data } = useQuery({
    cacheKey: ['complex-data'],
    queryFn: async (fetcher) => {
      // Multiple requests
      const [users, posts] = await Promise.all([
        fetcher.get('/api/users'),
        fetcher.get('/api/posts')
      ]);
      
      return {
        users: users.data,
        posts: posts.data
      };
    }
  });

  return <div>Users: {data?.users.length}</div>;
}
```

### useMutation

React hook for data mutations with **automatic baseURL application** and **type-safe HTTP methods**.

```typescript
function useMutation<TData, TError, TVariables, TContext>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext>
```

#### Key Features

🎯 **Automatic baseURL Application**: 
- `setDefaultQueryClientOptions`에서 설정한 baseURL이 자동으로 적용됩니다
- 상대 URL 사용 권장으로 환경별 설정 관리가 쉬워집니다

🛡️ **Type-Safe HTTP Methods**:
- POST, PUT, DELETE, PATCH, HEAD, OPTIONS 메서드만 허용
- GET 메서드는 useQuery에서만 사용 (명확한 역할 분리)

#### Options

```typescript
interface UseMutationOptions<TData, TError, TVariables, TContext> {
  // Required
  mutationFn?: (variables: TVariables) => Promise<TData>;
  url?: string | ((variables: TVariables) => string);
  method?: HttpMethod;
  
  // Optional callbacks
  onMutate?: (variables: TVariables) => Promise<TContext | void> | TContext | void;
  onSuccess?: (data: TData, variables: TVariables, context?: TContext) => void;
  onError?: (error: TError, variables: TVariables, context?: TContext) => void;
  onSettled?: (data?: TData, error?: TError, variables?: TVariables, context?: TContext) => void;
  
  // Schema validation
  requestSchema?: ZodType;
  responseSchema?: ZodType;
  
  // Cache invalidation
  invalidateQueries?: string[][] | ((data: TData, variables: TVariables) => string[][]);
}
```

#### Return Value

```typescript
interface UseMutationResult<TData, TError, TVariables> {
  data: TData | undefined;
  error: TError | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}
```

#### Examples

##### Basic Mutation (with Automatic baseURL)

```tsx
function UpdateUser({ userId }: { userId: number }) {
  const mutation = useMutation({
    url: `/users/${userId}`,  // ✅ 상대 URL 사용 (baseURL 자동 적용)
    method: 'PUT',
    onSuccess: () => {
      alert('User updated!');
    }
  });

  const handleSubmit = (data: UserData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

##### Dynamic URL with Variables

```tsx
function DeleteUser() {
  const mutation = useMutation({
    url: (variables: { userId: number }) => `/users/${variables.userId}`,
    method: 'DELETE',
    onSuccess: () => {
      alert('User deleted!');
    }
  });

  return (
    <button onClick={() => mutation.mutate({ userId: 123 })}>
      Delete User
    </button>
  );
}
```

##### Optimistic Updates

```tsx
function TodoItem({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();
  
  const toggleMutation = useMutation({
    url: `/api/todos/${todo.id}`,
    method: 'PATCH',
    onMutate: async (newTodo) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries(['todos']);
      
      // Snapshot previous value
      const previousTodos = queryClient.get(['todos']);
      
      // Optimistically update
      queryClient.setQueryData(['todos'], (old) =>
        old?.map(t => t.id === todo.id ? { ...t, ...newTodo } : t)
      );
      
      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      queryClient.setQueryData(['todos'], context.previousTodos);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries([['todos']]);
    }
  });

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => toggleMutation.mutate({ completed: e.target.checked })}
      />
      {todo.title}
    </div>
  );
}
```

### QueryClientProvider

Context provider for QueryClient.

```typescript
interface QueryClientProviderProps {
  client: QueryClient;
  children: React.ReactNode;
}
```

#### Example

```tsx
import { QueryClient } from 'next-unified-query';
import { QueryClientProvider } from 'next-unified-query/react';

const queryClient = new QueryClient({
  queryCache: {
    maxQueries: 500
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
```

### useQueryClient

Hook to access the QueryClient instance.

```typescript
function useQueryClient(): QueryClient
```

#### Example

```tsx
import { useQueryClient } from 'next-unified-query/react';

function ClearCacheButton() {
  const queryClient = useQueryClient();
  
  const handleClear = () => {
    queryClient.clear();
    alert('Cache cleared!');
  };
  
  return <button onClick={handleClear}>Clear Cache</button>;
}
```

## Type Definitions

### Core Types

```typescript
// Query key can be string or array
type QueryKey = string | readonly unknown[];

// Query state in cache
interface QueryState<T = unknown> {
  data?: T;
  error?: unknown;
  isLoading: boolean;
  isFetching: boolean;
  updatedAt: number;
}

// HTTP methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// Fetch configuration
interface FetchConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  validateStatus?: (status: number) => boolean;
}

// Request configuration
interface RequestConfig extends FetchConfig {
  url?: string;
  method?: HttpMethod;
  data?: any;
  signal?: AbortSignal;
}
```

### Error Types

```typescript
// Base error class
class FetchError<T = unknown> extends Error {
  name: 'FetchError';
  code: ErrorCode;
  config: RequestConfig;
  request?: Request;
  response?: Response;
  data?: T;
  status?: number;
}

// Error codes
enum ErrorCode {
  ERR_NETWORK = 'ERR_NETWORK',
  ERR_TIMEOUT = 'ERR_TIMEOUT',
  ERR_ABORTED = 'ERR_ABORTED',
  ERR_BAD_REQUEST = 'ERR_BAD_REQUEST',
  ERR_INVALID_RESPONSE = 'ERR_INVALID_RESPONSE',
  ERR_VALIDATION = 'ERR_VALIDATION'
}
```

## Error Handling Utilities

라이브러리는 포괄적인 에러 처리 유틸리티를 제공합니다.

### Error Type Guards

```typescript
import { 
  isFetchError, 
  isValidationError, 
  hasErrorCode,
  getValidationErrors 
} from 'next-unified-query';

// FetchError 타입 가드
if (isFetchError(error)) {
  console.log(error.status); // HTTP 상태 코드
  console.log(error.config); // 요청 설정
  console.log(error.data);   // 에러 데이터
}

// 검증 에러 확인
if (isValidationError(error)) {
  const validationErrors = getValidationErrors(error);
  validationErrors.forEach(({ path, message }) => {
    console.log(`${path}: ${message}`);
  });
}

// 특정 에러 코드 확인
if (hasErrorCode(error, 'ERR_NETWORK')) {
  console.log('네트워크 연결 오류');
}
```

### Error Handlers

```typescript
import { 
  handleFetchError, 
  handleHttpError,
  ErrorCode 
} from 'next-unified-query';

// 에러 코드별 핸들링
try {
  const response = await api.get('/api/data');
} catch (error) {
  const result = handleFetchError(error, {
    [ErrorCode.NETWORK]: () => '네트워크 연결을 확인해주세요',
    [ErrorCode.TIMEOUT]: () => '요청 시간이 초과되었습니다',
    [ErrorCode.VALIDATION]: (error) => {
      const errors = getValidationErrors(error);
      return `검증 오류: ${errors.map(e => e.message).join(', ')}`;
    },
    default: (error) => `알 수 없는 오류: ${error.message}`
  });
  
  console.log(result);
}

// HTTP 상태 코드별 핸들링
try {
  const response = await api.get('/api/data');
} catch (error) {
  const result = handleHttpError(error, {
    401: () => '로그인이 필요합니다',
    403: () => '권한이 없습니다',
    404: () => '데이터를 찾을 수 없습니다',
    500: () => '서버 오류가 발생했습니다',
    default: (error) => `HTTP 오류 ${error.status}: ${error.message}`
  });
  
  alert(result);
}
```

## Response Utilities

응답 객체를 다루기 위한 유틸리티 함수들입니다.

```typescript
import { 
  unwrap, 
  getStatus, 
  getHeaders, 
  hasStatus 
} from 'next-unified-query';

const response = await api.get('/api/users');

// 데이터 추출
const users = unwrap(response);  // response.data와 동일

// 상태 코드 확인
const status = getStatus(response);  // 200
if (hasStatus(response, 200)) {
  console.log('성공!');
}

// 헤더 접근
const headers = getHeaders(response);
const contentType = headers.get('content-type');
```

## SSR Support

### ssrPrefetch

SSR에서 여러 쿼리를 미리 패칭합니다.

```typescript
function ssrPrefetch(
  queries: Array<QueryItem>,
  globalFetchConfig?: Record<string, any>,
  client?: QueryClient
): Promise<Record<string, any>>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `queries` | `Array<QueryItem>` | 프리패치할 쿼리 배열 |
| `globalFetchConfig` | `Record<string, any>` | 모든 쿼리에 적용할 공통 설정 |
| `client` | `QueryClient` | 선택적 QueryClient (인터셉터 사용 시) |

#### QueryItem Type

```typescript
type QueryItem = 
  | [QueryConfig<any, any>]           // 파라미터가 없는 경우
  | [QueryConfig<any, any>, any];     // 파라미터가 있는 경우
```

#### Examples

##### Basic SSR Prefetch

```typescript
import { ssrPrefetch } from 'next-unified-query';
import { userQueries, postQueries } from '@/queries';

// Next.js App Router
export async function generateStaticProps() {
  const dehydratedState = await ssrPrefetch([
    [userQueries.list],                    // 파라미터 없음
    [userQueries.get, { id: 1 }],         // 파라미터 있음
    [postQueries.list, { userId: 1 }]
  ]);
  
  return {
    props: {
      dehydratedState
    }
  };
}
```

##### With Custom Configuration

```typescript
// 글로벌 설정과 함께
const dehydratedState = await ssrPrefetch(
  [
    [userQueries.get, { id: 1 }],
    [postQueries.list, { userId: 1 }]
  ],
  {
    baseURL: 'https://api.example.com',
    timeout: 10000
  }
);
```

##### With Interceptors

```typescript
// 인터셉터가 설정된 QueryClient와 함께
const queryClient = new QueryClient();
queryClient.getFetcher().interceptors.request.use(async (config) => {
  const token = await getServerAuthToken();
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${token}`
  };
  return config;
});

const dehydratedState = await ssrPrefetch(
  [
    [userQueries.get, { id: 1 }],
    [postQueries.list, { userId: 1 }]
  ],
  {},
  queryClient
);
```

### HydrationBoundary

SSR에서 프리패치된 데이터를 클라이언트로 전달합니다.

```typescript
interface HydrationBoundaryProps {
  state?: Record<string, QueryState>;
  children: React.ReactNode;
}
```

#### Example

```tsx
import { HydrationBoundary } from 'next-unified-query/react';

function UserPage({ dehydratedState }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <UserDetail />
    </HydrationBoundary>
  );
}

function UserDetail() {
  // 프리패치된 데이터를 즉시 사용
  const { data } = useQuery(userQueries.get, { params: { id: 1 } });
  
  return <div>{data?.name}</div>;
}
```

## Global Functions Integration

라이브러리의 전역 함수들은 `setDefaultQueryClientOptions`에서 설정한 `baseURL`과 기타 옵션들을 자동으로 사용합니다.

### Available Global Functions

```typescript
import { get, post, put, delete, patch, head, options } from 'next-unified-query';
```

### Key Features

- **자동 baseURL 적용**: `setDefaultQueryClientOptions`에서 설정한 `baseURL`이 모든 전역 함수에 자동 적용
- **통합 인터셉터**: QueryClient의 인터셉터가 전역 함수에도 동일하게 적용
- **통일된 설정**: 모든 요청이 동일한 기본 설정을 공유

### Examples

#### Basic Global Function Usage

```typescript
import { post, get, setDefaultQueryClientOptions } from 'next-unified-query';

// 전역 설정
setDefaultQueryClientOptions({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 이제 모든 전역 함수가 baseURL을 자동으로 사용
async function createUser(userData: any) {
  const response = await post('/users', userData);  // ✅ https://api.example.com/users로 요청
  return response.data;
}

async function fetchUser(id: number) {
  const response = await get(`/users/${id}`);  // ✅ https://api.example.com/users/1로 요청
  return response.data;
}
```

#### Advanced Configuration

```typescript
import { 
  setDefaultQueryClientOptions, 
  createFetch,
  post, 
  get 
} from 'next-unified-query';

// 복잡한 전역 설정
setDefaultQueryClientOptions({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  retry: {
    limit: 3,
    backoff: 'exponential'
  },
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '1.0.0'
  },
  interceptors: [
    {
      request: async (config) => {
        const token = await getAuthToken();
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
        return config;
      }
    }
  ]
});

// 모든 전역 함수가 위 설정을 자동으로 사용
export const api = {
  // 사용자 관련 API
  users: {
    list: () => get('/users'),                    // 🔄 자동 baseURL + 인터셉터
    get: (id: number) => get(`/users/${id}`),     // 🔄 자동 baseURL + 인터셉터
    create: (data: any) => post('/users', data),  // 🔄 자동 baseURL + 인터셉터
    update: (id: number, data: any) => post(`/users/${id}`, data)
  },
  
  // 인증 관련 API
  auth: {
    login: (credentials: any) => post('/auth/login', credentials),
    refresh: () => post('/auth/refresh'),         // 🔄 baseURL 자동 적용됨
    logout: () => post('/auth/logout')
  }
};
```

#### Per-Request Override

전역 설정을 개별 요청에서 재정의할 수 있습니다:

```typescript
import { post } from 'next-unified-query';

// 전역 baseURL: https://api.example.com
setDefaultQueryClientOptions({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

// 특정 요청에서만 다른 설정 사용
const response = await post('/upload', formData, {
  baseURL: 'https://upload.example.com',  // 🔄 이 요청만 다른 baseURL 사용
  timeout: 30000,                        // 🔄 이 요청만 다른 timeout 사용
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

### HTTP Method Restrictions

전역 함수들은 각각의 의도된 HTTP 메서드만 사용합니다:

```typescript
// ✅ 허용되는 사용법
await get('/users');           // GET 요청
await post('/users', data);    // POST 요청  
await put('/users/1', data);   // PUT 요청
await delete('/users/1');      // DELETE 요청
await patch('/users/1', data); // PATCH 요청
await head('/users');          // HEAD 요청
await options('/users');       // OPTIONS 요청

// ❌ 메서드별로 제한됨 - TypeScript 컴파일 오류
await get('/users', data);     // GET은 data parameter 없음
```

### Integration with React Hooks

전역 함수와 React 훅들이 동일한 설정을 공유합니다:

```typescript
// app/layout.tsx
setDefaultQueryClientOptions({
  baseURL: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' }
});

// React 컴포넌트에서 훅 사용
function UserProfile() {
  const { data } = useQuery({
    cacheKey: ['user', userId],
    url: `/users/${userId}`  // ✅ baseURL 자동 적용
  });
  
  const mutation = useMutation({
    url: '/users',           // ✅ baseURL 자동 적용
    method: 'POST'
  });
}

// 동일한 컴포넌트에서 전역 함수 사용
async function handleDirectApiCall() {
  const response = await post('/users', userData);  // ✅ 동일한 baseURL + 헤더 적용
  return response.data;
}
```

### Type Safety

전역 함수들도 완전한 타입 안전성을 제공합니다:

```typescript
import { post, get } from 'next-unified-query';
import { z } from 'zod';

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

// 타입 안전한 API 호출
async function createUser(userData: z.input<typeof userSchema>) {
  const response = await post<z.output<typeof userSchema>>('/users', userData, {
    schema: userSchema  // 응답 검증
  });
  
  return response.data;  // 타입: { id: number; name: string; email: string; }
}
```

## Constants and Enums

### ContentType

요청 Content-Type 설정을 위한 상수입니다.

```typescript
enum ContentType {
  JSON = "application/json",
  FORM = "application/x-www-form-urlencoded",
  TEXT = "text/plain",
  BLOB = "application/octet-stream",
  MULTIPART = "multipart/form-data",
  XML = "application/xml",
  HTML = "text/html"
}
```

#### Example

```typescript
import { ContentType } from 'next-unified-query';

const { data } = useMutation({
  url: '/api/upload',
  method: 'POST',
  fetchConfig: {
    headers: {
      'Content-Type': ContentType.MULTIPART
    }
  }
});
```

### ResponseType

응답 타입 설정을 위한 상수입니다.

```typescript
enum ResponseType {
  JSON = "json",
  TEXT = "text",
  BLOB = "blob",
  ARRAY_BUFFER = "arraybuffer",
  RAW = "raw"
}
```

#### Example

```typescript
import { ResponseType } from 'next-unified-query';

const { data } = useQuery({
  cacheKey: ['file', fileId],
  url: `/api/files/${fileId}`,
  fetchConfig: {
    responseType: ResponseType.BLOB
  }
});
```

## Advanced Error Utilities

### getValidationErrors

Zod 스키마 검증 오류에서 상세한 오류 정보를 추출합니다.

```typescript
function getValidationErrors(error: FetchError): Array<{
  path: string;
  message: string;
}>
```

#### Example

```typescript
import { getValidationErrors } from 'next-unified-query';

const { error } = useMutation({
  url: '/api/users',
  method: 'POST',
  requestSchema: z.object({
    name: z.string().min(1),
    email: z.string().email()
  })
});

if (error) {
  const validationErrors = getValidationErrors(error);
  validationErrors.forEach(({ path, message }) => {
    console.log(`${path}: ${message}`);
  });
}
```

### hasErrorCode

특정 오류 코드를 가진 오류인지 확인합니다.

```typescript
function hasErrorCode(error: unknown, code: string): boolean
```

#### Example

```typescript
import { hasErrorCode, ErrorCode } from 'next-unified-query';

const { error } = useQuery({
  cacheKey: ['user', userId],
  url: `/api/users/${userId}`
});

if (hasErrorCode(error, ErrorCode.NETWORK)) {
  // 네트워크 오류 처리
} else if (hasErrorCode(error, ErrorCode.TIMEOUT)) {
  // 타임아웃 오류 처리
}
```

### errorToResponse

오류를 NextTypeResponse 형태로 변환합니다.

```typescript
function errorToResponse<T>(error: FetchError, data: T): NextTypeResponse<T>
```

#### Example

```typescript
import { errorToResponse } from 'next-unified-query';

try {
  const response = await api.get('/api/users');
  return response;
} catch (error) {
  // 오류를 표준 응답 형태로 변환
  return errorToResponse(error, null);
}
```

## HTTP Method Restrictions

라이브러리는 타입 안전성과 의도적 사용을 위해 HTTP 메서드 제한을 구현하고 있습니다.

### useQuery: Read-Only Operations

`useQuery`는 데이터 조회만을 위한 훅으로, GET과 HEAD 메서드만 허용합니다.

```typescript
// ✅ 허용되는 useQuery 사용법
const { data } = useQuery({
  cacheKey: ['users'],
  url: '/api/users'  // 기본적으로 GET 메서드 사용
});

const { data } = useQuery({
  cacheKey: ['user-meta', userId],
  queryFn: async (_, fetcher) => {
    return await fetcher.head(`/api/users/${userId}`);  // HEAD 메서드 허용
  }
});
```

#### QueryFetcher Interface

Factory Pattern의 Custom Function에서 받는 `fetcher`는 `QueryFetcher` 타입입니다:

```typescript
interface QueryFetcher {
  get: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
  head: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
  request: <T = unknown>(
    config: Omit<RequestConfig, 'method'> & { method?: 'GET' | 'HEAD' }
  ) => CancelablePromise<NextTypeResponse<T>>;
}
```

### useMutation: Data Modification Operations

`useMutation`은 데이터 변경을 위한 훅으로, GET을 제외한 모든 HTTP 메서드를 허용합니다.

```typescript
// ✅ 허용되는 useMutation 사용법
const createMutation = useMutation({
  url: '/api/users',
  method: 'POST'  // POST, PUT, DELETE, PATCH, HEAD, OPTIONS 허용
});

const updateMutation = useMutation({
  url: ({ id }: { id: number }) => `/api/users/${id}`,
  method: 'PUT'
});

const deleteMutation = useMutation({
  url: (id: number) => `/api/users/${id}`,
  method: 'DELETE'
});

// Custom Function 방식도 모든 메서드 지원
const complexMutation = useMutation({
  mutationFn: async (data, fetcher) => {
    // fetcher는 NextTypeFetch 타입 (모든 메서드 지원)
    return await fetcher.patch('/api/users/bulk', data);
  }
});
```

#### NextTypeFetch Interface

Mutation에서 받는 `fetcher`는 `NextTypeFetch` 타입입니다:

```typescript
interface NextTypeFetch {
  get: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
  post: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
  put: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
  delete: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
  patch: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
  head: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
  options: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
  request: <T = unknown>(config: RequestConfig) => CancelablePromise<NextTypeResponse<T>>;
}
```

### Global Functions: Method-Specific

전역 함수들은 각각 특정 HTTP 메서드만 지원합니다:

```typescript
import { get, post, put, delete, patch, head, options } from 'next-unified-query';

// ✅ 올바른 사용법 - 각 함수는 고유한 메서드만 사용
await get('/api/users');                    // GET
await post('/api/users', userData);         // POST
await put('/api/users/1', updateData);      // PUT
await delete('/api/users/1');               // DELETE
await patch('/api/users/1', patchData);     // PATCH
await head('/api/users');                   // HEAD
await options('/api/users');                // OPTIONS

// ❌ TypeScript 컴파일 오류 - 메서드별 시그니처가 다름
await get('/api/users', userData);          // GET은 data 파라미터 없음
await post('/api/users');                   // POST는 data 파라미터 필요 (optional이지만)
```

### Type Safety Benefits

이러한 제한은 다음과 같은 이점을 제공합니다:

#### 1. 의도 명확화

```typescript
// ✅ 의도가 명확함
const { data } = useQuery({           // "데이터를 조회한다"
  cacheKey: ['users'],
  url: '/api/users'
});

const mutation = useMutation({        // "데이터를 변경한다"
  url: '/api/users',
  method: 'POST'
});
```

#### 2. 실수 방지

```typescript
// ❌ 컴파일 타임에 오류 발생
const { data } = useQuery({
  cacheKey: ['users'],
  url: '/api/users',
  method: 'POST'  // 컴파일 오류: useQuery는 POST 지원 안함
});
```

#### 3. 캐싱 최적화

```typescript
// useQuery는 GET/HEAD 요청만 받으므로 안전하게 캐싱 가능
// useMutation은 데이터 변경 요청이므로 캐싱하지 않음
```

### Migration from Unrestricted Libraries

다른 라이브러리에서 마이그레이션할 때:

```typescript
// 다른 라이브러리 (제한 없음)
const result = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users', { method: 'POST' })  // 🤔 혼란스러운 패턴
});

// Next Unified Query (명확한 분리)
const { data } = useQuery({        // GET만 허용
  cacheKey: ['users'],
  url: '/api/users'
});

const mutation = useMutation({     // POST/PUT/DELETE 등 허용
  url: '/api/users',
  method: 'POST'
});
```

### Custom Functions with Method Restrictions

Factory Pattern에서도 타입 제한이 적용됩니다:

```typescript
const userQueries = createQueryFactory({
  list: {
    cacheKey: () => ['users'] as const,
    queryFn: async (_, fetcher: QueryFetcher) => {
      // ✅ GET, HEAD만 사용 가능
      return await fetcher.get('/api/users');
      // ❌ fetcher.post는 존재하지 않음 (TypeScript 오류)
    }
  }
});

const userMutations = createMutationFactory({
  create: {
    mutationFn: async (data, fetcher: NextTypeFetch) => {
      // ✅ 모든 메서드 사용 가능
      return await fetcher.post('/api/users', data);
    }
  }
});
```

## Examples

### Complete CRUD Application

```tsx
import { 
  createQueryFactory, 
  createMutationFactory,
  QueryClient,
  z
} from 'next-unified-query';

import {
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient
} from 'next-unified-query/react';

// Define schemas
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user'])
});

const createUserSchema = userSchema.omit({ id: true });

// Create query factory
const userQueries = createQueryFactory({
  list: {
    cacheKey: () => ['users'] as const,
    url: () => '/api/users'
  },
  get: {
    cacheKey: (id: number) => ['users', id] as const,
    url: (id: number) => `/api/users/${id}`,
    schema: userSchema
  }
});

// Create mutation factory
const userMutations = createMutationFactory({
  create: {
    url: () => '/api/users',
    method: 'POST',
    requestSchema: createUserSchema,
    responseSchema: userSchema
  },
  update: {
    url: ({ id }: { id: number }) => `/api/users/${id}`,
    method: 'PUT',
    requestSchema: userSchema,
    responseSchema: userSchema
  },
  delete: {
    url: (id: number) => `/api/users/${id}`,
    method: 'DELETE'
  }
});

// User list component
function UserList() {
  const { data: users, isLoading } = useQuery(userQueries.list);
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    ...userMutations.delete,
    onSuccess: (_, userId) => {
      // Remove from list
      queryClient.setQueryData(['users'], (old) =>
        old?.filter(u => u.id !== userId)
      );
      // Invalidate individual query
      queryClient.invalidateQueries([['users', userId]]);
    }
  });

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users?.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
            <button 
              onClick={() => deleteMutation.mutate(user.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Create user form
function CreateUserForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as const
  });
  
  const createMutation = useMutation({
    ...userMutations.create,
    onSuccess: (newUser) => {
      // Add to list
      queryClient.setQueryData(['users'], (old = []) => [...old, newUser]);
      // Reset form
      setFormData({ name: '', email: '', role: 'user' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
        placeholder="Name"
        required
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
        placeholder="Email"
        required
      />
      <select
        value={formData.role}
        onChange={(e) => setFormData(d => ({ ...d, role: e.target.value as any }))}
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create User'}
      </button>
      {createMutation.error && (
        <div>Error: {createMutation.error.message}</div>
      )}
    </form>
  );
}

// App component
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <h1>User Management</h1>
        <CreateUserForm />
        <UserList />
      </div>
    </QueryClientProvider>
  );
}
```

### Authentication with Interceptors

```typescript
import { createFetch, createQueryClientWithInterceptors } from 'next-unified-query';

// Create authenticated client
const queryClient = createQueryClientWithInterceptors((fetcher) => {
  // Add auth interceptor
  fetcher.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }
    return config;
  });

  // Handle auth errors
  fetcher.interceptors.error.use(async (error, config, fetcher) => {
    if (error.status === 401 && !config._retry) {
      config._retry = true;
      
      // Try to refresh token
      try {
        const { data } = await fetcher.post('/api/auth/refresh');
        localStorage.setItem('authToken', data.token);
        
        // Retry original request
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${data.token}`
        };
        return fetcher.request(config);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        throw refreshError;
      }
    }
    
    throw error;
  });
});

// Use in your app
import { QueryClientProvider } from 'next-unified-query/react';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticatedApp />
    </QueryClientProvider>
  );
}
```

### Server-Side Rendering (SSR)

```tsx
// pages/users/[id].tsx (Next.js example)
import { QueryClient, ssrPrefetch } from 'next-unified-query';
import { HydrationBoundary } from 'next-unified-query/react';
import { userQueries } from '@/queries/users';

export async function getServerSideProps({ params }) {
  const queryClient = new QueryClient();
  
  // Prefetch on server
  const dehydratedState = await ssrPrefetch([
    {
      ...userQueries.get,
      params: Number(params.id)
    }
  ]);
  
  return {
    props: {
      dehydratedState,
      userId: Number(params.id)
    }
  };
}

function UserPage({ dehydratedState, userId }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <UserDetail userId={userId} />
    </HydrationBoundary>
  );
}

function UserDetail({ userId }) {
  // This will use prefetched data on first render
  const { data } = useQuery(userQueries.get, { params: userId });
  
  return <div>{data?.name}</div>;
}
```

### Infinite Queries

```tsx
function InfiniteUserList() {
  const [pages, setPages] = useState([0]);
  const queryClient = useQueryClient();
  
  // Query for each page
  const queries = pages.map(page => 
    useQuery({
      cacheKey: ['users', 'page', page],
      url: `/api/users?page=${page}&limit=20`,
      placeholderData: (prev) => prev // Keep previous data while loading
    })
  );
  
  const allUsers = queries.flatMap(q => q.data?.users || []);
  const hasMore = queries[queries.length - 1]?.data?.hasMore;
  const isLoadingMore = queries[queries.length - 1]?.isFetching;
  
  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setPages(prev => [...prev, prev.length]);
    }
  };
  
  return (
    <div>
      {allUsers.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Migration Guide

### From TanStack Query

```typescript
// TanStack Query
const { data } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000
});

// Next Unified Query
const { data } = useQuery({
  cacheKey: ['users', userId],
  url: `/api/users/${userId}`,
  staleTime: 5 * 60 * 1000
});
```

### From SWR

```typescript
// SWR
const { data, error, mutate } = useSWR(
  `/api/users/${userId}`,
  fetcher
);

// Next Unified Query
const { data, error, refetch } = useQuery({
  cacheKey: ['users', userId],
  url: `/api/users/${userId}`
});
```

### From Axios

```typescript
// Axios
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000
});

api.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Next Unified Query
const api = createFetch({
  baseURL: 'https://api.example.com',
  timeout: 10000
});

api.interceptors.request.use(async config => {
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${token}`
  };
  return config;
});
```

## Best Practices

1. **Use Query Factories** for type safety and consistency
2. **Set appropriate staleTime** to reduce unnecessary requests
3. **Implement error boundaries** for better error handling
4. **Use placeholderData** for better UX during navigation
5. **Leverage optimistic updates** for instant feedback
6. **Configure gcTime** based on your app's needs
7. **Use select** to minimize re-renders
8. **Prefetch critical data** for better performance

## Support

- GitHub Issues: [https://github.com/newExpand/next-unified-query/issues](https://github.com/newExpand/next-unified-query/issues)
- Documentation: [https://next-unified-query.dev](https://next-unified-query.dev)

---

## Generated Documentation

Generated with Next Unified Query v0.1.0
