[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / hasErrorCode

# Function: hasErrorCode()

> **hasErrorCode**(`error`, `code`): `boolean`

Defined in: [utils/error.ts:79](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/utils/error.ts#L79)

에러가 특정 에러 코드를 가지고 있는지 확인합니다.

## Parameters

### error

`unknown`

검사할 에러

### code

`string`

확인할 에러 코드

## Returns

`boolean`

일치 여부

## Example

```ts
if (hasErrorCode(error, 'ERR_CANCELED')) {
  console.log('요청이 취소되었습니다.');
}
```
