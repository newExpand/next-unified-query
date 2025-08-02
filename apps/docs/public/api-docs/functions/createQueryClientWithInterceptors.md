[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / createQueryClientWithInterceptors

# Function: createQueryClientWithInterceptors()

> **createQueryClientWithInterceptors**(`options`, `setupInterceptors`): [`QueryClient`](../classes/QueryClient.md)

Defined in: [query/client/query-client-manager.ts:140](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client-manager.ts#L140)

인터셉터 설정을 포함한 QueryClient 생성 헬퍼 함수

## Parameters

### options

`QueryClientOptions`

### setupInterceptors

[`InterceptorSetupFunction`](../type-aliases/InterceptorSetupFunction.md)

## Returns

[`QueryClient`](../classes/QueryClient.md)

## Example

```typescript
import { createQueryClientWithInterceptors } from 'next-type-fetch';

const queryClient = createQueryClientWithInterceptors({
  baseURL: 'https://api.example.com',
}, (fetcher) => {
  // 인터셉터 설정
  fetcher.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${getToken()}`;
    return config;
  });
});
```
