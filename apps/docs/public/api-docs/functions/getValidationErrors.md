[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / getValidationErrors

# Function: getValidationErrors()

> **getValidationErrors**(`error`): `object`[]

Defined in: [utils/error.ts:57](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/utils/error.ts#L57)

검증 에러에서 상세 메시지를 추출합니다.

## Parameters

### error

[`FetchError`](../classes/FetchError.md)

검증 에러

## Returns

`object`[]

검증 에러 메시지 배열

## Example

```ts
if (isValidationError(error)) {
  const errors = getValidationErrors(error);
  errors.forEach(err => {
    console.log(`${err.path}: ${err.message}`);
  });
}
```
