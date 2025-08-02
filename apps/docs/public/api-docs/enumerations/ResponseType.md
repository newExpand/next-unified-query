[**Next Unified Query v0.1.x**](../README.md)

***

[Next Unified Query](../globals.md) / ResponseType

# Enumeration: ResponseType

Defined in: [types/index.ts:46](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L46)

응답 타입 열거형

## Enumeration Members

### JSON

> **JSON**: `"json"`

Defined in: [types/index.ts:50](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L50)

JSON 응답 (자동 파싱)

***

### TEXT

> **TEXT**: `"text"`

Defined in: [types/index.ts:55](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L55)

텍스트 응답 (text/plain, HTML, XML 등)

***

### BLOB

> **BLOB**: `"blob"`

Defined in: [types/index.ts:60](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L60)

Blob 응답 (이미지, 파일 등 바이너리 데이터)

***

### ARRAY\_BUFFER

> **ARRAY\_BUFFER**: `"arraybuffer"`

Defined in: [types/index.ts:65](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L65)

ArrayBuffer 응답 (바이너리 데이터)

***

### RAW

> **RAW**: `"raw"`

Defined in: [types/index.ts:70](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/types/index.ts#L70)

원시 응답 (Response 객체 그대로 반환)
