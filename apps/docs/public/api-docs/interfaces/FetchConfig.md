[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / FetchConfig

# Interface: FetchConfig

Defined in: [types/index.ts:203](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L203)

기본 설정 옵션 인터페이스

## Extends

- [`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<`RequestInit`, `"signal"` \| `"headers"` \| `"body"` \| `"method"`\>

## Extended by

- [`RequestConfig`](RequestConfig.md)
- [`QueryClientOptions`](QueryClientOptions.md)

## Properties

### baseURL?

> `optional` **baseURL**: `string`

Defined in: [types/index.ts:207](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L207)

기본 URL

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [types/index.ts:212](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L212)

요청 타임아웃 (ms)

***

### headers?

> `optional` **headers**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `string`\>

Defined in: [types/index.ts:217](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L217)

요청 헤더

***

### params?

> `optional` **params**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `undefined` \| `null` \| `string` \| `number` \| `boolean`\>

Defined in: [types/index.ts:222](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L222)

요청 쿼리 파라미터

***

### retry?

> `optional` **retry**: `number` \| \{ `limit`: `number`; `statusCodes?`: `number`[]; `backoff?`: `"linear"` \| `"exponential"` \| (`retryCount`) => `number`; \}

Defined in: [types/index.ts:227](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L227)

자동 재시도 설정

***

### ~~parseJSON?~~

> `optional` **parseJSON**: `boolean`

Defined in: [types/index.ts:239](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L239)

응답을 JSON으로 파싱 여부

#### Deprecated

responseType을 사용하세요

***

### schema?

> `optional` **schema**: `ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

Defined in: [types/index.ts:244](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L244)

응답 데이터 검증을 위한 Zod 스키마

***

### next?

> `optional` **next**: `object`

Defined in: [types/index.ts:249](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L249)

Next.js fetch 옵션

#### revalidate?

> `optional` **revalidate**: `number` \| `false`

재검증 시간(초)

#### tags?

> `optional` **tags**: `string`[]

태그 기반 재검증을 위한 태그 배열

***

### signal?

> `optional` **signal**: [`AbortSignal`](https://developer.mozilla.org/docs/Web/API/AbortSignal)

Defined in: [types/index.ts:264](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L264)

요청 취소를 위한 AbortSignal
외부에서 AbortController를 통해 요청을 취소할 수 있습니다.

***

### contentType?

> `optional` **contentType**: `string`

Defined in: [types/index.ts:270](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L270)

컨텐츠 타입 설정
요청 본문의 Content-Type을 지정합니다.

***

### responseType?

> `optional` **responseType**: [`ResponseType`](../enumerations/ResponseType.md)

Defined in: [types/index.ts:276](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L276)

응답 타입 설정
서버 응답을 어떻게 파싱할지 지정합니다.

***

### authRetry?

> `optional` **authRetry**: [`AuthRetryOption`](AuthRetryOption.md)

Defined in: [types/index.ts:281](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L281)

401 인증 오류 자동 재시도 옵션
