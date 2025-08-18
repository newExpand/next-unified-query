[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / NextTypeFetch

# Interface: NextTypeFetch

Defined in: [types/index.ts:413](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L413)

Next Type Fetch 인스턴스 인터페이스

## Properties

### defaults

> **defaults**: [`FetchConfig`](FetchConfig.md)

Defined in: [types/index.ts:417](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L417)

전역 설정

***

### interceptors

> **interceptors**: [`Interceptors`](Interceptors.md)

Defined in: [types/index.ts:422](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L422)

인터셉터

***

### get()

> **get**: \<`T`\>(`url`, `config?`) => [`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

Defined in: [types/index.ts:427](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L427)

GET 요청

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

### post()

> **post**: \<`T`\>(`url`, `data?`, `config?`) => [`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

Defined in: [types/index.ts:432](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L432)

POST 요청

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### url

`string`

##### data?

`unknown`

##### config?

[`FetchConfig`](FetchConfig.md)

#### Returns

[`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

***

### put()

> **put**: \<`T`\>(`url`, `data?`, `config?`) => [`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

Defined in: [types/index.ts:437](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L437)

PUT 요청

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### url

`string`

##### data?

`unknown`

##### config?

[`FetchConfig`](FetchConfig.md)

#### Returns

[`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

***

### delete()

> **delete**: \<`T`\>(`url`, `config?`) => [`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

Defined in: [types/index.ts:442](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L442)

DELETE 요청

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

### patch()

> **patch**: \<`T`\>(`url`, `data?`, `config?`) => [`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

Defined in: [types/index.ts:447](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L447)

PATCH 요청

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### url

`string`

##### data?

`unknown`

##### config?

[`FetchConfig`](FetchConfig.md)

#### Returns

[`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

***

### head()

> **head**: \<`T`\>(`url`, `config?`) => [`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

Defined in: [types/index.ts:452](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L452)

HEAD 요청

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

### options()

> **options**: \<`T`\>(`url`, `config?`) => [`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

Defined in: [types/index.ts:457](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L457)

OPTIONS 요청

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

Defined in: [types/index.ts:462](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L462)

기본 요청 메서드

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### config

[`RequestConfig`](RequestConfig.md)

#### Returns

[`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>
