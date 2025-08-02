[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / interceptorTypes

# Variable: interceptorTypes

> `const` **interceptorTypes**: `object` = `interceptorTypeSymbols`

Defined in: [interceptors.ts:451](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/interceptors.ts#L451)

인터셉터 유형을 식별하는 심볼들입니다.

## Type declaration

### default

> **default**: `symbol`

### auth

> **auth**: `symbol`

### logging

> **logging**: `symbol`

### errorHandler

> **errorHandler**: `symbol`

## Advanced

고급 사용 케이스에서 인터셉터 그룹을 관리할 때 사용합니다.
일반적인 사용에서는 기본 interceptors API를 사용하는 것을 권장합니다.

## Example

```tsx
import { interceptorTypes } from 'next-unified-query';

// 특정 타입의 인터셉터만 제거
api.interceptors.request.clearByType(interceptorTypes.auth);
```
