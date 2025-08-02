[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / handleHttpError

# Function: handleHttpError()

> **handleHttpError**\<`T`\>(`error`, `handlers`): `T`

Defined in: [utils/error.ts:170](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/utils/error.ts#L170)

HTTP 상태 코드에 따라 에러를 처리합니다.

## Type Parameters

### T

`T`

## Parameters

### error

`unknown`

처리할 에러

### handlers

HTTP 상태 코드별 핸들러

#### default?

(`error`) => `T`

## Returns

`T`

처리 결과 (핸들러 함수의 반환값)

## Example

```ts
try {
  const response = await api.get('/api/users');
  return response.data;
} catch (error) {
  return handleHttpError(error, {
    400: () => '잘못된 요청입니다.',
    401: () => '인증이 필요합니다.',
    404: () => '리소스를 찾을 수 없습니다.',
    default: () => '서버 오류가 발생했습니다.',
  });
}
```
