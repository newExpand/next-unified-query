[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / QueryObserver

# Class: QueryObserver\<T, E\>

Defined in: [query/observer/query-observer.ts:26](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/query-observer.ts#L26)

Query Observer 클래스 - 쿼리 상태 관찰 및 관리

## Advanced

이 클래스는 고급 사용 케이스를 위한 저수준 API입니다.
일반적인 사용에서는 useQuery React hook을 사용하는 것을 강력히 권장합니다.

placeholderData는 캐시와 완전히 분리하여 UI 레벨에서만 관리합니다.

## Example

```tsx
// ❌ 권장하지 않음 - 직접 QueryObserver 사용
import { QueryObserver } from 'next-unified-query';

// ✅ 권장 - React hooks 사용
import { useQuery } from 'next-unified-query/react';
const { data, isLoading } = useQuery({ cacheKey: ['users'], url: '/users' });
```

## Type Parameters

### T

`T` = `unknown`

### E

`E` = `unknown`

## Constructors

### Constructor

> **new QueryObserver**\<`T`, `E`\>(`queryClient`, `options`): `QueryObserver`\<`T`, `E`\>

Defined in: [query/observer/query-observer.ts:63](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/query-observer.ts#L63)

#### Parameters

##### queryClient

[`QueryClient`](QueryClient.md)

##### options

[`QueryObserverOptions`](../type-aliases/QueryObserverOptions.md)\<`T`\>

#### Returns

`QueryObserver`\<`T`, `E`\>

## Methods

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [query/observer/query-observer.ts:306](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/query-observer.ts#L306)

결과 구독 (React 컴포넌트에서 사용)

#### Parameters

##### listener

() => `void`

#### Returns

> (): `void`

##### Returns

`void`

***

### getCurrentResult()

> **getCurrentResult**(): [`QueryObserverResult`](../interfaces/QueryObserverResult.md)\<`T`, `E`\>

Defined in: [query/observer/query-observer.ts:317](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/query-observer.ts#L317)

Tracked Properties가 적용된 현재 결과 반환
TrackedResult 인스턴스를 재사용하여 속성 추적을 유지

#### Returns

[`QueryObserverResult`](../interfaces/QueryObserverResult.md)\<`T`, `E`\>

***

### start()

> **start**(): `void`

Defined in: [query/observer/query-observer.ts:358](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/query-observer.ts#L358)

Observer 시작 - React useEffect에서 호출
렌더링과 분리하여 안전하게 초기 fetch 시작

#### Returns

`void`

***

### refetch()

> **refetch**(`force`): `void`

Defined in: [query/observer/query-observer.ts:379](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/query-observer.ts#L379)

수동 refetch
force 옵션이 true인 경우 staleTime을 무시하고 강제로 페칭합니다.

#### Parameters

##### force

`boolean` = `true`

#### Returns

`void`

***

### setOptions()

> **setOptions**(`options`): `void`

Defined in: [query/observer/query-observer.ts:398](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/query-observer.ts#L398)

옵션 업데이트 최적화

#### Parameters

##### options

[`QueryObserverOptions`](../type-aliases/QueryObserverOptions.md)\<`T`\>

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [query/observer/query-observer.ts:630](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/observer/query-observer.ts#L630)

Observer 정리

#### Returns

`void`
