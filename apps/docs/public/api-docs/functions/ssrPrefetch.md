[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / ssrPrefetch

# Function: ssrPrefetch()

> **ssrPrefetch**(`queries`, `config?`): [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>\>

Defined in: [query/ssr/ssr-prefetch.ts:38](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/ssr/ssr-prefetch.ts#L38)

SSR에서 여러 쿼리를 미리 패칭(prefetch)합니다.

## Parameters

### queries

`QueryItem`[]

QueryItem[] 형태의 쿼리 배열

### config?

[`QueryClientOptions`](../interfaces/QueryClientOptions.md)

QueryClient 설정 (선택사항, 제공되지 않으면 전역 설정 사용)

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>\>

## Example

```typescript
// 기본 사용법 (전역 설정 자동 사용)
await ssrPrefetch([
  [queries.users],
  [queries.posts, { userId: 1 }],
]);

// 설정과 함께 사용 (전역 설정 덮어쓰기)
await ssrPrefetch(
  [...queries],
  {
    baseURL: 'https://api.example.com',
    headers: { 'Authorization': 'Bearer token' }
  }
);
```
