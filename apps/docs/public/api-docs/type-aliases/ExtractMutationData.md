[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / ExtractMutationData

# Type Alias: ExtractMutationData\<T\>

> **ExtractMutationData**\<`T`\> = `T` *extends* [`MutationConfig`](MutationConfig.md)\<`any`, infer D, `any`, `any`, `any`, infer RS\> ? \[`RS`\] *extends* \[`ZodType`\] ? `z.infer`\<`RS`\> : `D` : `never`

Defined in: [query/factories/mutation-factory.ts:168](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/factories/mutation-factory.ts#L168)

MutationConfig에서 TData 타입을 추출합니다.
responseSchema가 있으면 해당 스키마의 추론 타입을, 없으면 TData를 사용합니다.

## Type Parameters

### T

`T`
