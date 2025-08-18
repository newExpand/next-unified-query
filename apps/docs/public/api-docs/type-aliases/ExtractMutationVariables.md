[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / ExtractMutationVariables

# Type Alias: ExtractMutationVariables\<T\>

> **ExtractMutationVariables**\<`T`\> = `T` *extends* [`MutationConfig`](MutationConfig.md)\<infer V, `any`, `any`\> ? `V` : `never`

Defined in: [query/factories/mutation-factory.ts:151](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/factories/mutation-factory.ts#L151)

MutationConfig에서 TVariables 타입을 추출합니다.

## Type Parameters

### T

`T`
