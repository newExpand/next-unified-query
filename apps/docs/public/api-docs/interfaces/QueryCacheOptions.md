[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / QueryCacheOptions

# Interface: QueryCacheOptions

Defined in: [query/cache/query-cache.ts:36](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/cache/query-cache.ts#L36)

QueryCache 옵션

## Properties

### maxQueries?

> `optional` **maxQueries**: `number`

Defined in: [query/cache/query-cache.ts:43](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/cache/query-cache.ts#L43)

메모리 보호를 위한 최대 쿼리 수 (하드 리미트)
이 수를 초과하면 LRU(Least Recently Used) 알고리즘으로 가장 오래된 쿼리부터 즉시 제거됩니다.
gcTime과는 별개로 동작하며, 메모리 사용량을 제한하는 안전장치 역할을 합니다.

#### Default

```ts
1000
```
