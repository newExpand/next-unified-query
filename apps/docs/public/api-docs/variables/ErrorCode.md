[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / ErrorCode

# Variable: ErrorCode

> `const` **ErrorCode**: `object`

Defined in: [utils/error.ts:86](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/utils/error.ts#L86)

FetchError 에러 코드 상수

## Type declaration

### NETWORK

> `readonly` **NETWORK**: `"ERR_NETWORK"` = `"ERR_NETWORK"`

네트워크 에러

### CANCELED

> `readonly` **CANCELED**: `"ERR_CANCELED"` = `"ERR_CANCELED"`

요청 취소됨

### TIMEOUT

> `readonly` **TIMEOUT**: `"ERR_TIMEOUT"` = `"ERR_TIMEOUT"`

요청 타임아웃

### BAD\_RESPONSE

> `readonly` **BAD\_RESPONSE**: `"ERR_BAD_RESPONSE"` = `"ERR_BAD_RESPONSE"`

서버 응답 에러 (4xx, 5xx)

### VALIDATION

> `readonly` **VALIDATION**: `"ERR_VALIDATION"` = `"ERR_VALIDATION"`

데이터 검증 실패

### VALIDATION\_UNKNOWN

> `readonly` **VALIDATION\_UNKNOWN**: `"ERR_VALIDATION_UNKNOWN"` = `"ERR_VALIDATION_UNKNOWN"`

알 수 없는 검증 오류

### UNKNOWN

> `readonly` **UNKNOWN**: `"ERR_UNKNOWN"` = `"ERR_UNKNOWN"`

알 수 없는 에러
