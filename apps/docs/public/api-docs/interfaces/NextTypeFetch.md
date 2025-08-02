[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / NextTypeFetch

# Interface: NextTypeFetch

Defined in: [types/index.ts:407](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L407)

Next Type Fetch 인스턴스 인터페이스

## Properties

### defaults

> **defaults**: [`FetchConfig`](FetchConfig.md)

Defined in: [types/index.ts:411](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L411)

전역 설정

***

### interceptors

> **interceptors**: [`Interceptors`](Interceptors.md)

Defined in: [types/index.ts:416](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L416)

인터셉터

***

### get()

> **get**: \<`T`\>(`url`, `config?`) => [`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>

Defined in: [types/index.ts:421](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L421)

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

Defined in: [types/index.ts:426](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L426)

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

Defined in: [types/index.ts:431](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L431)

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

Defined in: [types/index.ts:436](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L436)

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

Defined in: [types/index.ts:441](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L441)

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

Defined in: [types/index.ts:446](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L446)

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

Defined in: [types/index.ts:451](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L451)

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

Defined in: [types/index.ts:456](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L456)

기본 요청 메서드

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### config

[`RequestConfig`](RequestConfig.md)

#### Returns

[`CancelablePromise`](CancelablePromise.md)\<[`NextTypeResponse`](NextTypeResponse.md)\<`T`\>\>
