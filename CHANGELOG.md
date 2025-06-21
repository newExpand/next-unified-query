# CHANGELOG

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-01-XX

### ✨ New Beginning: next-unified-query 

**🚀 Completely redesigned as a unified query management solution!**

While the previous `next-type-fetch` was a simple HTTP client, it has now evolved into a **unified solution combining HTTP client + state management + React hooks**.

### 🎯 Major New Features

#### **Query Factory System**
- `createQueryFactory()`: Type-safe query definitions with automatic key generation
- `createMutationFactory()`: Mutation definitions with automatic cache invalidation
- Centralized API definitions for code consistency

#### **React Integration**
- `useQuery()`: TanStack Query-like query hook
- `useMutation()`: Mutation hook for server state changes
- `QueryClientProvider`: React Context-based state management
- `HydrationBoundary`: SSR data hydration support

#### **Built-in Query State Management**
- Automatic caching and background refetching
- LRU algorithm-based memory management
- Memory optimization through garbage collection
- Real-time cache invalidation

#### **Advanced Features**
- **Optimistic Updates**: Immediate UI updates followed by server synchronization
- **Dependent Queries**: Conditional query execution
- **Parallel Queries**: Concurrent query execution
- **SSR Prefetching**: Server-side data loading with `ssrPrefetch()` function

### 🔧 Technical Improvements

#### **Enhanced Type Safety**
- Complete type inference based on query factories
- Integrated Zod schema validation
- Improved generic type system

#### **Performance Optimization**
- Structural sharing to prevent unnecessary re-renders
- Smart caching strategies
- Optimized bundle size

#### **Developer Experience Enhancement**
- All features in one package
- Intuitive API design
- Comprehensive TypeScript support

### 📦 Package Structure Changes  

```javascript
// New export structure
export {
  // Core HTTP client (backward compatible)
  createFetch, request, get, post, put, del, patch, head, options,
  
  // New query management features
  createQueryFactory, createMutationFactory,
  getQueryClient, createQueryClientWithInterceptors,
  ssrPrefetch
} from 'next-unified-query';

// React hooks and components
export {
  useQuery, useMutation,
  QueryClientProvider, HydrationBoundary, useQueryClient
} from 'next-unified-query/react';
```

### 🔄 Migration Guide

#### **For existing next-type-fetch users**
```bash
# Remove old package
npm uninstall next-type-fetch

# Install new package
npm install next-unified-query
```

```typescript
// Existing code is 100% compatible
// Before
import { createFetch } from 'next-type-fetch';

// After - works identically
import { createFetch } from 'next-unified-query';
```

#### **Gradual Migration**
You can maintain existing HTTP client code while gradually introducing new query features:

```typescript
// Step 1: Keep existing code
const api = createFetch({ baseURL: '/api' });

// Step 2: Introduce query factory
const queries = createQueryFactory({
  users: { cacheKey: () => ['users'], url: '/users' }
});

// Step 3: Use React hooks
const { data } = useQuery(queries.users);
```

### 🆚 Differences from Previous Version

| Feature | next-type-fetch (Old) | next-unified-query (New) |
|---------|----------------------|--------------------------|
| HTTP Client | ✅ | ✅ (Compatible) |
| Query State Management | ❌ | ✅ **New** |
| React Hooks | ❌ | ✅ **New** |
| Query Key Management | ❌ | ✅ **New** |
| SSR Support | ⚠️ Limited | ✅ **Full Support** |
| Caching | ❌ | ✅ **New** |
| Optimistic Updates | ❌ | ✅ **New** |

### 🎉 Why Should You Upgrade?

1. **Improved Development Productivity**: No more need to combine multiple libraries
2. **Type Safety**: Complete TypeScript support reduces runtime errors
3. **Performance Optimization**: Smart caching eliminates unnecessary network requests
4. **Next.js Optimization**: Perfect compatibility with App Router
5. **Maintainability**: Unified management with a single package

---

### 📋 Previous next-type-fetch History

The following are major milestones from the previous `next-type-fetch` development process:

## [Previous Versions] next-type-fetch History

### [1.3.0] - 2025-05-24
- Advanced `authRetry` options (statusCodes, shouldRetry added)
- Support for custom status codes and conditional retries

### [1.2.0] - 2025-05-23  
- Official support for refresh token-based authentication flow
- Documentation of real-world token refresh scenarios

### [1.1.1] - 2025-05-16
- Improved request cancellation examples
- Added explicit tests for `promise.cancel()` method

### [1.1.0] - 2025-05-16
- Single instance support (Axios style)
- Global configuration and interceptor support
- Enhanced response handling safety

### [1.0.1] - 2025-05-11
- Improved TypeScript type definitions

### [1.0.0] - 2025-05-11
- First official release
- Basic HTTP client functionality

---

**🚀 Experience more powerful data fetching with next-unified-query!**
