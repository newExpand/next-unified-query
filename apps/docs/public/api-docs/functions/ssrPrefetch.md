[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / ssrPrefetch

# Function: ssrPrefetch()

> **ssrPrefetch**(`queries`, `globalFetchConfig`, `client?`): [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>\>

Defined in: [query/ssr/ssr-prefetch.ts:43](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/ssr/ssr-prefetch.ts#L43)

SSR에서 여러 쿼리를 미리 패칭(prefetch)합니다.

## Parameters

### queries

`QueryItem`[]

QueryItem[] 형태의 쿼리 배열

### globalFetchConfig

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\> = `{}`

모든 쿼리에 공통 적용할 fetchConfig (예: baseURL)

### client?

[`QueryClient`](../classes/QueryClient.md)

선택적 QueryClient 인스턴스 (인터셉터 등을 사용하려면 제공)

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>\>

## Example

```typescript
// 파라미터가 없는 쿼리
await ssrPrefetch([
  [queries.users],
  [queries.posts, { userId: 1 }], // 파라미터가 있는 경우
]);

// 혼합 사용
await ssrPrefetch([
  [queries.users], // 파라미터 없음
  [queries.user, { userId: 1 }], // 파라미터 있음
  [queries.posts, { page: 1, limit: 10 }]
]);

// QueryClient와 함께 사용 (인터셉터 적용)
const queryClient = new QueryClient();
await ssrPrefetch([
  [queries.user, { id: 1 }]
], {}, queryClient);
```
