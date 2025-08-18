[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / QueryClient

# Class: QueryClient

Defined in: [query/client/query-client.ts:98](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L98)

QueryClient 클래스 - 쿼리와 캐시 관리의 중심

이 클래스는 다음과 같은 고급 사용 케이스에서 직접 사용할 수 있습니다:
- SSR/SSG에서 서버 사이드 데이터 prefetch
- 복잡한 캐시 조작이 필요한 경우
- React 외부에서 쿼리 시스템 사용

일반적인 React 컴포넌트에서는 useQuery, useMutation hooks를 사용하세요.

## Example

```tsx
// ✅ SSR에서 사용
const queryClient = new QueryClient();
await queryClient.prefetchQuery({ cacheKey: ['users'], url: '/users' });

// ✅ 캐시 직접 조작
queryClient.setQueryData(['user', 1], userData);

// ✅ React 컴포넌트에서는 hooks 사용
const { data } = useQuery({ cacheKey: ['users'], url: '/users' });
```

## Constructors

### Constructor

> **new QueryClient**(`options?`): `QueryClient`

Defined in: [query/client/query-client.ts:103](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L103)

#### Parameters

##### options?

[`QueryClientOptions`](../interfaces/QueryClientOptions.md)

#### Returns

`QueryClient`

## Methods

### has()

> **has**(`key`): `boolean`

Defined in: [query/client/query-client.ts:154](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L154)

#### Parameters

##### key

`string` | readonly `unknown`[]

#### Returns

`boolean`

***

### getFetcher()

> **getFetcher**(): [`NextTypeFetch`](../interfaces/NextTypeFetch.md)

Defined in: [query/client/query-client.ts:158](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L158)

#### Returns

[`NextTypeFetch`](../interfaces/NextTypeFetch.md)

***

### getDefaultOptions()

> **getDefaultOptions**(): `undefined` \| \{ `queries?`: \{ `throwOnError?`: `boolean` \| (`error`) => `boolean`; `suspense?`: `boolean`; `staleTime?`: `number`; `gcTime?`: `number`; \}; `mutations?`: \{ `throwOnError?`: `boolean` \| (`error`) => `boolean`; \}; \}

Defined in: [query/client/query-client.ts:165](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L165)

기본 옵션 반환

#### Returns

`undefined` \| \{ `queries?`: \{ `throwOnError?`: `boolean` \| (`error`) => `boolean`; `suspense?`: `boolean`; `staleTime?`: `number`; `gcTime?`: `number`; \}; `mutations?`: \{ `throwOnError?`: `boolean` \| (`error`) => `boolean`; \}; \}

***

### get()

> **get**\<`T`\>(`key`): `undefined` \| [`QueryState`](../type-aliases/QueryState.md)\<`T`\>

Defined in: [query/client/query-client.ts:172](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L172)

쿼리 상태 조회

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### key

`string` | readonly `unknown`[]

#### Returns

`undefined` \| [`QueryState`](../type-aliases/QueryState.md)\<`T`\>

***

### set()

> **set**(`key`, `state`): `void`

Defined in: [query/client/query-client.ts:179](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L179)

쿼리 상태 저장

#### Parameters

##### key

`string` | readonly `unknown`[]

##### state

[`QueryState`](../type-aliases/QueryState.md)

#### Returns

`void`

***

### setQueryData()

> **setQueryData**\<`T`\>(`key`, `updater`): `void`

Defined in: [query/client/query-client.ts:187](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L187)

쿼리 데이터만 업데이트 (optimistic update에 최적화)
기존 상태(isLoading, isFetching, error)를 유지하면서 data와 updatedAt만 업데이트

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### key

`string` | readonly `unknown`[]

##### updater

`T` | (`oldData`) => `undefined` \| `T`

#### Returns

`void`

***

### delete()

> **delete**(`key`): `void`

Defined in: [query/client/query-client.ts:211](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L211)

쿼리 상태 삭제

#### Parameters

##### key

`string` | readonly `unknown`[]

#### Returns

`void`

***

### getAll()

> **getAll**(): [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`QueryState`](../type-aliases/QueryState.md)\>

Defined in: [query/client/query-client.ts:218](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L218)

모든 쿼리 상태 반환

#### Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`QueryState`](../type-aliases/QueryState.md)\>

***

### clear()

> **clear**(): `void`

Defined in: [query/client/query-client.ts:225](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L225)

모든 쿼리 상태 초기화

#### Returns

`void`

***

### invalidateQueries()

> **invalidateQueries**(`prefix`): `void`

Defined in: [query/client/query-client.ts:233](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L233)

특정 쿼리키(혹은 prefix)로 시작하는 모든 쿼리 캐시를 무효화(삭제)
예: invalidateQueries(['user']) → ['user', ...]로 시작하는 모든 캐시 삭제

#### Parameters

##### prefix

`string` | readonly `unknown`[]

#### Returns

`void`

***

### subscribeListener()

> **subscribeListener**(`key`, `listener`): () => `void`

Defined in: [query/client/query-client.ts:266](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L266)

구독자 관리 (public)

#### Parameters

##### key

`string` | readonly `unknown`[]

##### listener

() => `void`

#### Returns

> (): `void`

##### Returns

`void`

***

### subscribe()

> **subscribe**(`key`): `void`

Defined in: [query/client/query-client.ts:269](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L269)

#### Parameters

##### key

`string` | readonly `unknown`[]

#### Returns

`void`

***

### unsubscribe()

> **unsubscribe**(`key`, `gcTime`): `void`

Defined in: [query/client/query-client.ts:272](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L272)

#### Parameters

##### key

`string` | readonly `unknown`[]

##### gcTime

`number`

#### Returns

`void`

***

### prefetchQuery()

#### Call Signature

> **prefetchQuery**\<`T`\>(`key`, `fetchFn`): [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`T`\>

Defined in: [query/client/query-client.ts:277](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L277)

##### Type Parameters

###### T

`T` = `unknown`

##### Parameters

###### key

`string` | readonly `unknown`[]

###### fetchFn

() => [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`T`\>

##### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`T`\>

#### Call Signature

> **prefetchQuery**\<`T`\>(`query`, `params`): [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`T`\>

Defined in: [query/client/query-client.ts:280](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L280)

##### Type Parameters

###### T

`T` = `unknown`

##### Parameters

###### query

[`QueryConfig`](../type-aliases/QueryConfig.md)\<`any`, `any`\>

###### params

`any`

##### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`T`\>

***

### dehydrate()

> **dehydrate**(): [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`QueryState`](../type-aliases/QueryState.md)\>

Defined in: [query/client/query-client.ts:339](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L339)

#### Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`QueryState`](../type-aliases/QueryState.md)\>

***

### hydrate()

> **hydrate**(`cache`): `void`

Defined in: [query/client/query-client.ts:343](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L343)

#### Parameters

##### cache

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`QueryState`](../type-aliases/QueryState.md)\>

#### Returns

`void`

***

### getQueryCache()

> **getQueryCache**(): `QueryCache`

Defined in: [query/client/query-client.ts:352](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L352)

캐시 통계를 반환합니다. (디버깅 목적)

#### Returns

`QueryCache`

#### Description

성능 분석, 메모리 사용량 추적, 캐시 상태 확인 등에 활용할 수 있습니다.
