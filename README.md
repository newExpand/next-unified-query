# next-type-fetch

A type-safe HTTP client that combines the advantages of fetch and axios for Next.js.

[한국어 문서 (Korean Documentation)](https://github.com/newExpand/next-type-fetch/blob/main/README-KR.md)

[Changelog](https://github.com/newExpand/next-type-fetch/blob/main/CHANGELOG.md)

## Features

- Full type safety written in TypeScript
- Perfect compatibility with Next.js App Router
- Familiar API similar to Axios
- Interceptor support (request, response, error)
- Response data validation using Zod
- Request cancellation capability
- Automatic retry functionality
- 401 Unauthorized auto-retry (authRetry option)
- Support for various response types (JSON, Text, Blob, ArrayBuffer, Raw)
- Timeout settings
- Base URL configuration

## Installation

```bash
npm install next-type-fetch
# or
yarn add next-type-fetch
# or
pnpm add next-type-fetch
```

## Basic Usage

```typescript
import { createFetch } from 'next-type-fetch';

// Create a fetch instance
const fetch = createFetch({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// GET request
const getUsers = async () => {
  const response = await fetch.get('/users');
  return response.data; // Type-safe response data
};

// POST request
const createUser = async (userData) => {
  const response = await fetch.post('/users', userData);
  return response.data;
};

// Using interceptors
fetch.interceptors.request.use((config) => {
  // Modify settings before request
  config.headers = {
    ...config.headers,
    'Authorization': `Bearer ${getToken()}`
  };
  return config;
});

fetch.interceptors.response.use((response) => {
  // Process response data
  return response;
});

fetch.interceptors.error.use((error) => {
  // Handle errors
  console.error('API Error:', error);
  return Promise.reject(error);
});
```

## Data Validation with Zod

```typescript
import { z } from 'zod';
import { createFetch } from 'next-type-fetch';

const fetch = createFetch();

// Define user schema
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

// Request with schema
const getUser = async (id: number) => {
  const response = await fetch.get(`/users/${id}`, {
    schema: UserSchema
  });
  
  // response.data is automatically inferred as UserSchema type
  return response.data;
};
```

## Integration with Next.js App Router

```typescript
// app/users/page.tsx
import { createFetch } from 'next-type-fetch';

const fetch = createFetch({
  baseURL: 'https://api.example.com'
});

export default async function UsersPage() {
  // Use Next.js automatic caching and revalidation
  const response = await fetch.get('/users', {
    next: {
      revalidate: 60, // Revalidate every 60 seconds
      tags: ['users'] // Tag-based revalidation
    }
  });
  
  const users = response.data;
  
  return (
    <div>
      <h1>User List</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Cancelling Requests

```typescript
import { createFetch } from 'next-type-fetch';

const fetch = createFetch();

const fetchData = async () => {
  // Return a cancellable promise
  const promise = fetch.get('/data');
  
  // Example 1: Timeout-based cancellation
  const timeoutId = setTimeout(() => {
    console.log('Request is taking too long, cancelling');
    promise.cancel();
  }, 5000); // Cancel after 5 seconds
  
  try {
    const response = await promise;
    // Clear timeout on success
    clearTimeout(timeoutId);
    return response.data;
  } catch (error) {
    if (error.code === 'CANCELED') {
      console.log('Request was canceled');
      // Handle cancellation
      return { canceled: true };
    }
    throw error;
  }
};

// Example 2: Cancellation based on user interaction
const searchUsers = async (searchTerm) => {
  // Cancel previous request if exists
  if (previousRequest) {
    previousRequest.cancel();
  }
  
  // Store new request
  const request = fetch.get(`/users/search?q=${searchTerm}`);
  previousRequest = request;
  
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    if (error.code === 'CANCELED') {
      // Ignore canceled requests
      return null;
    }
    throw error;
  }
};

// Example 3: Using AbortController
const fetchWithExternalCancel = async () => {
  const controller = new AbortController();
  
  // Connect event listener to external cancel button
  document.getElementById('cancelButton').addEventListener('click', () => {
    controller.abort();
  });
  
  try {
    const response = await fetch.get('/long-operation', {
      signal: controller.signal
    });
    return response.data;
  } catch (error) {
    if (error.code === 'CANCELED') {
      console.log('User canceled the request');
    }
    throw error;
  }
};
```

## 401 Unauthorized Auto-Retry (authRetry Option)

In real-world applications, when an access token expires, it is common to use a refresh token to obtain a new access token. The following example demonstrates a refresh token-based authentication flow.

```typescript
import { createFetch } from 'next-type-fetch';

let accessToken = 'expired-access-token';
let refreshToken = 'valid-refresh-token';

const fetch = createFetch({
  baseURL: 'https://api.example.com',
  authRetry: {
    limit: 2, // Maximum retry count (default: 1)
    // statusCodes: [401, 419, 440], // (Optional) Retry on custom status codes
    // shouldRetry: (error, config) => true, // (Optional) Custom retry condition
    handler: async (error, config) => {
      // Attempt to refresh the access token using the refresh token
      const newToken = await tryRefreshToken(refreshToken);
      if (newToken) {
        accessToken = newToken;
        return true; // Allow retry
      }
      // If the refresh token is also expired/invalid
      return false; // Stop retrying
    },
  },
});

fetch.interceptors.request.use((config) => ({
  ...config,
  headers: {
    ...config.headers,
    'Authorization': `Bearer ${accessToken}`,
  },
}));
```
- When the access token is expired and a 401 error occurs, the handler is called.
- If the access token is successfully refreshed using the refresh token, the request is retried.
- If the refresh token is also expired or invalid, no further retries are attempted.
- You can use `statusCodes` to specify which HTTP status codes should trigger retry (e.g., `[401, 419, 440]`).
- You can use `shouldRetry` for custom retry logic (e.g., only retry if error message contains 'Token expired').

### Advanced authRetry Example

```typescript
const fetch = createFetch({
  baseURL: 'https://api.example.com',
  authRetry: {
    limit: 2,
    statusCodes: [401, 401004, 419], // Retry on multiple or custom status codes
    shouldRetry: (error, config) => {
      // Only retry if error message contains 'Token expired'
      return error.message.includes('Token expired');
    },
    handler: async (error, config) => {
      // Custom token refresh logic
      // ...
      return true;
    },
  },
});
```

### API Reference (authRetry)

- `limit?: number` - Maximum retry count (default: 1)
- `statusCodes?: number[]` - HTTP status codes to trigger retry (default: [401], supports custom codes)
- `shouldRetry?: (error, config) => boolean` - Custom retry condition (must return true to allow handler execution)
- `handler: (error, config) => Promise<boolean>` - Async function to perform token refresh or other logic. Return true to retry, false to stop.

## API Reference

### createFetch(config)

Creates a fetch client instance.

```typescript
const fetch = createFetch({
  baseURL: string,          // Base URL
  timeout: number,          // Request timeout (ms)
  headers: object,          // Default headers
  params: object,           // Default query parameters
  retry: number | object,   // Automatic retry settings
  responseType: enum,       // Response type (json, text, blob, etc.)
  contentType: enum,        // Request content type
  schema: z.ZodType,        // Response data validation schema
  next: object,             // Next.js settings (revalidate, tags, etc.)
  authRetry: {             // 401 Unauthorized auto-retry option
    limit?: number;        // Maximum retry count (default: 1)
    handler: (error, config) => Promise<boolean>; // Token refresh logic
  }
});
```

### Request Methods

- `fetch.request(config)`: Basic request method
- `fetch.get(url, config)`: GET request
- `fetch.post(url, data, config)`: POST request
- `fetch.put(url, data, config)`: PUT request
- `fetch.patch(url, data, config)`: PATCH request
- `fetch.delete(url, config)`: DELETE request
- `fetch.head(url, config)`: HEAD request
- `fetch.options(url, config)`: OPTIONS request

### Interceptors

- `fetch.interceptors.request.use(interceptor)`: Add request interceptor
- `fetch.interceptors.response.use(interceptor)`: Add response interceptor
- `fetch.interceptors.error.use(interceptor)`: Add error interceptor

## Using the Default Instance

You can use this library directly without creating an instance, similar to Axios.

```typescript
// Using the default instance
import { get, post, put, patch, del, head, options, request } from 'next-type-fetch';

// GET request
const getUsers = async () => {
  const response = await get('/users');
  return response.data;
};

// POST request
const createUser = async (userData) => {
  const response = await post('/users', userData);
  return response.data;
};

// Changing default settings
import { ntFetch } from 'next-type-fetch';

ntFetch.baseURL = 'https://api.example.com';
ntFetch.timeout = 5000;
ntFetch.headers = {
  'Content-Type': 'application/json',
};

// Setting global interceptors
import { interceptors } from 'next-type-fetch';

interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    'Authorization': `Bearer ${getToken()}`
  };
  return config;
});

// Using the default instance itself (access to all methods)
import fetch from 'next-type-fetch';

const response = await fetch.get('/users');
```

## License

MIT

## React 훅 테스트 환경

- React 훅/상태관리 로직은 Next.js 없이도 `vitest`로 테스트됩니다.
- 예시: `pnpm test`
- 환경: jsdom, @vitest/react, @testing-library/react-hooks 사용
