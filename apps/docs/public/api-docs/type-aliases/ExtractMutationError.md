[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / ExtractMutationError

# Type Alias: ExtractMutationError\<T\>

> **ExtractMutationError**\<`T`\> = `T` *extends* [`MutationConfig`](MutationConfig.md)\<`any`, `any`, infer E\> ? `E` : [`FetchError`](../classes/FetchError.md)

Defined in: [query/factories/mutation-factory.ts:168](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/factories/mutation-factory.ts#L168)

MutationConfig에서 TError 타입을 추출합니다.

## Type Parameters

### T

`T`
