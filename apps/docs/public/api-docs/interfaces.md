# Interfaces

This section contains all the interface definitions in next-unified-query.

## Configuration Interfaces

### Core Configuration
- **[FetchConfig](FetchConfig)** - HTTP request configuration
- **[QueryClientOptions](QueryClientOptions)** - Query client configuration options
- **[InterceptorConfig](InterceptorConfig)** - Interceptor configuration
- **[Interceptors](Interceptors)** - Request/response interceptor configuration

### Query & Mutation Types
- **[QueryObserverResult](QueryObserverResult)** - Query result interface
- **[QueryFetcher](QueryFetcher)** - Query fetcher interface
- **[NextTypeFetch](NextTypeFetch)** - Main fetch interface

### Response Types
- **[NextTypeResponse](NextTypeResponse)** - HTTP response interface
- **[ApiErrorResponse](ApiErrorResponse)** - API error response structure

### Cache Configuration
- **[QueryCacheOptions](QueryCacheOptions)** - Query cache configuration options

### Request Configuration  
- **[RequestConfig](RequestConfig)** - HTTP request configuration interface

### Utility Interfaces
- **[CancelablePromise](CancelablePromise)** - Cancelable promise interface
- **[InterceptorHandle](InterceptorHandle)** - Interceptor handle interface
- **[AuthRetryOption](AuthRetryOption)** - Authentication retry options