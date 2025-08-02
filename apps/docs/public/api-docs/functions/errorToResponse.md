[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / errorToResponse

# Function: errorToResponse()

> **errorToResponse**\<`T`\>(`error`, `data`): [`NextTypeResponse`](../interfaces/NextTypeResponse.md)\<`T`\>

Defined in: [utils/error.ts:208](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/utils/error.ts#L208)

에러를 NextTypeResponse 형태로 변환합니다.
인터셉터에서 에러를 응답으로 변환할 때 유용하게 사용할 수 있습니다.

## Type Parameters

### T

`T`

## Parameters

### error

[`FetchError`](../classes/FetchError.md)

변환할 에러

### data

`T`

응답 데이터

## Returns

[`NextTypeResponse`](../interfaces/NextTypeResponse.md)\<`T`\>

NextTypeResponse 객체

## Example

```ts
// 인터셉터에서 사용 예시
api.interceptors.error.use((error) => {
  if (hasErrorCode(error, ErrorCode.VALIDATION)) {
    return errorToResponse(error, {
      validationError: true,
      fields: error.response?.data
    });
  }
  throw error;
});
```
