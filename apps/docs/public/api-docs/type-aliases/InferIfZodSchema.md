[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / InferIfZodSchema

# Type Alias: InferIfZodSchema\<T, Fallback\>

> **InferIfZodSchema**\<`T`, `Fallback`\> = \[`T`\] *extends* \[`ZodType`\] ? `z.infer`\<`T`\> : `Fallback`

Defined in: [query/factories/mutation-factory.ts:8](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/factories/mutation-factory.ts#L8)

Zod 스키마가 명확히 있을 때만 z.infer<T>를 사용, 아니면 Fallback

## Type Parameters

### T

`T`

### Fallback

`Fallback`
