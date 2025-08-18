[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / MutationConfig

# Type Alias: MutationConfig\<TVariables, TData, TError\>

> **MutationConfig**\<`TVariables`, `TData`, `TError`\> = `UrlBasedMutationConfig`\<`TVariables`, `TData`, `TError`\> \| `FunctionBasedMutationConfig`\<`TVariables`, `TData`, `TError`\>

Defined in: [query/factories/mutation-factory.ts:134](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/factories/mutation-factory.ts#L134)

Mutation을 정의하기 위한 설정 객체 인터페이스입니다.
URL + Method 방식 또는 Custom Function 방식 중 하나를 선택할 수 있습니다.

## Type Parameters

### TVariables

`TVariables` = `any`

### TData

`TData` = `any`

### TError

`TError` = [`FetchError`](../classes/FetchError.md)
