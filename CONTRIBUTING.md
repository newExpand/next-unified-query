# Contributing Guide

Thank you for your interest in contributing to next-unified-query! This guide will help you get started with contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Code Style Guide](#code-style-guide)
5. [Best Practices](#best-practices)
6. [Testing Guidelines](#testing-guidelines)
7. [Commit Guidelines](#commit-guidelines)
8. [Pull Request Process](#pull-request-process)
9. [Project Structure](#project-structure)
10. [Documentation](#documentation)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a branch** for your feature or fix
4. **Make your changes** following our guidelines
5. **Test your changes** thoroughly
6. **Submit a pull request** with a clear description

## Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Git

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/next-unified-query.git
cd next-unified-query

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests to verify setup
pnpm test
```

### Development Commands

```bash
# Start development mode
pnpm dev              # Run all packages in dev mode
pnpm dev:lib          # Library only
pnpm dev:docs         # Documentation only

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:types       # Type checking
pnpm test:e2e         # E2E tests

# Code quality
pnpm lint             # ESLint
pnpm typecheck        # TypeScript checking
pnpm format           # Prettier formatting
```

## Code Style Guide

### TypeScript Guidelines

#### 1. Type Safety First

```typescript
// ✅ Good: Explicit types
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): Promise<User> {
  return fetch(`/users/${id}`).then(res => res.json());
}

// ❌ Bad: Using any
function getUser(id: any): Promise<any> {
  return fetch(`/users/${id}`).then(res => res.json());
}
```

#### 2. Use Type Inference When Appropriate

```typescript
// ✅ Good: Let TypeScript infer when obvious
const users = ['Alice', 'Bob', 'Charlie'];
const count = users.length;

// ❌ Bad: Unnecessary type annotations
const users: string[] = ['Alice', 'Bob', 'Charlie'];
const count: number = users.length;
```

#### 3. Prefer Interfaces Over Type Aliases for Objects

```typescript
// ✅ Good: Interface for object shapes
interface QueryOptions {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
}

// ❌ Bad: Type alias for object (unless needed for unions/intersections)
type QueryOptions = {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
};
```

#### 4. Use Const Assertions for Literals

```typescript
// ✅ Good: Const assertion for literal types
const config = {
  method: 'GET',
  cache: 'no-cache'
} as const;

// Also good for arrays
const methods = ['GET', 'POST', 'PUT', 'DELETE'] as const;
type Method = typeof methods[number];
```

### React Guidelines

#### 1. Functional Components with TypeScript

```typescript
// ✅ Good: Typed functional component
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ❌ Bad: Using React.FC (deprecated pattern)
export const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
  // ...
};
```

#### 2. Custom Hooks

```typescript
// ✅ Good: Well-typed custom hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

#### 3. Event Handlers

```typescript
// ✅ Good: Properly typed event handlers
function SearchInput() {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
    </form>
  );
}
```

### General JavaScript/TypeScript

#### 1. Use Modern ES Features

```typescript
// ✅ Good: Modern syntax
const processUsers = (users: User[]) => {
  return users
    .filter(user => user.active)
    .map(({ id, name }) => ({ id, name }));
};

// ✅ Good: Optional chaining and nullish coalescing
const email = user?.profile?.email ?? 'no-email@example.com';
```

#### 2. Error Handling

```typescript
// ✅ Good: Proper error handling
class QueryError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'QueryError';
  }
}

async function fetchData(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new QueryError(
        `Request failed: ${response.statusText}`,
        response.status
      );
    }
    return response.json();
  } catch (error) {
    if (error instanceof QueryError) {
      // Handle known errors
      console.error(`Query error: ${error.message}`);
    } else {
      // Handle unknown errors
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

#### 3. Async/Await Over Promises

```typescript
// ✅ Good: Async/await for clarity
async function getUserData(userId: number) {
  const user = await getUser(userId);
  const posts = await getUserPosts(userId);
  return { user, posts };
}

// ❌ Bad: Promise chains (unless necessary)
function getUserData(userId: number) {
  return getUser(userId)
    .then(user => {
      return getUserPosts(userId)
        .then(posts => ({ user, posts }));
    });
}
```

## Best Practices

### 1. Component Organization

```typescript
// ✅ Good: Clear organization
// components/Button/Button.tsx
export interface ButtonProps {
  // Props definition
}

export function Button(props: ButtonProps) {
  // Component logic
}

// components/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

### 2. State Management

```typescript
// ✅ Good: Minimal state, derived values
function UserList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: users } = useQuery({ url: '/users' });
  
  // Derived state instead of separate state
  const filteredUsers = useMemo(
    () => users?.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [users, searchTerm]
  );
  
  return (
    <>
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {filteredUsers?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </>
  );
}
```

### 3. Performance Optimization

```typescript
// ✅ Good: Optimized re-renders
function ExpensiveComponent({ data, id }: Props) {
  // Memoize expensive computations
  const processedData = useMemo(
    () => expensiveProcessing(data),
    [data]
  );
  
  // Stable callbacks
  const handleClick = useCallback(
    () => {
      doSomething(id);
    },
    [id]
  );
  
  return <div onClick={handleClick}>{processedData}</div>;
}
```

### 4. API Design

```typescript
// ✅ Good: Consistent, predictable API
interface QueryOptions<T> {
  url: string;
  method?: 'GET' | 'HEAD';
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  schema?: ZodSchema<T>;
  select?: (data: T) => unknown;
}

// Overloaded for better DX
function useQuery<T>(options: QueryOptions<T>): QueryResult<T>;
function useQuery<T>(
  factory: QueryFactory<T>,
  params?: FactoryParams
): QueryResult<T>;
```

## Testing Guidelines

### 1. Unit Tests

```typescript
// ✅ Good: Comprehensive unit test
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQuery } from '../src';

describe('useQuery', () => {
  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test User' };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const { result } = renderHook(() =>
      useQuery({ url: '/users/1' })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockData);
    });
  });

  it('should handle errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() =>
      useQuery({ url: '/users/1' })
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
});
```

### 2. Type Tests

```typescript
// ✅ Good: Type-level tests
// test/type-safety/query-types.test.ts
namespace TypeTests {
  // Test: useQuery only accepts GET/HEAD
  const query = {} as QueryFetcher;
  
  // These should compile
  query.get('/api');
  query.head('/api');
  
  // @ts-expect-error - POST not allowed
  query.post('/api', {});
  
  // @ts-expect-error - PUT not allowed
  query.put('/api', {});
}
```

### 3. Integration Tests

```typescript
// ✅ Good: Real-world scenario testing
describe('Factory Pattern Integration', () => {
  it('should infer types correctly', async () => {
    const userFactory = createQueryFactory({
      get: {
        cacheKey: (id: number) => ['user', id],
        url: (id: number) => `/users/${id}`,
        schema: userSchema
      }
    });

    const { result } = renderHook(() =>
      useQuery(userFactory.get, { params: 1 })
    );

    await waitFor(() => {
      expect(result.current.data).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String)
      });
    });
  });
});
```

## Commit Guidelines

We follow Conventional Commits specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
# Feature
feat(query): add retry logic for failed requests

# Bug fix
fix(types): correct TypeScript inference for factory pattern

# Documentation
docs(api): update useQuery examples with new syntax

# Performance
perf(cache): optimize memory usage in query cache

# Multiple changes
refactor(core): simplify HTTP client implementation

- Remove redundant error handling
- Consolidate request/response interceptors
- Update types for better inference
```

### Commit Message Guidelines

1. Use present tense: "add feature" not "added feature"
2. Use imperative mood: "fix bug" not "fixes bug"
3. First line should be 72 characters or less
4. Reference issues and PRs in the footer

## Pull Request Process

### 1. Before Submitting

- [ ] Run `pnpm test` - all tests pass
- [ ] Run `pnpm lint` - no linting errors
- [ ] Run `pnpm typecheck` - no TypeScript errors
- [ ] Run `pnpm build` - builds successfully
- [ ] Update documentation if needed
- [ ] Add tests for new functionality
- [ ] Update CHANGELOG.md if applicable

### 2. PR Title Format

Follow the same convention as commits:
```
feat(query): add retry logic for failed requests
```

### 3. PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
```

### 4. Review Process

1. Automated checks must pass
2. At least one maintainer review required
3. All feedback addressed
4. Squash and merge when approved

## Project Structure

```
next-unified-query/
├── packages/
│   ├── next-unified-query/        # Core library
│   │   ├── src/
│   │   │   ├── client/           # HTTP client
│   │   │   ├── types/            # TypeScript types
│   │   │   ├── factories/        # Factory functions
│   │   │   └── utils/            # Utilities
│   │   └── test/
│   └── next-unified-query-react/  # React integration
│       ├── src/
│       │   ├── hooks/            # React hooks
│       │   ├── providers/        # Context providers
│       │   └── ssr/              # SSR utilities
│       └── test/
├── apps/
│   ├── docs/                     # Documentation site
│   └── example/                  # Example app
└── scripts/                      # Build scripts
```

## Documentation

### Adding Documentation

1. **API Documentation**: Update JSDoc comments in source files
2. **User Guide**: Edit `USER_GUIDE.md` for usage examples
3. **API Reference**: Update `API.md` for API changes
4. **Examples**: Add to `apps/example` for new features

### Documentation Style

```typescript
/**
 * Fetches data using a type-safe query.
 * 
 * @template T - The expected response data type
 * @param options - Query configuration options
 * @returns Query result with data, error, and loading states
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useQuery({
 *   url: '/api/users',
 *   schema: userSchema
 * });
 * ```
 */
export function useQuery<T>(options: QueryOptions<T>): QueryResult<T> {
  // Implementation
}
```

## Questions?

- Check existing [issues](https://github.com/newExpand/next-unified-query/issues)
- Start a [discussion](https://github.com/newExpand/next-unified-query/discussions)
- Review the [documentation](./README.md)

Thank you for contributing to next-unified-query! 🎉