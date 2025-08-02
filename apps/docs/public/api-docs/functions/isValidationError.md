[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / isValidationError

# Function: isValidationError()

> **isValidationError**(`error`): `error is FetchError<ApiErrorResponse> & { cause: $ZodError<any> }`

Defined in: [utils/error.ts:40](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/utils/error.ts#L40)

에러가 검증 에러인지 확인합니다.

## Parameters

### error

`unknown`

검사할 에러

## Returns

`error is FetchError<ApiErrorResponse> & { cause: $ZodError<any> }`

검증 에러 여부

## Example

```ts
try {
  const response = await api.post('/api/users', userData);
} catch (error) {
  if (isValidationError(error)) {
    const validationErrors = getValidationErrors(error);
    console.error('검증 실패:', validationErrors);
  }
}
```
