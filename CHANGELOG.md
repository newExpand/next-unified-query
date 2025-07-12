# CHANGELOG

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-01-12

### 🎉 Initial Release

**Next Unified Query** - A modern HTTP client for React that combines the best of TanStack Query and Axios with unmatched TypeScript support and performance optimizations.

This library evolved from `next-type-fetch`, expanding from a simple HTTP client into a comprehensive solution that integrates HTTP client functionality, state management, and React hooks.

### ✨ Core Features

#### **Query Factory System**
- `createQueryFactory()`: Type-safe query definitions with automatic key generation
- `createMutationFactory()`: Mutation definitions with automatic cache invalidation
- Centralized API definitions for consistent code organization

#### **React Integration**
- `useQuery()`: TanStack Query-style hook for data fetching
- `useMutation()`: Hook for server state mutations
- `QueryClientProvider`: React Context-based state management
- `HydrationBoundary`: SSR data hydration support

#### **Built-in Query State Management**
- Automatic caching with intelligent cache invalidation
- Background refetching for fresh data
- LRU (Least Recently Used) algorithm for memory management
- Garbage collection for optimal performance
- Real-time cache updates and synchronization

#### **Advanced HTTP Client**
- Unified configuration (set baseURL, headers once)
- Request/Response interceptors
- Automatic retry with exponential backoff
- Circuit breaker pattern for fault tolerance
- File upload support with progress tracking
- Timeout configuration per request

#### **Type Safety**
- Full TypeScript support with automatic type inference
- Compile-time HTTP method validation
- Type-safe query parameters and request bodies
- Zod schema validation integration

#### **Performance Optimizations**
- Selective subscriptions to prevent unnecessary re-renders
- Optimized bundle size (~26KB gzipped)
- Tree-shakeable exports
- Efficient memory usage with configurable limits

#### **SSR & Next.js Support**
- First-class Next.js integration
- Server-side data prefetching
- Seamless hydration
- App Router and Pages Router compatibility

### 📦 Packages

- `next-unified-query-core`: Framework-agnostic core functionality
- `next-unified-query`: React hooks and components

### 🚀 Getting Started

```bash
npm install next-unified-query
# or
pnpm add next-unified-query
# or
yarn add next-unified-query
```

### 📖 Documentation

- [README](./README.md)
- [API Reference](./API.md)
- [User Guide](./USER_GUIDE.md)
- [Performance Guide](./PERFORMANCE.md)

### 🙏 Acknowledgments

This project builds upon the excellent work of:
- [TanStack Query](https://tanstack.com/query) for query management patterns
- [Axios](https://axios-http.com/) for HTTP client design inspiration
- The React and Next.js communities

---

[0.1.0]: https://github.com/newExpand/next-unified-query/releases/tag/v0.1.0