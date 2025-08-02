[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / ExtractMutationVariables

# Type Alias: ExtractMutationVariables\<T\>

> **ExtractMutationVariables**\<`T`\> = `T` *extends* [`MutationConfig`](MutationConfig.md)\<infer V, `any`, `any`, `any`, `any`, `any`\> ? `V` : `never`

Defined in: [query/factories/mutation-factory.ts:162](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/factories/mutation-factory.ts#L162)

MutationConfig에서 TVariables 타입을 추출합니다.

## Type Parameters

### T

`T`
