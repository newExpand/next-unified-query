[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / FetchError

# Class: FetchError\<TErrorData\>

Defined in: [types/index.ts:107](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L107)

HTTP 에러 클래스 (제네릭 지원)

## Extends

- [`Error`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error)

## Type Parameters

### TErrorData

`TErrorData` = [`ApiErrorResponse`](../interfaces/ApiErrorResponse.md)

## Constructors

### Constructor

> **new FetchError**\<`TErrorData`\>(`message`, `config`, `code?`, `request?`, `response?`, `responseData?`): `FetchError`\<`TErrorData`\>

Defined in: [types/index.ts:152](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L152)

FetchError 생성자

#### Parameters

##### message

`string`

에러 메시지

##### config

[`RequestConfig`](../interfaces/RequestConfig.md)

요청 설정

##### code?

`string`

에러 코드

##### request?

[`Request`](https://developer.mozilla.org/docs/Web/API/Request)

요청 객체

##### response?

[`Response`](https://developer.mozilla.org/docs/Web/API/Response)

응답 객체

##### responseData?

`TErrorData`

응답 데이터

#### Returns

`FetchError`\<`TErrorData`\>

#### Overrides

`Error.constructor`

## Properties

### name

> **name**: `string` = `"FetchError"`

Defined in: [types/index.ts:111](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L111)

에러 이름

#### Overrides

`Error.name`

***

### code?

> `optional` **code**: `string`

Defined in: [types/index.ts:116](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L116)

에러 코드

***

### response?

> `optional` **response**: `object`

Defined in: [types/index.ts:121](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L121)

응답 정보 (HTTP 에러인 경우)

#### data

> **data**: `TErrorData`

#### status

> **status**: `number`

#### statusText

> **statusText**: `string`

#### headers

> **headers**: [`Headers`](https://developer.mozilla.org/docs/Web/API/Headers)

***

### request?

> `optional` **request**: [`Request`](https://developer.mozilla.org/docs/Web/API/Request)

Defined in: [types/index.ts:131](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L131)

요청 객체

***

### config

> **config**: [`RequestConfig`](../interfaces/RequestConfig.md)

Defined in: [types/index.ts:136](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L136)

요청 설정

***

### cause?

> `optional` **cause**: `unknown`

Defined in: [types/index.ts:141](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L141)

원인이 되는 에러 (예: ZodError)
