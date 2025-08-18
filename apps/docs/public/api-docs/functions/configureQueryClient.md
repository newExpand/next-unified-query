[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / configureQueryClient

# Function: configureQueryClient()

> **configureQueryClient**(`options`): `void`

Defined in: [query/client/query-client-manager.ts:30](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client-manager.ts#L30)

QueryClient의 전역 설정을 구성합니다.
SSR과 클라이언트 환경 모두에서 일관된 설정을 보장합니다.

## Parameters

### options

[`QueryClientOptions`](../interfaces/QueryClientOptions.md)

QueryClient 설정

## Returns

`void`

## Example

```typescript
// app/layout.tsx (Next.js App Router)
import { configureQueryClient } from 'next-unified-query';
import { queryConfig } from './query-config';

// SSR과 클라이언트 모두에서 사용할 전역 설정
configureQueryClient(queryConfig);
```
