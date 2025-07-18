# Troubleshooting Guide

## Table of Contents

1. [Common Issues](#common-issues)
2. [TypeScript Errors](#typescript-errors)
3. [Build and Compilation Issues](#build-and-compilation-issues)
4. [Runtime Errors](#runtime-errors)
5. [Performance Issues](#performance-issues)
6. [SSR/Hydration Issues](#ssrhydration-issues)
7. [Development Environment](#development-environment)
8. [Debugging Tools](#debugging-tools)
9. [Getting Help](#getting-help)

## Common Issues

### Issue: "Cannot find module 'next-unified-query'"

**Symptoms:**
```
Module not found: Error: Can't resolve 'next-unified-query'
```

**Solutions:**
1. Ensure the package is installed:
   ```bash
   pnpm add next-unified-query
   # or
   npm install next-unified-query
   ```

2. Clear package manager cache:
   ```bash
   pnpm store prune
   # or
   npm cache clean --force
   ```

3. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### Issue: "baseURL is not applied to requests"

**Symptoms:**
- Requests are made to relative URLs instead of the configured baseURL
- 404 errors when making API calls

**Solutions:**
1. Ensure `setDefaultQueryClientOptions` is called before any imports that use the library:
   ```tsx
   // app/layout.tsx or _app.tsx - MUST be at the top
   import { setDefaultQueryClientOptions } from 'next-unified-query';
   
   setDefaultQueryClientOptions({
     baseURL: 'https://api.example.com'
   });
   
   // Then import components that use hooks
   import { ClientProvider } from './client-provider';
   ```

2. Check if you're accidentally overriding the baseURL:
   ```tsx
   // ❌ This overrides the global baseURL
   const { data } = useQuery({
     url: 'https://different-api.com/users'
   });
   
   // ✅ This uses the global baseURL
   const { data } = useQuery({
     url: '/users'
   });
   ```

### Issue: "React hooks errors in server components"

**Symptoms:**
```
Error: useQuery/useMutation can only be used in Client Components
```

**Solutions:**
1. Add the `'use client'` directive:
   ```tsx
   'use client';
   
   import { useQuery } from 'next-unified-query/react';
   
   export function MyComponent() {
     const { data } = useQuery({ url: '/api/data' });
     // ...
   }
   ```

2. For server-side data fetching, use `ssrPrefetch`:
   ```tsx
   // app/page.tsx - Server Component
   import { ssrPrefetch } from 'next-unified-query';
   
   export default async function Page() {
     const dehydratedState = await ssrPrefetch([
       [{ url: '/api/data' }]
     ]);
     // ...
   }
   ```

## TypeScript Errors

### Error: "Type 'POST' is not assignable to useQuery"

**Problem:**
```typescript
// ❌ TypeScript Error
const { data } = useQuery({
  url: '/users',
  method: 'POST' // Error: POST not allowed in useQuery
});
```

**Solution:**
Use `useMutation` for POST/PUT/DELETE/PATCH requests:
```typescript
// ✅ Correct usage
const mutation = useMutation({
  url: '/users',
  method: 'POST'
});
```

### Error: "Property does not exist on type 'unknown'"

**Problem:**
```typescript
const { data } = useQuery({ url: '/users' });
console.log(data.name); // Error: Property 'name' does not exist
```

**Solution:**
Add schema validation or type annotations:
```typescript
// Option 1: Using Zod schema
import { z } from 'next-unified-query';

const userSchema = z.object({
  id: z.number(),
  name: z.string()
});

const { data } = useQuery({
  url: '/users',
  schema: userSchema
});
console.log(data?.name); // ✅ Type-safe

// Option 2: Type annotation
interface User {
  id: number;
  name: string;
}

const { data } = useQuery<User>({
  url: '/users'
});
```

### Error: "Generic type 'QueryFactory' requires type arguments"

**Problem:**
```typescript
// ❌ Missing type parameters
const factory: QueryFactory = { /* ... */ };
```

**Solution:**
Use the factory creation functions:
```typescript
// ✅ Correct usage
import { createQueryFactory } from 'next-unified-query';

const userQueries = createQueryFactory({
  list: {
    cacheKey: () => ['users'],
    url: () => '/users',
    schema: z.array(userSchema)
  }
});
```

## Build and Compilation Issues

### Issue: "Module parse failed: Unexpected token"

**Symptoms:**
- Build fails with syntax errors
- Webpack/Next.js compilation errors

**Solutions:**
1. Check your Next.js configuration supports the features:
   ```javascript
   // next.config.js
   module.exports = {
     experimental: {
       // Enable if using app directory
       appDir: true
     },
     transpilePackages: ['next-unified-query']
   };
   ```

2. Ensure TypeScript is properly configured:
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "target": "ES2015",
       "module": "ESNext",
       "moduleResolution": "node",
       "jsx": "preserve",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true
     }
   }
   ```

### Issue: "Cannot use import statement outside a module"

**Solutions:**
1. For Jest tests, update jest.config.js:
   ```javascript
   module.exports = {
     transform: {
       '^.+\\.(t|j)sx?$': ['@swc/jest']
     },
     transformIgnorePatterns: [
       'node_modules/(?!(next-unified-query)/)'
     ]
   };
   ```

2. For Node.js scripts, use proper module settings:
   ```json
   // package.json
   {
     "type": "module"
   }
   ```

## Runtime Errors

### Error: "Network request failed"

**Symptoms:**
- Requests fail immediately
- CORS errors in console
- Connection refused errors

**Solutions:**
1. Check CORS configuration on your API:
   ```typescript
   // If you control the API, ensure CORS headers are set
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
   ```

2. Use proxy in development:
   ```javascript
   // next.config.js
   module.exports = {
     async rewrites() {
       return [
         {
           source: '/api/:path*',
           destination: 'https://api.example.com/:path*'
         }
       ];
     }
   };
   ```

3. Check network connectivity and API status

### Error: "Maximum call stack size exceeded"

**Symptoms:**
- Infinite loops in queries
- Browser freezing

**Solutions:**
1. Check for circular dependencies in query keys:
   ```typescript
   // ❌ Causes infinite loop
   const { data: user } = useQuery({
     cacheKey: [user], // Circular reference
     url: '/user'
   });
   
   // ✅ Correct
   const { data: user } = useQuery({
     cacheKey: ['user'],
     url: '/user'
   });
   ```

2. Ensure stable query keys:
   ```typescript
   // ❌ Creates new array on each render
   const { data } = useQuery({
     cacheKey: ['users', { filters }],
     url: '/users'
   });
   
   // ✅ Use useMemo for stable reference
   const cacheKey = useMemo(
     () => ['users', filters],
     [filters]
   );
   
   const { data } = useQuery({
     cacheKey,
     url: '/users'
   });
   ```

## Performance Issues

### Issue: "Too many re-renders"

**Symptoms:**
- Component re-renders on every state change
- Performance degradation
- React DevTools shows excessive renders

**Solutions:**
1. Use `select` to minimize re-renders:
   ```typescript
   // ❌ Re-renders on any data change
   const { data } = useQuery({ url: '/user' });
   const userName = data?.name;
   
   // ✅ Only re-renders when name changes
   const { data: userName } = useQuery({
     url: '/user',
     select: (data) => data.name
   });
   ```

2. Memoize computed values:
   ```typescript
   const { data } = useQuery({ url: '/users' });
   
   // ✅ Memoize expensive computations
   const sortedUsers = useMemo(
     () => data?.sort((a, b) => a.name.localeCompare(b.name)),
     [data]
   );
   ```

### Issue: "Bundle size too large"

**Solutions:**
1. Use dynamic imports for heavy features:
   ```typescript
   // Dynamic import for code splitting
   const MonacoEditor = dynamic(
     () => import('@monaco-editor/react'),
     { ssr: false }
   );
   ```

2. Import only what you need:
   ```typescript
   // ❌ Imports entire library
   import * as queries from 'next-unified-query';
   
   // ✅ Import specific functions
   import { useQuery, useMutation } from 'next-unified-query/react';
   ```

## SSR/Hydration Issues

### Issue: "Hydration mismatch"

**Symptoms:**
```
Warning: Text content did not match. Server: "..." Client: "..."
```

**Solutions:**
1. Ensure consistent data between server and client:
   ```tsx
   // app/page.tsx
   export default async function Page() {
     const dehydratedState = await ssrPrefetch([
       [{ url: '/api/data', cacheKey: ['data'] }]
     ]);
     
     return (
       <HydrationBoundary state={dehydratedState}>
         <ClientComponent />
       </HydrationBoundary>
     );
   }
   ```

2. Use `suppressHydrationWarning` for dynamic content:
   ```tsx
   <time suppressHydrationWarning>
     {new Date().toLocaleString()}
   </time>
   ```

### Issue: "Window is not defined"

**Solutions:**
1. Check for browser environment:
   ```typescript
   if (typeof window !== 'undefined') {
     // Browser-only code
   }
   ```

2. Use dynamic imports with SSR disabled:
   ```typescript
   const BrowserOnlyComponent = dynamic(
     () => import('./BrowserOnlyComponent'),
     { ssr: false }
   );
   ```

## Development Environment

### Issue: "Port already in use"

**Solutions:**
1. Kill the process using the port:
   ```bash
   # Find process
   lsof -ti:3000
   
   # Kill process
   kill -9 $(lsof -ti:3000)
   ```

2. Use a different port:
   ```bash
   PORT=3001 pnpm dev
   ```

### Issue: "pnpm: command not found"

**Solutions:**
1. Install pnpm:
   ```bash
   npm install -g pnpm
   # or
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   ```

2. Use npm or yarn equivalents:
   ```bash
   npm install
   npm run dev
   ```

## Debugging Tools

### Browser DevTools

1. **Network Tab**: Monitor API requests
   - Check request URLs and headers
   - Verify response data
   - Monitor request timing

2. **Console**: Check for errors
   ```typescript
   // Add debug logging
   const { data, error } = useQuery({
     url: '/api/data',
     onError: (error) => console.error('Query error:', error),
     onSuccess: (data) => console.log('Query success:', data)
   });
   ```

3. **React DevTools**: Inspect component state
   - Install React DevTools extension
   - Check query states and cache

### Query Debugging

```typescript
// Enable query logging
import { setDefaultQueryClientOptions } from 'next-unified-query';

setDefaultQueryClientOptions({
  defaultOptions: {
    queries: {
      logger: {
        log: console.log,
        warn: console.warn,
        error: console.error
      }
    }
  }
});
```

### Performance Profiling

```typescript
// Use React Profiler
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

<Profiler id="QueryComponent" onRender={onRenderCallback}>
  <YourComponent />
</Profiler>
```

## Getting Help

### Before Asking for Help

1. **Check the documentation**:
   - [API Reference](./API.md)
   - [User Guide](./USER_GUIDE.md)
   - [Examples](./apps/example)

2. **Search existing issues**:
   - [GitHub Issues](https://github.com/newExpand/next-unified-query/issues)

3. **Create a minimal reproduction**:
   - Use [CodeSandbox](https://codesandbox.io) or [StackBlitz](https://stackblitz.com)
   - Include only necessary code
   - Clearly describe the issue

### How to Report Issues

1. **Use the issue template**:
   ```markdown
   ## Description
   Clear description of the issue
   
   ## Steps to Reproduce
   1. Step one
   2. Step two
   3. ...
   
   ## Expected Behavior
   What should happen
   
   ## Actual Behavior
   What actually happens
   
   ## Environment
   - next-unified-query version: X.X.X
   - Next.js version: X.X.X
   - Node.js version: X.X.X
   - Browser: Chrome/Firefox/Safari
   ```

2. **Include error messages**:
   - Full error stack traces
   - Console warnings
   - Network request/response details

3. **Provide code examples**:
   ```typescript
   // Minimal code that reproduces the issue
   ```

### Community Support

- **GitHub Discussions**: Ask questions and share ideas
- **Stack Overflow**: Tag with `next-unified-query`
- **Twitter**: Mention @newExpand for quick questions

### Emergency Support

For critical production issues:
1. Check [GitHub Issues](https://github.com/newExpand/next-unified-query/issues) for similar problems
2. Create a high-priority issue with `[URGENT]` prefix
3. Include impact assessment and temporary workarounds tried

---

Remember: Most issues have been encountered before. Search first, then ask with context!