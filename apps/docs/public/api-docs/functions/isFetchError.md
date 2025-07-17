[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / isFetchError

# Function: isFetchError()

> **isFetchError**(`error`): `error is FetchError<ApiErrorResponse>`

Defined in: [utils/error.ts:21](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/utils/error.ts#L21)

객체가 FetchError인지 확인합니다.

## Parameters

### error

`unknown`

검사할 객체

## Returns

`error is FetchError<ApiErrorResponse>`

FetchError 여부

## Example

```ts
try {
  const response = await api.get('/api/users');
  // 성공 처리
} catch (error) {
  if (isFetchError(error)) {
    console.error('API 에러:', error.message, error.code);
  }
}
```
