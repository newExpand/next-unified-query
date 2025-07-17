[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / QueryFetcher

# Interface: QueryFetcher

Defined in: [types/index.ts:463](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L463)

Query 전용 Fetcher 인터페이스
useQuery에서만 사용되며, 데이터 조회 목적의 메서드만 포함

## Properties

### get()

> **get**: \<`T`\>(`url`, `config?`) => [`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

Defined in: [types/index.ts:467](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L467)

GET 요청 (데이터 조회)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### url

`string`

##### config?

[`FetchConfig`](FetchConfig.md)

#### Returns

[`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

***

### head()

> **head**: \<`T`\>(`url`, `config?`) => [`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

Defined in: [types/index.ts:472](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L472)

HEAD 요청 (메타데이터 조회)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### url

`string`

##### config?

[`FetchConfig`](FetchConfig.md)

#### Returns

[`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

***

### request()

> **request**: \<`T`\>(`config`) => [`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

Defined in: [types/index.ts:477](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L477)

기본 요청 메서드 (GET 방식만 허용)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### config

[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<[`RequestConfig`](RequestConfig.md), `"method"`\> & `object`

#### Returns

[`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>
