[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / handleFetchError

# Function: handleFetchError()

> **handleFetchError**\<`T`\>(`error`, `handlers`): `T`

Defined in: [utils/error.ts:127](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/utils/error.ts#L127)

에러를 처리하는 유틸리티 함수

## Type Parameters

### T

`T`

## Parameters

### error

`unknown`

처리할 에러

### handlers

`object` & `object`

에러 코드별 핸들러

## Returns

`T`

처리 결과 (핸들러 함수의 반환값)

## Example

```ts
try {
  const response = await api.get('/api/users');
  return response.data;
} catch (error) {
  return handleFetchError(error, {
    [ErrorCode.NETWORK]: () => '네트워크 연결을 확인해주세요.',
    [ErrorCode.TIMEOUT]: () => '요청 시간이 초과되었습니다.',
    [ErrorCode.CANCELED]: () => '요청이 취소되었습니다.',
    default: (err) => `오류가 발생했습니다: ${err.message}`,
  });
}
```
