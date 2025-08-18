[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / ExtractQueryData

# Type Alias: ExtractQueryData\<T\>

> **ExtractQueryData**\<`T`\> = `T` *extends* [`QueryConfig`](QueryConfig.md)\<`any`, infer S\> ? `InferIfZodSchema`\<`S`, `any`\> : `any`

Defined in: [query/factories/query-factory.ts:72](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/factories/query-factory.ts#L72)

QueryConfig에서 스키마 기반 데이터 타입을 추출합니다.
스키마가 있으면 해당 스키마의 추론 타입을, 없으면 any를 사용합니다.

## Type Parameters

### T

`T`
