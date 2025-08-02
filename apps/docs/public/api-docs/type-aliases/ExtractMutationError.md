[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / ExtractMutationError

# Type Alias: ExtractMutationError\<T\>

> **ExtractMutationError**\<`T`\> = `T` *extends* [`MutationConfig`](MutationConfig.md)\<`any`, `any`, infer E, `any`, `any`, `any`\> ? `E` : [`FetchError`](../classes/FetchError.md)

Defined in: [query/factories/mutation-factory.ts:177](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/factories/mutation-factory.ts#L177)

MutationConfig에서 TError 타입을 추출합니다.

## Type Parameters

### T

`T`
