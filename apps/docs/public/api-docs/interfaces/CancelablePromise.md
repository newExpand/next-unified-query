[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / CancelablePromise

# Interface: CancelablePromise\<T\>

Defined in: [types/index.ts:392](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L392)

취소 가능한 요청 타입

## Extends

- [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`T`\>

## Type Parameters

### T

`T`

## Properties

### cancel()

> **cancel**: () => `void`

Defined in: [types/index.ts:396](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L396)

요청 취소 메서드

#### Returns

`void`

***

### isCanceled()

> **isCanceled**: () => `boolean`

Defined in: [types/index.ts:401](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L401)

요청 취소 여부 확인

#### Returns

`boolean`
