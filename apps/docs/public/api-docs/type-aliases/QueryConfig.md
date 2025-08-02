[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / QueryConfig

# Type Alias: QueryConfig\<Params, Schema\>

> **QueryConfig**\<`Params`, `Schema`\> = `UrlBasedQueryConfig`\<`Params`, `Schema`\> \| `FunctionBasedQueryConfig`\<`Params`, `Schema`\>

Defined in: [query/factories/query-factory.ts:60](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/factories/query-factory.ts#L60)

Query를 정의하기 위한 설정 객체 인터페이스
URL 방식 또는 Custom Function 방식 중 하나를 선택할 수 있음

## Type Parameters

### Params

`Params` = `void`

### Schema

`Schema` *extends* `ZodType` = `ZodType`
