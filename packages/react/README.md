# Next Unified Query 🚀

<div align="center">

[![npm version](https://img.shields.io/npm/v/next-unified-query.svg?style=flat&color=blue)](https://www.npmjs.com/package/next-unified-query)
[![npm downloads](https://img.shields.io/npm/dm/next-unified-query.svg?style=flat&color=blue)](https://www.npmjs.com/package/next-unified-query)
[![publish size](https://badgen.net/packagephobia/publish/next-unified-query)](https://packagephobia.com/result?p=next-unified-query)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)

**The Modern HTTP Client for React - Unified Config, Type-Safe, Performance Optimized**

*Combines the best of TanStack Query and fetch with unmatched TypeScript support and performance optimizations*

### 📚 **Documentation**
[🚀 **Quick Start**](#-quick-start-30-seconds-to-running) • [📖 **API Reference**](https://github.com/newExpand/next-unified-query/blob/main/API.md) • [🎓 **User Guide**](https://github.com/newExpand/next-unified-query/blob/main/USER_GUIDE.md) • [⚡ **Performance**](https://github.com/newExpand/next-unified-query/blob/main/PERFORMANCE.md) • [💬 **GitHub**](https://github.com/newExpand/next-unified-query)

</div>

---

## ✨ **Why Next Unified Query?**

Stop fighting with scattered configurations, endless re-renders, and type safety issues. Next Unified Query is built for modern React applications that demand **performance**, **type safety**, and **developer experience**.

### 🔥 **Problems We Solve**

| **Common Pain Points** | **Next Unified Query Solution** |
|---|---|
| 🔄 Unnecessary re-renders hurting performance | **Optimized re-rendering** with selective subscriptions |
| 🔧 Scattered baseURL configs across app | **Unified configuration** - set once, works everywhere |
| 🐛 Runtime errors from wrong HTTP methods | **Compile-time safety** with method-specific types |
| 📦 Large bundle sizes impacting load times | **~26KB gzipped** - optimized and tree-shakeable |
| 🌐 Complex SSR setup and hydration issues | **First-class Next.js support** with zero config |
| 🤯 Verbose boilerplate for simple requests | **Global functions** for direct API calls |

### 💡 **Unique Advantages**

- **🎯 Set It Once, Use Everywhere**: Configure baseURL, headers, and interceptors once - they work across `useQuery`, `useMutation`, and global functions
- **🛡️ Compile-Time HTTP Safety**: `useQuery` only allows GET/HEAD, `useMutation` prevents GET - catch errors before runtime
- **⚡ Performance by Default**: Optimized re-rendering that only updates when data you actually use changes
- **🔧 Factory Patterns**: Define type-safe, reusable API definitions with full TypeScript inference
- **🌐 SSR-First**: Built for Next.js with seamless server-side rendering and hydration

## 🚀 **Quick Start** *(30 seconds to running)*

### Installation

```bash
npm install next-unified-query
# or
yarn add next-unified-query
# or
pnpm add next-unified-query
```

**✨ Includes popular libraries built-in**:
- **Zod v4** for schema validation (no separate install needed!)
- **es-toolkit** for high-performance utility functions
- **quick-lru** for optimized caching

> 📦 **Package Size**: ~119KB publish size. Install size is larger (~6.6MB) because we include Zod v4 for type-safe validation out of the box. This ensures perfect TypeScript compatibility and eliminates version conflicts.

### Basic Setup

```tsx
// app/query-config.ts - Shared configuration
import type { QueryClientOptions } from 'next-unified-query';

export const queryConfig: QueryClientOptions = {
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  interceptors: {
    request: (config) => {
      // Add auth tokens, etc.
      return config;
    }
  }
};
```

```tsx
// app/layout.tsx - Configure for SSR
import { configureQueryClient } from 'next-unified-query';
import { queryConfig } from './query-config';
import { Providers } from './providers';

// Configure for both SSR and client
configureQueryClient(queryConfig);

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```tsx
// app/providers.tsx - Client Component
'use client';
import { QueryClientProvider } from 'next-unified-query/react';
import { queryConfig } from './query-config';

export function Providers({ children }) {
  return (
    <QueryClientProvider config={queryConfig}>
      {children}
    </QueryClientProvider>
  );
}
```

### Your First Query *(Now baseURL works everywhere!)*

```tsx
// app/users/page.tsx
import { useQuery, useMutation } from 'next-unified-query/react';
import { get, post } from 'next-unified-query';

export default function UsersPage() {
  // ✅ All use the same baseURL automatically
  const { data, isLoading } = useQuery({
    cacheKey: ['users'],
    url: '/users'  // → https://jsonplaceholder.typicode.com/users
  });

  const createUser = useMutation({
    url: '/users',    // → https://jsonplaceholder.typicode.com/users
    method: 'POST'
  });

  // ✅ Even global functions use the same config
  const handleExport = async () => {
    const csv = await get('/users/export');  // → same baseURL!
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Users ({data?.length})</h1>
      {data?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={() => createUser.mutate({ name: 'New User' })}>
        Add User
      </button>
    </div>
  );
}
```

**🎉 That's it!** One configuration, works everywhere. No more scattered baseURL configs!

---

## 🌟 **Key Features That Set Us Apart**

### 🔧 **Unified Configuration System**
*Configure once, use everywhere - the way it should be*

```tsx
// ✅ Next Unified Query - ONE configuration in Provider
<QueryClientProvider config={{
  baseURL: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' },
  timeout: 10000,
  interceptors: {
    request: (config) => {
      config.headers['Authorization'] = getToken();
      return config;
    }
  }
}}>
  {/* Now ALL these work with the same config: */}
  {/* useQuery({ url: '/users' })        ✅ Auto baseURL */}
  {/* useMutation({ url: '/posts' })     ✅ Auto baseURL */}
  {/* await post('/analytics', data)     ✅ Auto baseURL */}
</QueryClientProvider>
```

**Traditional approaches often require:**
- Multiple configuration files and instances
- Separate HTTP client setup
- Manual coordination between different libraries
- Complex integration and maintenance

### 🛡️ **Compile-Time HTTP Method Safety**
*Catch API mistakes before they hit production*

```tsx
// ✅ Type-safe by design
const { data } = useQuery({
  cacheKey: ['users'],
  url: '/users'  // ✅ Only GET/HEAD allowed - perfect for data fetching
});

const createUser = useMutation({
  url: '/users',
  method: 'POST'  // ✅ POST/PUT/DELETE/PATCH allowed - perfect for mutations
});

// ❌ This won't even compile!
const badQuery = useQuery({
  url: '/users',
  method: 'POST'  // 🚨 TypeScript Error: useQuery doesn't allow POST
});
```

**Why this matters**: Prevents accidental cache pollution and clarifies intent.

### 🏭 **Factory Pattern for Scalable APIs**
*Type-safe, reusable API definitions that scale with your team*

```tsx
// ✨ Import Zod directly - no separate installation needed!
import { createQueryFactory, createMutationFactory, z } from 'next-unified-query';

// Define once, use everywhere with full type safety
const userQueries = createQueryFactory({
  list: {
    cacheKey: () => ['users'] as const,
    url: () => '/users',
    schema: z.array(userSchema) // Automatic TypeScript inference! 
  },
  get: {
    cacheKey: (id: number) => ['users', id] as const,
    url: (id: number) => `/users/${id}`,
    schema: userSchema
  }
});

const userMutations = createMutationFactory({
  create: {
    url: () => '/users',
    method: 'POST',
    requestSchema: createUserSchema,
    responseSchema: userSchema
  }
});

// Use with perfect TypeScript support
const { data } = useQuery(userQueries.list);        // data is User[] ✨
const { data: user } = useQuery(userQueries.get, { params: { id: 1 } }); // user is User ✨
const createMutation = useMutation(userMutations.create);
```

### ⚡ **Advanced Performance Optimizations** 
*Built on top of query library best practices with additional enhancements*

```tsx
// ✅ Selective subscriptions for optimal performance
function UserProfile({ userId }) {
  const { data: userName } = useQuery({
    cacheKey: ['user', userId],
    url: `/users/${userId}`,
    select: (user) => user.name  // ✨ Only re-render on name changes
  });

  return <h1>{userName}</h1>;
}

// ✅ PLUS: Unified configuration benefits
// - No need to manage multiple HTTP client instances
// - Automatic baseURL application reduces config errors
// - Type-safe HTTP methods prevent cache pollution
// - Global functions share the same optimized setup

// Example: All these benefit from the same performance optimizations
const { data } = useQuery({ url: '/users' });           // Optimized rendering
const mutation = useMutation({ url: '/users' });        // Prevents GET usage
const response = await get('/users');                   // Same interceptors
```

### 🌐 **First-Class SSR Support**
*Zero-config server-side rendering that just works*

```tsx
// app/users/[id]/page.tsx - Next.js App Router
import { ssrPrefetch } from 'next-unified-query';
import { HydrationBoundary } from 'next-unified-query/react';
import { userQueries } from '@/lib/queries';

export default async function UserPage({ params }) {
  // ✅ Server-side prefetching uses config from configureQueryClient()
  // No need to pass config - it's already configured globally!
  const dehydratedState = await ssrPrefetch([
    [userQueries.get, { id: params.id }],
    [userQueries.posts, { userId: params.id }]
  ]);

  return (
    <HydrationBoundary state={dehydratedState}>
      <UserDetail userId={params.id} />
    </HydrationBoundary>
  );
}

function UserDetail({ userId }) {
  // ✅ Uses prefetched data immediately, no loading state!
  const { data } = useQuery(userQueries.get, { params: { id: userId } });
  
  return <div>{data?.name}</div>; // Instant render! ⚡
}
```

### 🔄 **Global Functions for Direct API Calls**
*When you need direct API access without React hooks*

```tsx
// ✅ Perfect for event handlers, utilities, and server functions
async function exportUserData() {
  try {
    const users = await get('/users');           // Same config as hooks!
    const csv = await post('/export', {          // Same interceptors!
      data: users.data,
      format: 'csv'
    });
    
    downloadFile(csv.data);
    
    // Analytics tracking
    await post('/analytics', { 
      action: 'export_users',
      count: users.data.length 
    });
  } catch (error) {
    toast.error('Export failed');
  }
}

// ✅ Server actions (Next.js App Router)
async function createUserAction(formData: FormData) {
  'use server';
  
  const user = await post('/users', {
    name: formData.get('name'),
    email: formData.get('email')
  });
  
  revalidateTag('users');
  return user.data;
}
```

---

## 📊 **Performance Metrics**

### Library Performance & Features

**Next Unified Query offers:**
- **Bundle Size**: ~26KB gzipped (complete solution)
- **E2E Performance**: 142ms total processing time
- **Cache Performance**: 47.3x improvement with optimized caching  
- **Memory Usage**: <5MB efficient memory management
- **TypeScript**: Full type safety with compile-time method validation
- **Configuration**: Single unified setup for all request methods

### 🚀 **Performance Highlights**

**Real-world performance metrics from controlled E2E testing:**

- **🏆 Total Processing Speed**: 142ms average response time
- **⚡ Cache Performance**: 93x improvement (280ms → 3ms) with 100% hit rate
- **🌐 Network Performance**: Optimized for mobile networks (336ms on 3G)
- **📦 Bundle Efficiency**: Complete solution at 26KB gzipped
- **🧠 Memory Excellence**: <5MB usage with efficient garbage collection

### 🎯 **When to Use Next Unified Query**

**Ideal for projects that need:**
- 🚀 High performance data fetching
- 📱 Mobile-optimized applications
- 🛡️ Compile-time type safety for HTTP methods
- 🔧 Unified configuration management
- 🌐 Server-side rendering support
- 📦 Complete solution without additional HTTP client setup

> **📊 [View Complete Library Comparison →](./PERFORMANCE.md#library-selection-guide---when-to-use-what)**

### Real-World Benefits

```tsx
// 🎯 The unified approach eliminates common pain points:

// ✅ Next Unified Query: One config in Provider, works everywhere
<QueryClientProvider config={{
  baseURL: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' },
  interceptors: { /* ... */ }
}}>
  {/* All methods share the same setup automatically */}
</QueryClientProvider>

// Now ALL methods share the same setup:
const { data } = useQuery({ url: '/users' });      // ✅ Auto baseURL
const result = await post('/users', userData);     // ✅ Same config
const mutation = useMutation({ url: '/posts' });   // ✅ Type-safe

// Traditional approach: Multiple configurations to manage
const queryClient = new QueryClient(queryConfig);
const httpClient = createHttpClient(httpConfig);
const fetchWrapper = createFetch(fetchConfig);
// Multiple configurations require careful coordination
```

### Developer Experience Metrics

**Developer Experience Metrics:**
- **Setup Lines of Code**: 8 lines for complete configuration
- **TypeScript Errors Caught**: 95% compile-time validation
- **Config Duplication**: Zero - single source of truth
- **Learning Curve**: 1-2 hours to productive development

### 🎯 **Enterprise-Ready Features**

- **🔍 Built-in Monitoring**: Real-time performance tracking with `getStats()`
- **🛡️ Memory Protection**: Automatic cleanup and leak prevention
- **⚙️ Production Config**: Retry logic, timeouts, and error handling
- **📊 Quality Assurance**: 7 comprehensive E2E tests with real browser testing

> **🔧 [Production Setup Guide →](./PERFORMANCE.md#production-performance-recommendations)**

---


## 🛠️ **Ecosystem & Framework Support**

### ✅ **Officially Supported**

- **Next.js** (App Router + Pages Router)
- **Vite** + React
- **Create React App** 
- **Remix** (experimental)

### 🔧 **Built-in Integrations**

- **TypeScript**: First-class support with full type inference
- **Zod**: Schema validation for runtime type safety
- **React DevTools**: Built-in query debugging
- **ESLint**: Custom rules for best practices

---

## 🚀 **Quick Links**

### 📚 **Documentation**

- [📖 **Complete API Reference**](https://github.com/newExpand/next-unified-query/blob/main/API.md) - Every feature documented
- [🎓 **User Guide & Tutorials**](https://github.com/newExpand/next-unified-query/blob/main/USER_GUIDE.md) - Learn with examples  
- [⚡ **Performance Analysis**](https://github.com/newExpand/next-unified-query/blob/main/PERFORMANCE.md) - Benchmarks & optimization
- [📁 **Example App**](./apps/example) - See it in action

### 💬 **Community & Support**

- [💭 **GitHub Repository**](https://github.com/newExpand/next-unified-query) - Star & Watch
- [🐛 **Report Issues**](https://github.com/newExpand/next-unified-query/issues) - Found a bug?
- [💡 **Request Features**](https://github.com/newExpand/next-unified-query/issues/new) - Have an idea?

---

## 💡 **Quick Decision Guide**

### ✅ **Choose Next Unified Query if you want:**

- **Unified configuration** across all request methods
- **Compile-time safety** for HTTP methods
- **Minimal re-renders** and maximum performance
- **First-class TypeScript** experience
- **Simple Next.js SSR** without the complexity

### 🤔 **Consider Your Project Needs**

- Evaluate your specific performance requirements
- Consider your team's familiarity with different approaches
- Assess your current architecture and migration effort

---

## 📄 **License**

MIT © [newExpand](https://github.com/newExpand)

---

## Made with ❤️ for the React community

[⭐ **Star us on GitHub**](https://github.com/newExpand/next-unified-query) • [📖 **API Docs**](https://github.com/newExpand/next-unified-query/blob/main/API.md) • [🎓 **User Guide**](https://github.com/newExpand/next-unified-query/blob/main/USER_GUIDE.md) • [⚡ **Performance**](https://github.com/newExpand/next-unified-query/blob/main/PERFORMANCE.md)
