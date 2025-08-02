[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / QueryClientOptionsWithInterceptors

# Interface: QueryClientOptionsWithInterceptors

Defined in: [query/client/query-client-manager.ts:13](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client-manager.ts#L13)

인터셉터 설정을 포함한 QueryClient 옵션

## Extends

- `QueryClientOptions`

## Properties

### setupInterceptors?

> `optional` **setupInterceptors**: [`InterceptorSetupFunction`](../type-aliases/InterceptorSetupFunction.md)

Defined in: [query/client/query-client-manager.ts:18](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client-manager.ts#L18)

인터셉터 설정 함수
fetcher 인스턴스를 받아서 인터셉터를 등록하는 함수

***

### fetcher?

> `optional` **fetcher**: [`NextTypeFetch`](NextTypeFetch.md)

Defined in: [query/client/query-client.ts:9](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L9)

#### Inherited from

`QueryClientOptions.fetcher`

***

### queryCache?

> `optional` **queryCache**: [`QueryCacheOptions`](QueryCacheOptions.md)

Defined in: [query/client/query-client.ts:13](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L13)

QueryCache 옵션

#### Inherited from

`QueryClientOptions.queryCache`

***

### baseURL?

> `optional` **baseURL**: `string`

Defined in: [types/index.ts:201](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L201)

기본 URL

#### Inherited from

`QueryClientOptions.baseURL`

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [types/index.ts:206](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L206)

요청 타임아웃 (ms)

#### Inherited from

`QueryClientOptions.timeout`

***

### headers?

> `optional` **headers**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `string`\>

Defined in: [types/index.ts:211](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L211)

요청 헤더

#### Inherited from

`QueryClientOptions.headers`

***

### params?

> `optional` **params**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `undefined` \| `null` \| `string` \| `number` \| `boolean`\>

Defined in: [types/index.ts:216](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L216)

요청 쿼리 파라미터

#### Inherited from

`QueryClientOptions.params`

***

### retry?

> `optional` **retry**: `number` \| \{ `limit`: `number`; `statusCodes?`: `number`[]; `backoff?`: `"linear"` \| `"exponential"` \| (`retryCount`) => `number`; \}

Defined in: [types/index.ts:221](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L221)

자동 재시도 설정

#### Inherited from

`QueryClientOptions.retry`

***

### ~~parseJSON?~~

> `optional` **parseJSON**: `boolean`

Defined in: [types/index.ts:233](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L233)

응답을 JSON으로 파싱 여부

#### Deprecated

responseType을 사용하세요

#### Inherited from

`QueryClientOptions.parseJSON`

***

### schema?

> `optional` **schema**: `ZodType`\<`unknown`, `unknown`\>

Defined in: [types/index.ts:238](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L238)

응답 데이터 검증을 위한 Zod 스키마

#### Inherited from

`QueryClientOptions.schema`

***

### next?

> `optional` **next**: `object`

Defined in: [types/index.ts:243](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L243)

Next.js fetch 옵션

#### revalidate?

> `optional` **revalidate**: `number` \| `false`

재검증 시간(초)

#### tags?

> `optional` **tags**: `string`[]

태그 기반 재검증을 위한 태그 배열

#### Inherited from

`QueryClientOptions.next`

***

### signal?

> `optional` **signal**: [`AbortSignal`](https://developer.mozilla.org/docs/Web/API/AbortSignal)

Defined in: [types/index.ts:258](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L258)

요청 취소를 위한 AbortSignal
외부에서 AbortController를 통해 요청을 취소할 수 있습니다.

#### Inherited from

`QueryClientOptions.signal`

***

### contentType?

> `optional` **contentType**: `string`

Defined in: [types/index.ts:264](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L264)

컨텐츠 타입 설정
요청 본문의 Content-Type을 지정합니다.

#### Inherited from

`QueryClientOptions.contentType`

***

### responseType?

> `optional` **responseType**: [`ResponseType`](../enumerations/ResponseType.md)

Defined in: [types/index.ts:270](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L270)

응답 타입 설정
서버 응답을 어떻게 파싱할지 지정합니다.

#### Inherited from

`QueryClientOptions.responseType`

***

### authRetry?

> `optional` **authRetry**: [`AuthRetryOption`](AuthRetryOption.md)

Defined in: [types/index.ts:275](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L275)

401 인증 오류 자동 재시도 옵션

#### Inherited from

`QueryClientOptions.authRetry`
