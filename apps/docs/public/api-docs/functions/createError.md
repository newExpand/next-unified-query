[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / createError

# Function: createError()

> **createError**\<`TErrorData`\>(`message`, `config`, `code`, `response?`, `data?`): [`FetchError`](../classes/FetchError.md)\<`TErrorData`\>

Defined in: [utils/response.ts:49](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/utils/response.ts#L49)

HTTP 에러를 생성합니다.

## Type Parameters

### TErrorData

`TErrorData` = `unknown`

## Parameters

### message

`string`

에러 메시지

### config

[`RequestConfig`](../interfaces/RequestConfig.md)

요청 설정

### code

`string` = `"ERR_UNKNOWN"`

에러 코드

### response?

[`Response`](https://developer.mozilla.org/docs/Web/API/Response)

응답 객체 (선택적)

### data?

`TErrorData`

응답 데이터 (선택적)

## Returns

[`FetchError`](../classes/FetchError.md)\<`TErrorData`\>

FetchError 인스턴스
