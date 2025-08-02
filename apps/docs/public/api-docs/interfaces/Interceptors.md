[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / Interceptors

# Interface: Interceptors

Defined in: [types/index.ts:368](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L368)

인터셉터 인터페이스

## Properties

### request

> **request**: `object`

Defined in: [types/index.ts:369](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L369)

#### use()

> **use**: (`interceptor`) => [`InterceptorHandle`](InterceptorHandle.md)

##### Parameters

###### interceptor

[`RequestInterceptor`](../type-aliases/RequestInterceptor.md)

##### Returns

[`InterceptorHandle`](InterceptorHandle.md)

#### eject()

> **eject**: (`id`) => `void`

##### Parameters

###### id

`number`

##### Returns

`void`

#### clearByType()

> **clearByType**: (`type`) => `void`

##### Parameters

###### type

`symbol`

##### Returns

`void`

#### clear()

> **clear**: () => `void`

##### Returns

`void`

***

### response

> **response**: `object`

Defined in: [types/index.ts:375](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L375)

#### use()

> **use**: (`onFulfilled`) => [`InterceptorHandle`](InterceptorHandle.md)

##### Parameters

###### onFulfilled

[`ResponseInterceptor`](../type-aliases/ResponseInterceptor.md)

##### Returns

[`InterceptorHandle`](InterceptorHandle.md)

#### eject()

> **eject**: (`id`) => `void`

##### Parameters

###### id

`number`

##### Returns

`void`

#### clearByType()

> **clearByType**: (`type`) => `void`

##### Parameters

###### type

`symbol`

##### Returns

`void`

#### clear()

> **clear**: () => `void`

##### Returns

`void`

***

### error

> **error**: `object`

Defined in: [types/index.ts:381](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L381)

#### use()

> **use**: (`onRejected`) => [`InterceptorHandle`](InterceptorHandle.md)

##### Parameters

###### onRejected

[`ErrorInterceptor`](../type-aliases/ErrorInterceptor.md)

##### Returns

[`InterceptorHandle`](InterceptorHandle.md)

#### eject()

> **eject**: (`id`) => `void`

##### Parameters

###### id

`number`

##### Returns

`void`

#### clearByType()

> **clearByType**: (`type`) => `void`

##### Parameters

###### type

`symbol`

##### Returns

`void`

#### clear()

> **clear**: () => `void`

##### Returns

`void`
