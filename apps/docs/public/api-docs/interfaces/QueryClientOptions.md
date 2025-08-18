[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / QueryClientOptions

# Interface: QueryClientOptions

Defined in: [query/client/query-client.ts:17](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L17)

기본 설정 옵션 인터페이스

## Extends

- [`FetchConfig`](FetchConfig.md)

## Properties

### fetcher?

> `optional` **fetcher**: [`NextTypeFetch`](NextTypeFetch.md)

Defined in: [query/client/query-client.ts:18](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L18)

***

### queryCache?

> `optional` **queryCache**: [`QueryCacheOptions`](QueryCacheOptions.md)

Defined in: [query/client/query-client.ts:22](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L22)

QueryCache 옵션

***

### interceptors?

> `optional` **interceptors**: [`InterceptorConfig`](InterceptorConfig.md)

Defined in: [query/client/query-client.ts:26](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L26)

인터셉터 설정 (모든 환경에서 실행)

***

### clientInterceptors?

> `optional` **clientInterceptors**: [`InterceptorConfig`](InterceptorConfig.md)

Defined in: [query/client/query-client.ts:30](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L30)

클라이언트 전용 인터셉터 (브라우저 환경에서만 실행)

***

### serverInterceptors?

> `optional` **serverInterceptors**: [`InterceptorConfig`](InterceptorConfig.md)

Defined in: [query/client/query-client.ts:34](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L34)

서버 전용 인터셉터 (Node.js 환경에서만 실행)

***

### defaultOptions?

> `optional` **defaultOptions**: `object`

Defined in: [query/client/query-client.ts:38](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client.ts#L38)

쿼리와 뮤테이션의 기본 옵션 설정

#### queries?

> `optional` **queries**: `object`

##### queries.throwOnError?

> `optional` **throwOnError**: `boolean` \| (`error`) => `boolean`

에러 발생 시 Error Boundary로 전파할지 여부
- boolean: true면 모든 에러를 Error Boundary로 전파
- function: 조건부 전파 (예: (error) => error.response?.status >= 500)

###### Default

```ts
false
```

##### queries.suspense?

> `optional` **suspense**: `boolean`

Suspense 모드 활성화 여부

###### Default

```ts
false
```

##### queries.staleTime?

> `optional` **staleTime**: `number`

쿼리 데이터가 stale로 간주되는 시간(ms)

###### Default

```ts
0 (즉시 stale)
```

##### queries.gcTime?

> `optional` **gcTime**: `number`

쿼리 데이터가 가비지 컬렉션되는 시간(ms)

###### Default

```ts
300000 (5분)
```

#### mutations?

> `optional` **mutations**: `object`

##### mutations.throwOnError?

> `optional` **throwOnError**: `boolean` \| (`error`) => `boolean`

에러 발생 시 Error Boundary로 전파할지 여부
- boolean: true면 모든 에러를 Error Boundary로 전파
- function: 조건부 전파 (예: (error) => error.response?.status >= 500)

###### Default

```ts
false
```

***

### baseURL?

> `optional` **baseURL**: `string`

Defined in: [types/index.ts:207](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L207)

기본 URL

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`baseURL`](FetchConfig.md#baseurl)

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [types/index.ts:212](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L212)

요청 타임아웃 (ms)

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`timeout`](FetchConfig.md#timeout)

***

### headers?

> `optional` **headers**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `string`\>

Defined in: [types/index.ts:217](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L217)

요청 헤더

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`headers`](FetchConfig.md#headers)

***

### params?

> `optional` **params**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `undefined` \| `null` \| `string` \| `number` \| `boolean`\>

Defined in: [types/index.ts:222](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L222)

요청 쿼리 파라미터

#### Inherited from

[`RequestConfig`](RequestConfig.md).[`params`](RequestConfig.md#params)

***

### retry?

> `optional` **retry**: `number` \| \{ `limit`: `number`; `statusCodes?`: `number`[]; `backoff?`: `"linear"` \| `"exponential"` \| (`retryCount`) => `number`; \}

Defined in: [types/index.ts:227](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L227)

자동 재시도 설정

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`retry`](FetchConfig.md#retry)

***

### ~~parseJSON?~~

> `optional` **parseJSON**: `boolean`

Defined in: [types/index.ts:239](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L239)

응답을 JSON으로 파싱 여부

#### Deprecated

responseType을 사용하세요

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`parseJSON`](FetchConfig.md#parsejson)

***

### schema?

> `optional` **schema**: `ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

Defined in: [types/index.ts:244](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L244)

응답 데이터 검증을 위한 Zod 스키마

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`schema`](FetchConfig.md#schema)

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

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`next`](FetchConfig.md#next)

***

### signal?

> `optional` **signal**: [`AbortSignal`](https://developer.mozilla.org/docs/Web/API/AbortSignal)

Defined in: [types/index.ts:264](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L264)

요청 취소를 위한 AbortSignal
외부에서 AbortController를 통해 요청을 취소할 수 있습니다.

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`signal`](FetchConfig.md#signal)

***

### contentType?

> `optional` **contentType**: `string`

Defined in: [types/index.ts:270](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L270)

컨텐츠 타입 설정
요청 본문의 Content-Type을 지정합니다.

#### Inherited from

[`RequestConfig`](RequestConfig.md).[`contentType`](RequestConfig.md#contenttype)

***

### responseType?

> `optional` **responseType**: [`ResponseType`](../enumerations/ResponseType.md)

Defined in: [types/index.ts:276](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L276)

응답 타입 설정
서버 응답을 어떻게 파싱할지 지정합니다.

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`responseType`](FetchConfig.md#responsetype)

***

### authRetry?

> `optional` **authRetry**: [`AuthRetryOption`](AuthRetryOption.md)

Defined in: [types/index.ts:281](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L281)

401 인증 오류 자동 재시도 옵션

#### Inherited from

[`FetchConfig`](FetchConfig.md).[`authRetry`](FetchConfig.md#authretry)
