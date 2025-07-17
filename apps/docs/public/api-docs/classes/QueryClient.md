[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / QueryClient

# Class: QueryClient

Defined in: [query/client/query-client.ts:39](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L39)

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

Defined in: [query/client/query-client.ts:43](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L43)

#### Parameters

##### options?

`QueryClientOptions`

#### Returns

`QueryClient`

## Methods

### has()

> **has**(`key`): `boolean`

Defined in: [query/client/query-client.ts:48](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L48)

#### Parameters

##### key

`string` | readonly `unknown`[]

#### Returns

`boolean`

***

### getFetcher()

> **getFetcher**(): [`NextTypeFetch`](../interfaces/NextTypeFetch.md)

Defined in: [query/client/query-client.ts:52](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L52)

#### Returns

[`NextTypeFetch`](../interfaces/NextTypeFetch.md)

***

### get()

> **get**\<`T`\>(`key`): `undefined` \| [`QueryState`](../type-aliases/QueryState.md)\<`T`\>

Defined in: [query/client/query-client.ts:59](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L59)

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

Defined in: [query/client/query-client.ts:66](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L66)

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

Defined in: [query/client/query-client.ts:74](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L74)

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

Defined in: [query/client/query-client.ts:98](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L98)

쿼리 상태 삭제

#### Parameters

##### key

`string` | readonly `unknown`[]

#### Returns

`void`

***

### getAll()

> **getAll**(): [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`QueryState`](../type-aliases/QueryState.md)\>

Defined in: [query/client/query-client.ts:105](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L105)

모든 쿼리 상태 반환

#### Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`QueryState`](../type-aliases/QueryState.md)\>

***

### clear()

> **clear**(): `void`

Defined in: [query/client/query-client.ts:112](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L112)

모든 쿼리 상태 초기화

#### Returns

`void`

***

### invalidateQueries()

> **invalidateQueries**(`prefix`): `void`

Defined in: [query/client/query-client.ts:120](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L120)

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

Defined in: [query/client/query-client.ts:153](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L153)

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

Defined in: [query/client/query-client.ts:156](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L156)

#### Parameters

##### key

`string` | readonly `unknown`[]

#### Returns

`void`

***

### unsubscribe()

> **unsubscribe**(`key`, `gcTime`): `void`

Defined in: [query/client/query-client.ts:159](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L159)

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

Defined in: [query/client/query-client.ts:164](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L164)

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

Defined in: [query/client/query-client.ts:167](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L167)

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

Defined in: [query/client/query-client.ts:226](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L226)

#### Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`QueryState`](../type-aliases/QueryState.md)\>

***

### hydrate()

> **hydrate**(`cache`): `void`

Defined in: [query/client/query-client.ts:230](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L230)

#### Parameters

##### cache

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`QueryState`](../type-aliases/QueryState.md)\>

#### Returns

`void`

***

### getQueryCache()

> **getQueryCache**(): `QueryCache`

Defined in: [query/client/query-client.ts:239](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L239)

캐시 통계를 반환합니다. (디버깅 목적)

#### Returns

`QueryCache`

#### Description

성능 분석, 메모리 사용량 추적, 캐시 상태 확인 등에 활용할 수 있습니다.
