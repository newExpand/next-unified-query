[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / NextTypeResponse

# Interface: NextTypeResponse\<T\>

Defined in: [types/index.ts:306](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L306)

응답 객체 인터페이스

## Type Parameters

### T

`T` = `unknown`

## Properties

### data

> **data**: `T`

Defined in: [types/index.ts:310](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L310)

서버 응답 데이터

***

### status

> **status**: `number`

Defined in: [types/index.ts:315](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L315)

HTTP 상태 코드

***

### statusText

> **statusText**: `string`

Defined in: [types/index.ts:320](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L320)

HTTP 상태 메시지

***

### headers

> **headers**: [`Headers`](https://developer.mozilla.org/docs/Web/API/Headers)

Defined in: [types/index.ts:325](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L325)

응답 헤더

***

### config

> **config**: [`RequestConfig`](RequestConfig.md)

Defined in: [types/index.ts:330](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L330)

요청 설정

***

### request?

> `optional` **request**: [`Request`](https://developer.mozilla.org/docs/Web/API/Request)

Defined in: [types/index.ts:335](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L335)

요청 객체
