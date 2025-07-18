# Architecture Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Package Architecture](#package-architecture)
4. [Documentation Site Architecture](#documentation-site-architecture)
5. [Core Libraries and Technologies](#core-libraries-and-technologies)
6. [Build System](#build-system)
7. [Testing Strategy](#testing-strategy)
8. [Performance Optimizations](#performance-optimizations)
9. [Security Architecture](#security-architecture)
10. [Development Workflow](#development-workflow)
11. [Deployment Architecture](#deployment-architecture)

## Project Overview

This monorepo contains the **next-unified-query** library and its comprehensive documentation site. The project follows a modern monorepo architecture using pnpm workspaces, optimized for developer experience and production performance.

### Key Design Principles

- **Type Safety First**: Comprehensive TypeScript usage with strict mode
- **Performance Optimized**: Bundle size and runtime performance are primary concerns
- **Developer Experience**: Clean APIs, comprehensive documentation, and helpful tooling
- **Production Ready**: Enterprise-grade security, monitoring, and deployment practices

## Repository Structure

```
/
├── apps/
│   ├── docs/                    # Documentation site (Next.js 15)
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # React components
│   │   │   ├── content/        # MDX documentation content
│   │   │   └── lib/            # Utilities and configurations
│   │   └── public/             # Static assets
│   └── example/                # Example application
│       └── src/                # Example usage patterns
├── packages/
│   ├── next-unified-query/      # Core library package
│   │   ├── src/                # Source code
│   │   ├── test/               # Tests including type safety
│   │   └── dist/               # Built output
│   └── next-unified-query-react/ # React integration package
│       ├── src/                # React hooks and components
│       ├── test/               # React-specific tests
│       └── dist/               # Built output
├── research/                    # Design research and analysis
│   ├── screenshots/            # UI reference materials
│   └── *.md                   # Research documentation
├── .taskmaster/                # Task management system
│   └── tasks/                  # Project tasks and progress
└── scripts/                    # Build and utility scripts
```

## Package Architecture

### Core Package (`next-unified-query`)

The core package provides HTTP client functionality with TypeScript safety:

```typescript
// Core modules
├── client/                     # HTTP client implementation
│   ├── fetch-client.ts        # Fetch wrapper with config
│   └── interceptors.ts        # Request/response interceptors
├── types/                     # TypeScript definitions
│   ├── config.ts              # Configuration types
│   ├── request.ts             # Request types
│   └── response.ts            # Response types
├── factories/                 # Factory pattern implementations
│   ├── query-factory.ts       # Type-safe query definitions
│   └── mutation-factory.ts    # Type-safe mutation definitions
├── utils/                     # Utility functions
│   ├── url.ts                 # URL manipulation
│   ├── errors.ts              # Error handling
│   └── validation.ts          # Schema validation
└── index.ts                   # Main exports
```

### React Package (`next-unified-query-react`)

React integration with optimized hooks and SSR support:

```typescript
// React integration modules
├── hooks/                     # React hooks
│   ├── useQuery.ts           # Query hook (GET/HEAD only)
│   ├── useMutation.ts        # Mutation hook (POST/PUT/DELETE/PATCH)
│   └── useQueryClient.ts     # Client access hook
├── providers/                # React providers
│   ├── QueryClientProvider.tsx
│   └── HydrationBoundary.tsx
├── ssr/                      # Server-side rendering
│   ├── ssrPrefetch.ts       # Data prefetching
│   └── dehydrate.ts         # State serialization
└── index.ts                  # Main exports
```

## Documentation Site Architecture

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with Linear design system
- **Components**: shadcn/ui components
- **Content**: MDX for rich documentation
- **Search**: Algolia DocSearch integration
- **Analytics**: Vercel Analytics

### Component Architecture

```typescript
components/
├── ui/                       # shadcn/ui components (Linear styled)
│   ├── button.tsx
│   ├── dialog.tsx
│   └── ...
├── docs/                     # Documentation-specific components
│   ├── NavigationTree.tsx   # Sidebar navigation
│   ├── TableOfContents.tsx  # Page TOC
│   ├── CodeBlock.tsx        # Syntax highlighting
│   └── SearchDialog.tsx     # Search interface
├── layout/                   # Layout components
│   ├── DocsLayout.tsx       # 3-column documentation layout
│   ├── Header.tsx           # Global header
│   └── Footer.tsx           # Global footer
└── playground/              # Interactive components
    ├── MonacoEditor.tsx     # Code editor
    └── LiveExample.tsx      # Live code execution
```

### State Management

```typescript
// Global state management patterns
hooks/
├── useSearch.ts             # Search state management
├── useNavigation.ts         # Navigation state
├── useTheme.ts              # Theme preferences
└── useActiveHeading.ts      # TOC tracking
```

## Core Libraries and Technologies

### Production Dependencies

- **React 18+**: UI framework
- **Next.js 15**: Full-stack React framework
- **Zod**: Runtime schema validation
- **es-toolkit**: High-performance utilities
- **quick-lru**: Optimized caching

### Development Dependencies

- **TypeScript 5+**: Type safety
- **Vitest**: Testing framework
- **Playwright**: E2E testing
- **ESLint**: Code quality
- **Prettier**: Code formatting

### Documentation Dependencies

- **@next/mdx**: MDX processing
- **shiki**: Syntax highlighting
- **rehype/remark**: Content processing
- **Algolia**: Search functionality

## Build System

### Package Building

```bash
# Build pipeline
pnpm build
├── TypeScript compilation (tsc)
├── Bundle generation (tsup)
├── Type declaration generation
└── Package optimization
```

### Documentation Building

```bash
# Documentation build
pnpm build:docs
├── MDX compilation
├── Static generation
├── Image optimization
├── Search index generation
└── Performance optimization
```

### Build Optimization Features

- Tree shaking for minimal bundle size
- Code splitting for optimal loading
- Image optimization with next/image
- Font optimization with next/font
- CSS purging for minimal styles

## Testing Strategy

### Unit Testing

```typescript
// Vitest configuration
test/
├── unit/                    # Unit tests
│   ├── client.test.ts
│   ├── factories.test.ts
│   └── utils.test.ts
├── integration/             # Integration tests
│   ├── hooks.test.tsx
│   └── ssr.test.tsx
└── type-safety/            # Type-only tests
    ├── query-types.test.ts
    └── mutation-types.test.ts
```

### E2E Testing

```typescript
// Playwright tests
e2e/
├── performance.spec.ts      # Performance testing
├── api-calls.spec.ts        # API integration
├── navigation.spec.ts       # UI navigation
└── search.spec.ts           # Search functionality
```

### Type Safety Testing

```typescript
// Type-only compilation tests
namespace TypeTests {
  // Test query type inference
  declare const query: QueryFetcher;
  query.get('/api');  // ✅ Should work
  
  // @ts-expect-error - POST not allowed
  query.post('/api', {});
}
```

## Performance Optimizations

### Bundle Optimization

- **Code Splitting**: Dynamic imports for heavy components
- **Tree Shaking**: Removes unused code
- **Minification**: Production build optimization
- **Compression**: Brotli/gzip for assets

### Runtime Optimization

- **Selective Subscriptions**: Minimal re-renders
- **Structural Sharing**: Memory efficiency
- **Query Caching**: Intelligent cache management
- **Request Deduplication**: Prevents duplicate requests

### Documentation Site Performance

- **Static Generation**: Pre-rendered pages
- **Image Optimization**: Automatic sizing and formats
- **Font Optimization**: Preloading and subsetting
- **Edge Caching**: CDN optimization

## Security Architecture

### Security Headers

```typescript
// Security configuration
headers: {
  'Content-Security-Policy': "...",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000',
  'Permissions-Policy': "..."
}
```

### Security Features

- **CSRF Protection**: Token validation
- **XSS Prevention**: Content Security Policy
- **HTTPS Enforcement**: SSL/TLS only
- **Input Validation**: Zod schema validation
- **Dependency Scanning**: Automated security updates

## Development Workflow

### Local Development

```bash
# Start development
pnpm dev              # Run all packages
pnpm dev:docs         # Documentation only
pnpm dev:lib          # Library only

# Testing
pnpm test             # Run all tests
pnpm test:types       # Type checking only
pnpm test:e2e         # E2E tests

# Code quality
pnpm lint             # ESLint
pnpm typecheck        # TypeScript
pnpm format           # Prettier
```

### Git Workflow

```bash
# Feature development
git checkout -b feat/feature-name
pnpm test
git commit -m "feat: 기능 구현"

# Documentation updates
git checkout -b docs/update-name
pnpm build:docs
git commit -m "docs: 문서 업데이트"
```

### Task Management

```bash
# Task Master integration
task-master list                    # View all tasks
task-master next                    # Get next task
task-master set-status --id=X --status=done
```

## Deployment Architecture

### Production Deployment

- **Platform**: Vercel
- **Region**: Global Edge Network
- **Caching**: Edge caching with ISR
- **Monitoring**: Vercel Analytics

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
on: [push, pull_request]
jobs:
  - lint
  - typecheck
  - test
  - build
  - deploy (on main branch)
```

### Environment Configuration

```typescript
// Environment variables
NEXT_PUBLIC_API_URL        # API endpoint
NEXT_PUBLIC_ALGOLIA_APP_ID # Search configuration
VERCEL_URL                 # Deployment URL
NODE_ENV                   # Environment mode
```

### Performance Monitoring

- **Core Web Vitals**: Automated tracking
- **Bundle Size**: Size limit enforcement
- **Error Tracking**: Sentry integration (optional)
- **Analytics**: Usage and performance metrics

## Maintenance and Operations

### Regular Tasks

1. **Dependency Updates**: Weekly security patches
2. **Performance Audits**: Monthly Lighthouse runs
3. **Documentation Review**: Quarterly accuracy checks
4. **Security Scanning**: Automated vulnerability detection

### Monitoring Setup

```typescript
// Performance monitoring
- Lighthouse CI for automated testing
- Bundle size tracking
- Runtime performance metrics
- Error rate monitoring
```

### Troubleshooting Guide

Common issues and solutions are documented in:
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [docs/content/troubleshooting](./apps/docs/src/content/docs/troubleshooting)

---

For more detailed information on specific components, refer to the inline documentation and TypeDoc-generated API references.