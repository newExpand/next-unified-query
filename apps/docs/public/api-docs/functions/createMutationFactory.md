[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / createMutationFactory

# Function: createMutationFactory()

> **createMutationFactory**\<`T`\>(`defs`): `T`

Defined in: [query/factories/mutation-factory.ts:221](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/factories/mutation-factory.ts#L221)

Mutation 정의 객체를 받아 그대로 반환하는 팩토리 함수입니다.
타입 추론을 돕고, 중앙에서 mutation들을 관리할 수 있게 합니다.

## Type Parameters

### T

`T` *extends* `MutationFactoryInput`

## Parameters

### defs

`T`

Mutation 정의 객체

## Returns

`T`

전달된 Mutation 정의 객체
