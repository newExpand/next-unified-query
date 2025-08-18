[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / NextTypeResponse

# Interface: NextTypeResponse\<T\>

Defined in: [types/index.ts:312](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L312)

응답 객체 인터페이스

## Type Parameters

### T

`T` = `unknown`

## Properties

### data

> **data**: `T`

Defined in: [types/index.ts:316](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L316)

서버 응답 데이터

***

### status

> **status**: `number`

Defined in: [types/index.ts:321](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L321)

HTTP 상태 코드

***

### statusText

> **statusText**: `string`

Defined in: [types/index.ts:326](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L326)

HTTP 상태 메시지

***

### headers

> **headers**: [`Headers`](https://developer.mozilla.org/docs/Web/API/Headers)

Defined in: [types/index.ts:331](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L331)

응답 헤더

***

### config

> **config**: [`RequestConfig`](RequestConfig.md)

Defined in: [types/index.ts:336](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L336)

요청 설정

***

### request?

> `optional` **request**: [`Request`](https://developer.mozilla.org/docs/Web/API/Request)

Defined in: [types/index.ts:341](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L341)

요청 객체
