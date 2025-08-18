[**Next Unified Query v1.0.0**](../README.md)

***

[Next Unified Query](../globals.md) / getQueryClient

# Function: getQueryClient()

> **getQueryClient**(`options?`): [`QueryClient`](../classes/QueryClient.md)

Defined in: [query/client/query-client-manager.ts:42](https://github.com/newExpand/next-unified-query/blob/main/packages/core/src/query/client/query-client-manager.ts#L42)

환경에 맞는 QueryClient를 자동으로 반환합니다.
- 서버 환경: 항상 새로운 인스턴스 생성 (요청 격리)
- 클라이언트 환경: 싱글톤 패턴 사용 (상태 유지)

## Parameters

### options?

[`QueryClientOptions`](../interfaces/QueryClientOptions.md)

QueryClient 옵션 (제공되지 않으면 전역 기본 설정 사용)

## Returns

[`QueryClient`](../classes/QueryClient.md)

QueryClient 인스턴스
