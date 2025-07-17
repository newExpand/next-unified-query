[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / RequestConfig

# Interface: RequestConfig

Defined in: [types/index.ts:281](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L281)

특정 요청에 대한 설정 인터페이스

## Extends

- [`FetchConfig`](FetchConfig.md)

## Properties

### baseURL?

> `optional` **baseURL**: `string`

Defined in: [types/index.ts:201](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L201)

기본 URL

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`baseURL`](FetchConfig.md#baseurl)

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [types/index.ts:206](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L206)

요청 타임아웃 (ms)

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`timeout`](FetchConfig.md#timeout)

***

### headers?

> `optional` **headers**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `string`\>

Defined in: [types/index.ts:211](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L211)

요청 헤더

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`headers`](FetchConfig.md#headers)

***

### params?

> `optional` **params**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `undefined` \| `null` \| `string` \| `number` \| `boolean`\>

Defined in: [types/index.ts:216](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L216)

요청 쿼리 파라미터

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`params`](FetchConfig.md#params)

***

### retry?

> `optional` **retry**: `number` \| \{ `limit`: `number`; `statusCodes?`: `number`[]; `backoff?`: `"linear"` \| `"exponential"` \| (`retryCount`) => `number`; \}

Defined in: [types/index.ts:221](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L221)

자동 재시도 설정

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`retry`](FetchConfig.md#retry)

***

### ~~parseJSON?~~

> `optional` **parseJSON**: `boolean`

Defined in: [types/index.ts:233](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L233)

응답을 JSON으로 파싱 여부

#### Deprecated

responseType을 사용하세요

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`parseJSON`](FetchConfig.md#parsejson)

***

### schema?

> `optional` **schema**: `ZodType`\<`unknown`, `unknown`\>

Defined in: [types/index.ts:238](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L238)

응답 데이터 검증을 위한 Zod 스키마

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`schema`](FetchConfig.md#schema)

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

[`FetchConfig`](FetchConfig.md).[`next`](FetchConfig.md#next)

***

### signal?

> `optional` **signal**: [`AbortSignal`](https://developer.mozilla.org/docs/Web/API/AbortSignal)

Defined in: [types/index.ts:258](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L258)

요청 취소를 위한 AbortSignal
외부에서 AbortController를 통해 요청을 취소할 수 있습니다.

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`signal`](FetchConfig.md#signal)

***

### contentType?

> `optional` **contentType**: `string`

Defined in: [types/index.ts:264](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L264)

컨텐츠 타입 설정
요청 본문의 Content-Type을 지정합니다.

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`contentType`](FetchConfig.md#contenttype)

***

### responseType?

> `optional` **responseType**: [`ResponseType`](../enumerations/ResponseType.md)

Defined in: [types/index.ts:270](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L270)

응답 타입 설정
서버 응답을 어떻게 파싱할지 지정합니다.

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`responseType`](FetchConfig.md#responsetype)

***

### authRetry?

> `optional` **authRetry**: [`AuthRetryOption`](AuthRetryOption.md)

Defined in: [types/index.ts:275](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L275)

401 인증 오류 자동 재시도 옵션

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`authRetry`](FetchConfig.md#authretry)

***

### url?

> `optional` **url**: `string`

Defined in: [types/index.ts:285](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L285)

요청 URL

***

### method?

> `optional` **method**: [`HttpMethod`](../type-aliases/HttpMethod.md)

Defined in: [types/index.ts:290](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L290)

HTTP 메서드

***

### data?

> `optional` **data**: `unknown`

Defined in: [types/index.ts:295](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L295)

요청 본문

***

### \_authRetryCount?

> `optional` **\_authRetryCount**: `number`

Defined in: [types/index.ts:300](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L300)

내부용: 401 재시도 카운트
