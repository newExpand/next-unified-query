[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / QueryObserverResult

# Interface: QueryObserverResult\<T, E\>

Defined in: [query/observer/types.ts:62](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/types.ts#L62)

## Type Parameters

### T

`T` = `unknown`

### E

`E` = `unknown`

## Properties

### data?

> `optional` **data**: `T`

Defined in: [query/observer/types.ts:63](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/types.ts#L63)

***

### error?

> `optional` **error**: `E`

Defined in: [query/observer/types.ts:64](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/types.ts#L64)

***

### isLoading

> **isLoading**: `boolean`

Defined in: [query/observer/types.ts:65](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/types.ts#L65)

***

### isFetching

> **isFetching**: `boolean`

Defined in: [query/observer/types.ts:66](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/types.ts#L66)

***

### isError

> **isError**: `boolean`

Defined in: [query/observer/types.ts:67](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/types.ts#L67)

***

### isSuccess

> **isSuccess**: `boolean`

Defined in: [query/observer/types.ts:68](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/types.ts#L68)

***

### isStale

> **isStale**: `boolean`

Defined in: [query/observer/types.ts:69](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/types.ts#L69)

***

### isPlaceholderData

> **isPlaceholderData**: `boolean`

Defined in: [query/observer/types.ts:70](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/types.ts#L70)

***

### refetch()

> **refetch**: () => `void`

Defined in: [query/observer/types.ts:71](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/types.ts#L71)

#### Returns

`void`
