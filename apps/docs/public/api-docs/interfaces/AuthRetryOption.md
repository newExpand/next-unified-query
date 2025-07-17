[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / AuthRetryOption

# Interface: AuthRetryOption

Defined in: [types/index.ts:173](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L173)

401 인증 오류 자동 재시도 옵션

## Properties

### limit?

> `optional` **limit**: `number`

Defined in: [types/index.ts:177](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L177)

최대 재시도 횟수 (기본값: 1)

***

### statusCodes?

> `optional` **statusCodes**: `number`[]

Defined in: [types/index.ts:182](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L182)

재시도할 HTTP 상태 코드 목록 (기본값: [401])
커스텀 상태 코드(예: 401004 등)도 지정 가능

***

### handler()

> **handler**: (`error`, `config`) => [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`boolean`\>

Defined in: [types/index.ts:186](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L186)

재시도 전 실행할 핸들러 (true 반환 시 재시도)

#### Parameters

##### error

[`FetchError`](../classes/FetchError.md)\<`any`\>

##### config

[`RequestConfig`](RequestConfig.md)

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`boolean`\>

***

### shouldRetry()?

> `optional` **shouldRetry**: (`error`, `config`) => `boolean`

Defined in: [types/index.ts:191](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L191)

커스텀 재시도 조건 함수 (true 반환 시 handler 실행)
상태코드 외에 추가 조건이 필요할 때 사용

#### Parameters

##### error

[`FetchError`](../classes/FetchError.md)\<`any`\>

##### config

[`RequestConfig`](RequestConfig.md)

#### Returns

`boolean`
