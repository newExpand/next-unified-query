# Next Unified Query API Documentation

> A comprehensive API reference for next-unified-query - a high-performance HTTP client and state management library for React applications.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Available Packages](#available-packages)
- [Core APIs](#core-apis)
  - [createFetch](#createfetch)
  - [configureQueryClient](#configurequeryclient)
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

Users only need to install the React package. The Core package is automatically included.

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
Main package that includes both React hooks and core functionality.

```typescript
// All core features (server-safe)
import { 
  QueryClient, 
  createFetch, 
  createQueryFactory,
  createMutationFactory 
} from 'next-unified-query';

// React-specific features (client-only)
import { 
  useQuery, 
  useMutation,
  QueryClientProvider 
} from 'next-unified-query/react';
```

### `next-unified-query-core` (Optional)
If you only need core functionality, you can install it directly. Generally not needed.

```bash
npm install next-unified-query-core
```

## Quick Start

### Basic Setup (Recommended - Single Configuration)

```tsx
// app/providers.tsx (Client Component)
'use client';
import { QueryClientProvider } from 'next-unified-query/react';

export function Providers({ children }) {
  return (
    <QueryClientProvider 
      config={{
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        headers: { 'X-App': 'MyApp' },
        timeout: 5000,
        queryCache: { ttl: 5 * 60 * 1000 },
        interceptors: {
          request: (config) => {
            config.headers['Authorization'] = getToken();
            return config;
          },
          response: (response) => response,
          error: (error) => {
            console.error(error);
            throw error;
          }
        }
      }}
    >
      {children}
    </QueryClientProvider>
  );
}

// Configuration is automatically applied in SSR:
// app/page.tsx (Server Component)
import { ssrPrefetch } from 'next-unified-query';
import { HydrationBoundary } from 'next-unified-query/react';

export default async function Page() {
  // No additional configuration needed!
  const state = await ssrPrefetch([
    [queryFactory.users.list],
    [queryFactory.posts.list]
  ]);
  
  return (
    <HydrationBoundary state={state}>
      <ClientComponent />
    </HydrationBoundary>
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

### configureQueryClient

Sets the default configuration for all QueryClient instances.

```typescript
function configureQueryClient(options: QueryClientOptions): void
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `QueryClientOptions` | Global configuration for QueryClient |

#### QueryClientOptions

```typescript
interface QueryClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  queryCache?: {
    ttl?: number;        // Time to live in ms
    maxQueries?: number; // Maximum cached queries
  };
  
  // 🆕 Environment-specific interceptors (v0.2.0+)
  interceptors?: {        // Common interceptors (all environments)
    request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
    response?: (response: Response) => Response | Promise<Response>;
    error?: (error: FetchError) => Promise<any>;
  };
  clientInterceptors?: {  // Client-only interceptors (browser)
    request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
    response?: (response: Response) => Response | Promise<Response>;
    error?: (error: FetchError) => Promise<any>;
  };
  serverInterceptors?: {  // Server-only interceptors (Node.js)
    request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
    response?: (response: Response) => Response | Promise<Response>;
    error?: (error: FetchError) => Promise<any>;
  };
}
```

#### Example

```typescript
import { configureQueryClient } from 'next-unified-query';

// Set global configuration
configureQueryClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'X-App-Version': '1.0.0'
  },
  queryCache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxQueries: 1000
  },
  interceptors: {
    request: (config) => {
      // Add auth token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
      return config;
    },
    error: async (error) => {
      if (error.status === 401) {
        // Handle unauthorized
        await refreshToken();
        throw error;
      }
      throw error;
    }
  }
});
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
  invalidateQueries(prefix: string | readonly unknown[]): void
  prefetchQuery(key: QueryKey, fetchFn: () => Promise<T>): Promise<T>
  prefetchQuery(query: QueryConfig, params: any): Promise<T>
  
  // Utility methods
  getCache(): QueryCache
  getFetcher(): NextTypeFetch
}
```

#### Constructor Options

```typescript
interface QueryClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  queryCache?: {
    ttl?: number;            // Time to live in ms
    maxQueries?: number;     // Max cached queries (default: 1000)
  };
  
  // 🆕 Environment-specific interceptors (v0.2.0+)
  interceptors?: {          // Common interceptors (all environments)
    request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
    response?: (response: Response) => Response | Promise<Response>;
    error?: (error: FetchError) => Promise<any>;
  };
  clientInterceptors?: {    // Client-only interceptors (browser)
    request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
    response?: (response: Response) => Response | Promise<Response>;
    error?: (error: FetchError) => Promise<any>;
  };
  serverInterceptors?: {    // Server-only interceptors (Node.js)
    request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
    response?: (response: Response) => Response | Promise<Response>;
    error?: (error: FetchError) => Promise<any>;
  };
  
  fetcher?: NextTypeFetch;  // Custom HTTP client (advanced)
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

##### `invalidateQueries(prefix: string | readonly unknown[]): void`

Invalidates queries matching the given prefix.

```typescript
// Invalidate all user queries (array prefix)
queryClient.invalidateQueries(['user']);

// Invalidate specific user queries
queryClient.invalidateQueries(['user', '123']);

// String prefix example
queryClient.invalidateQueries('user');
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
    queryFn: async (params, fetcher) => {
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

Utility functions responsible for creating and globally managing QueryClient.


#### `getQueryClient`

Automatically returns an environment-appropriate QueryClient.

```typescript
function getQueryClient(
  options?: QueryClientOptionsWithInterceptors
): QueryClient
```

**Operation Mode:**
- **Server Environment**: Always creates new instance (request isolation)
- **Client Environment**: Uses singleton pattern (state preservation)

##### Example

```typescript
// Use default settings
const queryClient = getQueryClient();

// Use with additional options
const queryClient = getQueryClient({
  timeout: 5000 // Add/override to default settings
});
```

#### `createQueryClientWithInterceptors`

Directly creates a QueryClient with interceptor configuration.

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

Resets the global QueryClient in the client environment. Mainly used in testing.

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
  // Register interceptor - returns InterceptorHandle
  use(handler: T, options?: InterceptorOptions): InterceptorHandle;
  
  // Remove by ID
  eject(id: number): void;
  
  // Remove all interceptors by type
  ejectByType(type: symbol): void;
  
  // Remove all interceptors
  clear(): void;
  
  // Debug: List of registered interceptors
  getRegisteredInterceptors(): Array<{ id: number; tag: string; type: string }>;
}
```

#### Basic Usage

```typescript
const api = createFetch();

// Request interceptor - returns handle
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

// Methods to remove interceptors
requestHandle.remove();    // Remove individual
responseHandle.remove();   
errorHandle.remove();

// Or remove all interceptors
api.interceptors.request.clear();
api.interceptors.response.clear();
api.interceptors.error.clear();
```

#### Environment-Specific Interceptors (v0.2.0+)

Next Unified Query provides three types of interceptors to eliminate `typeof window` checks:

```typescript
const queryConfig: QueryClientOptions = {
  // Common interceptors (all environments)
  interceptors: {
    request: (config) => {
      config.headers['X-App-Version'] = '1.0.0';
      return config;
    },
    response: (response) => {
      console.log(`[${response.config.method}] ${response.config.url}`);
      return response;
    }
  },
  
  // Client-only interceptors (browser environment)
  clientInterceptors: {
    request: (config) => {
      // Direct access to browser APIs - no typeof checks!
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    error: (error) => {
      if (error.response?.status === 401) {
        // Direct window access
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  },
  
  // Server-only interceptors (Node.js environment)
  serverInterceptors: {
    request: (config) => {
      // Access server-only resources
      config.headers['X-Server-Region'] = process.env.REGION;
      config.headers['X-Internal-Key'] = process.env.INTERNAL_API_KEY;
      return config;
    },
    response: (response) => {
      // Server-side logging
      logToElasticsearch({
        url: response.config.url,
        status: response.status,
        duration: response.headers['x-response-time']
      });
      return response;
    }
  }
};
```

**Execution Order:**
1. Common interceptors (`interceptors`) - run first
2. Environment-specific interceptors (`clientInterceptors` or `serverInterceptors`) - run second

This eliminates the need for environment checks in your interceptor code:

```typescript
// Before (v0.1.x)
interceptors: {
  request: (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      // ...
    }
    return config;
  }
}

// After (v0.2.0+) - Much cleaner!
clientInterceptors: {
  request: (config) => {
    const token = localStorage.getItem('token'); // Direct access!
    // ...
    return config;
  }
}
```

## Next.js SSR/CSR Configuration

### Simplified Configuration (v0.2.0+)

Starting from Next Unified Query v0.2.0, **a single configuration** supports both SSR and Client:

```tsx
// app/providers.tsx (Client Component)
'use client';
import { QueryClientProvider } from 'next-unified-query/react';

export function Providers({ children }) {
  return (
    <QueryClientProvider 
      config={{  // Use config prop (recommended)
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        headers: { 'X-App': 'MyApp' },
        timeout: 5000,
        queryCache: { ttl: 5 * 60 * 1000 },
        interceptors: {
          request: (config) => {
            config.headers['Authorization'] = getToken();
            return config;
          }
        }
      }}
    >
      {children}
    </QueryClientProvider>
  );
}
```

This configuration automatically applies to:
- ✅ Client-side rendering
- ✅ Server-side rendering
- ✅ API Routes
- ✅ All HTTP requests


### Shared Configuration Pattern

You can separate common configuration into a separate file to follow DRY principles:

```typescript
// lib/query-config.ts
import type { QueryClientOptions } from 'next-unified-query';

export const queryConfig: QueryClientOptions = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  queryCache: {
    maxQueries: 1000,
  },
  
  // 🆕 Environment-specific interceptors (v0.2.0+)
  
  // Common interceptors (all environments)
  interceptors: {
    request: (config) => {
      config.headers['X-App-Version'] = '1.0.0';
      return config;
    }
  },
  
  // Client-only interceptors (browser)
  clientInterceptors: {
    request: (config) => {
      // Direct access to browser APIs - no typeof checks!
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
      return config;
    }
  },
  
  // Server-only interceptors (Node.js)
  serverInterceptors: {
    request: (config) => {
      config.headers['X-Server-Region'] = process.env.REGION;
      return config;
    }
  }
};
```

```tsx
// app/providers.tsx
"use client";

import { QueryClientProvider } from 'next-unified-query/react';
import { queryConfig } from '@/lib/query-config';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider config={queryConfig}>
      {children}
    </QueryClientProvider>
  );
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

**📦 New in v0.2.0+: Improved Type Parameter Order**

The type parameters now follow the natural flow of data:
- `TVariables` - What you send (input)
- `TData` - What you get back (output)  
- `TError` - Error type (optional, defaults to FetchError)

```typescript
// v0.2.0+ Type parameter order: Variables → Data → Error
function useMutation<TVariables = any, TData = unknown, TError = FetchError>(
  options: UseMutationOptions<TVariables, TData, TError>
): UseMutationResult<TData, TError, TVariables>

// Examples
useMutation<CreateUserInput, User>({...})          // 2 params (most common)
useMutation<UpdateInput, Result, CustomError>({...}) // 3 params (with custom error)
```

#### Key Features

🎯 **Automatic baseURL Application**: 
- baseURL set in `configureQueryClient` is automatically applied
- Using relative URLs makes environment-specific configuration management easier

🛡️ **Type-Safe HTTP Methods**:
- Only POST, PUT, DELETE, PATCH, HEAD, OPTIONS methods are allowed
- GET method is only used in useQuery (clear role separation)

#### Options

```typescript
// v0.2.0+: Simplified interface without TContext type parameter
interface UseMutationOptions<TVariables = any, TData = unknown, TError = FetchError> {
  // Required (one of these)
  mutationFn?: (variables: TVariables, fetcher: NextTypeFetch) => Promise<TData>;
  url?: string | ((variables: TVariables) => string);
  method?: MutationMethod; // 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS'
  
  // Optional callbacks (context is now 'any' for simplicity)
  onMutate?: (variables: TVariables) => Promise<any> | any;
  onSuccess?: (data: TData, variables: TVariables, context: any) => void;
  onError?: (error: TError, variables: TVariables, context: any) => void;
  onSettled?: (data?: TData, error?: TError, variables?: TVariables, context: any) => void;
  
  // Schema validation
  requestSchema?: ZodType<TVariables>;  // Validates input
  responseSchema?: ZodType<TData>;      // Validates output
  
  // Cache invalidation
  invalidateQueries?: (string | readonly unknown[])[] | ((data: TData, variables: TVariables) => (string | readonly unknown[])[]);
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
// Type parameters: input → output (v0.2.0+)
function UpdateUser({ userId }: { userId: number }) {
  const mutation = useMutation<UserData, User>({
    url: `/users/${userId}`,  // ✅ Use relative URL (baseURL auto-applied)
    method: 'PUT',
    onSuccess: (updatedUser) => {
      alert(`User ${updatedUser.name} updated!`);
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
  // Type parameters: DeleteInput → void (no response data)
  const mutation = useMutation<{ userId: number }, void>({
    url: (variables) => `/users/${variables.userId}`,
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
  
  // With optimistic updates: Variables → Response → Error (optional)
  const toggleMutation = useMutation<Partial<Todo>, Todo>({
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
      queryClient.invalidateQueries(['todos']);
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

Context provider for QueryClient with automatic configuration.

```typescript
interface QueryClientProviderProps {
  /**
   * QueryClient instance (optional)
   */
  client?: QueryClient;
  /**
   * QueryClient configuration (recommended)
   * Creates a QueryClient with this config if client is not provided.
   * Same configuration applies to both SSR and Client.
   */
  config?: QueryClientOptions;
  /**
   * @deprecated Use config instead
   */
  options?: QueryClientOptions;
  children: React.ReactNode;
}
```

#### Recommended Usage (config prop)

```tsx
import { QueryClientProvider } from 'next-unified-query/react';

function App() {
  return (
    <QueryClientProvider 
      config={{
        baseURL: 'https://api.example.com',
        headers: { 'X-App': 'MyApp' },
        timeout: 5000,
        queryCache: { 
          ttl: 5 * 60 * 1000,
          maxQueries: 500
        }
      }}
    >
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
```

#### Legacy Usage (client prop)

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

### useQueryConfig

Hook to access the QueryClient configuration.

```typescript
function useQueryConfig(): QueryClientOptions | undefined
```

#### Example

```tsx
import { useQueryConfig } from 'next-unified-query/react';

function ApiStatus() {
  const config = useQueryConfig();
  
  return (
    <div>
      <p>API Base URL: {config?.baseURL}</p>
      <p>Timeout: {config?.timeout}ms</p>
    </div>
  );
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

The library provides comprehensive error handling utilities.

### Error Type Guards

```typescript
import { 
  isFetchError, 
  isValidationError, 
  hasErrorCode,
  getValidationErrors 
} from 'next-unified-query';

// FetchError type guard
if (isFetchError(error)) {
  console.log(error.status); // HTTP status code
  console.log(error.config); // Request configuration
  console.log(error.data);   // Error data
}

// Check validation error
if (isValidationError(error)) {
  const validationErrors = getValidationErrors(error);
  validationErrors.forEach(({ path, message }) => {
    console.log(`${path}: ${message}`);
  });
}

// Check specific error code
if (hasErrorCode(error, 'ERR_NETWORK')) {
  console.log('Network connection error');
}
```

### Error Handlers

```typescript
import { 
  handleFetchError, 
  handleHttpError,
  ErrorCode 
} from 'next-unified-query';

// Error code handling
try {
  const response = await api.get('/api/data');
} catch (error) {
  const result = handleFetchError(error, {
    [ErrorCode.NETWORK]: () => 'Please check your network connection',
    [ErrorCode.TIMEOUT]: () => 'Request timed out',
    [ErrorCode.VALIDATION]: (error) => {
      const errors = getValidationErrors(error);
      return `Validation error: ${errors.map(e => e.message).join(', ')}`;
    },
    default: (error) => `Unknown error: ${error.message}`
  });
  
  console.log(result);
}

// HTTP status code handling
try {
  const response = await api.get('/api/data');
} catch (error) {
  const result = handleHttpError(error, {
    401: () => 'Authentication required',
    403: () => 'Access denied',
    404: () => 'Data not found',
    500: () => 'Server error occurred',
    default: (error) => `HTTP error ${error.status}: ${error.message}`
  });
  
  alert(result);
}
```

## Response Utilities

Utility functions for handling response objects.

```typescript
import { 
  unwrap, 
  getStatus, 
  getHeaders, 
  hasStatus 
} from 'next-unified-query';

const response = await api.get('/api/users');

// Extract data
const users = unwrap(response);  // Same as response.data

// Check status code
const status = getStatus(response);  // 200
if (hasStatus(response, 200)) {
  console.log('Success!');
}

// Access headers
const headers = getHeaders(response);
const contentType = headers.get('content-type');
```

## SSR Support

### ssrPrefetch

Pre-fetches multiple queries in SSR. Starting from v0.2.0, the `config` from `QueryClientProvider` is automatically applied.

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
| `queries` | `Array<QueryItem>` | Array of queries to prefetch |
| `globalFetchConfig` | `Record<string, any>` | Common configuration to apply to all queries (optional) |
| `client` | `QueryClient` | Optional QueryClient (advanced usage) |

#### QueryItem Type

```typescript
type QueryItem = 
  | [QueryConfig<any, any>]           // No parameters
  | [QueryConfig<any, any>, any];     // With parameters
```

#### Examples

##### Basic SSR Prefetch (Recommended)

```typescript
// app/page.tsx (Server Component)
import { ssrPrefetch } from 'next-unified-query';
import { HydrationBoundary } from 'next-unified-query/react';
import { userQueries, postQueries } from '@/queries';

export default async function Page() {
  // QueryClientProvider's config is automatically applied!
  const dehydratedState = await ssrPrefetch([
    [userQueries.list],                    // No parameters
    [userQueries.get, { id: 1 }],         // With parameters
    [postQueries.list, { userId: 1 }]
  ]);
  
  return (
    <HydrationBoundary state={dehydratedState}>
      <ClientComponent />
    </HydrationBoundary>
  );
}
```

##### With Custom Configuration (Override)

```typescript
// When you want to apply different settings only to specific SSR requests
const dehydratedState = await ssrPrefetch(
  [
    [userQueries.get, { id: 1 }],
    [postQueries.list, { userId: 1 }]
  ],
  {
    baseURL: 'https://api.internal.com',  // Use internal API
    timeout: 30000  // Longer timeout for SSR
  }
);
```

##### Legacy Method (with manual QueryClient)

```typescript
// Manual QueryClient creation (not recommended)
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

Transfers pre-fetched data from SSR to the client.

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
  // Use pre-fetched data immediately
  const { data } = useQuery(userQueries.get, { params: { id: 1 } });
  
  return <div>{data?.name}</div>;
}
```

## Global Functions Integration

The library's global functions automatically use the `baseURL` and other options set in `configureQueryClient` or `QueryClientProvider`'s `config`.

### Available Global Functions

```typescript
import { get, post, put, del, patch, head, options } from 'next-unified-query';
```

### Key Features

- **Automatic baseURL application**: The `baseURL` set in `configureQueryClient` is automatically applied to all global functions
- **Integrated interceptors**: QueryClient interceptors apply equally to global functions
- **Unified configuration**: All requests share the same default settings

### Examples

#### Basic Global Function Usage

```typescript
import { post, get, configureQueryClient } from 'next-unified-query';

// Global configuration (recommended)
configureQueryClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Now all global functions automatically use baseURL
async function createUser(userData: any) {
  const response = await post('/users', userData);  // ✅ Requests to https://api.example.com/users
  return response.data;
}

async function fetchUser(id: number) {
  const response = await get(`/users/${id}`);  // ✅ Requests to https://api.example.com/users/1
  return response.data;
}
```

#### Advanced Configuration

```typescript
import { 
  configureQueryClient, 
  createFetch,
  post, 
  get 
} from 'next-unified-query';

// Complex global configuration
configureQueryClient({
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

// All global functions automatically use the above configuration
export const api = {
  // User-related APIs
  users: {
    list: () => get('/users'),                    // 🔄 Auto baseURL + interceptors
    get: (id: number) => get(`/users/${id}`),     // 🔄 Auto baseURL + interceptors
    create: (data: any) => post('/users', data),  // 🔄 Auto baseURL + interceptors
    update: (id: number, data: any) => post(`/users/${id}`, data)
  },
  
  // Authentication-related APIs
  auth: {
    login: (credentials: any) => post('/auth/login', credentials),
    refresh: () => post('/auth/refresh'),         // 🔄 baseURL auto-applied
    logout: () => post('/auth/logout')
  }
};
```

#### Per-Request Override

You can override global settings in individual requests:

```typescript
import { post } from 'next-unified-query';

// Global baseURL: https://api.example.com
configureQueryClient({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

// Use different settings only for specific requests
const response = await post('/upload', formData, {
  baseURL: 'https://upload.example.com',  // 🔄 Use different baseURL for this request only
  timeout: 30000,                        // 🔄 Use different timeout for this request only
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

### HTTP Method Restrictions

Global functions use only their intended HTTP methods:

```typescript
// ✅ Allowed usage
await get('/users');           // GET request
await post('/users', data);    // POST request  
await put('/users/1', data);   // PUT request
await del('/users/1');        // DELETE request
await patch('/users/1', data); // PATCH request
await head('/users');          // HEAD request
await options('/users');       // OPTIONS request

// ❌ Method-specific restrictions - TypeScript compile error
await get('/users', data);     // GET has no data parameter
```

### Integration with React Hooks

Global functions and React hooks share the same configuration:

```typescript
// app/providers.tsx
// Configure via QueryClientProvider's config
const config = {
  baseURL: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' }
};

// Use hooks in React components
function UserProfile() {
  const { data } = useQuery({
    cacheKey: ['user', userId],
    url: `/users/${userId}`  // ✅ baseURL auto-applied
  });
  
  const mutation = useMutation({
    url: '/users',           // ✅ baseURL auto-applied
    method: 'POST'
  });
}

// Use global functions in the same component
async function handleDirectApiCall() {
  const response = await post('/users', userData);  // ✅ Same baseURL + headers applied
  return response.data;
}
```

### Type Safety

Global functions also provide complete type safety:

```typescript
import { post, get } from 'next-unified-query';
import { z } from 'zod';

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

// Type-safe API calls
async function createUser(userData: z.input<typeof userSchema>) {
  const response = await post<z.output<typeof userSchema>>('/users', userData, {
    schema: userSchema  // Response validation
  });
  
  return response.data;  // Type: { id: number; name: string; email: string; }
}
```

## Constants and Enums

### ContentType

Constants for setting request Content-Type.

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

Constants for setting response type.

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

Extracts detailed error information from Zod schema validation errors.

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

Checks if an error has a specific error code.

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
  // Handle network error
} else if (hasErrorCode(error, ErrorCode.TIMEOUT)) {
  // Handle timeout error
}
```

### errorToResponse

Converts an error to NextTypeResponse format.

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
  // Convert error to standard response format
  return errorToResponse(error, null);
}
```

## HTTP Method Restrictions

The library implements HTTP method restrictions for type safety and intentional usage.

### useQuery: Read-Only Operations

`useQuery` is a hook for data fetching only, allowing only GET and HEAD methods.

```typescript
// ✅ Allowed useQuery usage
const { data } = useQuery({
  cacheKey: ['users'],
  url: '/api/users'  // Uses GET method by default
});

const { data } = useQuery({
  cacheKey: ['user-meta', userId],
  queryFn: async (fetcher) => {
    return await fetcher.head(`/api/users/${userId}`);  // HEAD method allowed
  }
});
```

#### QueryFetcher Interface

The `fetcher` received in Factory Pattern's Custom Function is of type `QueryFetcher`:

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

`useMutation` is a hook for data mutations, allowing all HTTP methods except GET.

```typescript
// ✅ Allowed useMutation usage (v0.2.0+ type parameter order)
const createMutation = useMutation<CreateUserInput, User>({
  url: '/api/users',
  method: 'POST'  // POST, PUT, DELETE, PATCH, HEAD, OPTIONS allowed
});

const updateMutation = useMutation<{ id: number } & Partial<User>, User>({
  url: ({ id }) => `/api/users/${id}`,
  method: 'PUT'
});

const deleteMutation = useMutation<number, void>({
  url: (id) => `/api/users/${id}`,
  method: 'DELETE'
});

// Custom Function approach also supports all methods
const complexMutation = useMutation<BulkUpdateData, BulkUpdateResult>({
  mutationFn: async (data, fetcher) => {
    // fetcher is NextTypeFetch type (supports all methods)
    const result = await fetcher.patch<BulkUpdateResult>('/api/users/bulk', data);
    return result.data;
  }
});
```

#### NextTypeFetch Interface

The `fetcher` received in Mutation is of type `NextTypeFetch`:

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

Global functions each support only specific HTTP methods:

```typescript
import { get, post, put, del, patch, head, options } from 'next-unified-query';

// ✅ Correct usage - each function uses only its unique method
await get('/api/users');                    // GET
await post('/api/users', userData);         // POST
await put('/api/users/1', updateData);      // PUT
await del('/api/users/1');                  // DELETE
await patch('/api/users/1', patchData);     // PATCH
await head('/api/users');                   // HEAD
await options('/api/users');                // OPTIONS

// ❌ TypeScript compile error - method signatures differ
await get('/api/users', userData);          // GET has no data parameter
await post('/api/users');                   // POST requires data parameter (though optional)
```

### Type Safety Benefits

These restrictions provide the following benefits:

#### 1. Intent Clarification

```typescript
// ✅ Clear intent
const { data } = useQuery({           // "Fetching data"
  cacheKey: ['users'],
  url: '/api/users'
});

const mutation = useMutation({        // "Mutating data"
  url: '/api/users',
  method: 'POST'
});
```

#### 2. Error Prevention

```typescript
// ❌ Compile-time error
const { data } = useQuery({
  cacheKey: ['users'],
  url: '/api/users',
  method: 'POST'  // Compile error: useQuery doesn't support POST
});
```

#### 3. Caching Optimization

```typescript
// useQuery only accepts GET/HEAD requests, so it can safely cache
// useMutation is for data mutations, so it doesn't cache
```

### Migration from Unrestricted Libraries

When migrating from other libraries:

```typescript
// Other libraries (no restrictions)
const result = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users', { method: 'POST' })  // 🤔 Confusing pattern
});

// Next Unified Query (clear separation)
const { data } = useQuery({        // GET only
  cacheKey: ['users'],
  url: '/api/users'
});

const mutation = useMutation({     // POST/PUT/DELETE etc. allowed
  url: '/api/users',
  method: 'POST'
});
```

### Custom Functions with Method Restrictions

Type restrictions also apply in Factory Pattern:

```typescript
const userQueries = createQueryFactory({
  list: {
    cacheKey: () => ['users'] as const,
    queryFn: async (_, fetcher: QueryFetcher) => {
      // ✅ Can only use GET, HEAD
      return await fetcher.get('/api/users');
      // ❌ fetcher.post doesn't exist (TypeScript error)
    }
  }
});

const userMutations = createMutationFactory({
  create: {
    mutationFn: async (data, fetcher: NextTypeFetch) => {
      // ✅ Can use all methods
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
      queryClient.invalidateQueries(['users', userId]);
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
  
  // Factory pattern with type inference
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

Generated with Next Unified Query v0.2.0
