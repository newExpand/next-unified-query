[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / createQueryFactory

# Function: createQueryFactory()

> **createQueryFactory**\<`T`\>(`defs`): `T`

Defined in: [query/factories/query-factory.ts:135](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/factories/query-factory.ts#L135)

타입 안전한 API 정의를 가진 쿼리 팩토리를 생성합니다.

**환경 호환성:**
- ✅ 서버사이드: Next.js 서버 컴포넌트와 API 루트에서 안전하게 사용 가능
- ✅ 클라이언트사이드: 브라우저 환경에서 동작
- ✅ SSR: 서버사이드 렌더링과 호환

## Type Parameters

### T

`T` *extends* `QueryFactoryInput`

## Parameters

### defs

`T`

## Returns

`T`

## Example

```typescript
// 서버 또는 클라이언트 - 둘 다 동작
import { createQueryFactory } from 'next-unified-query';

const api = createQueryFactory({
  getUser: {
    cacheKey: (id: number) => ['user', id],
    url: (id: number) => `/users/${id}`,
    schema: z.object({ name: z.string(), email: z.string() })
  }
});
```
