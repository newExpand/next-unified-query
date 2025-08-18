# Type Aliases

This section contains all the type alias definitions in next-unified-query.

## Core Types

### Query Types
- **[QueryConfig](QueryConfig)** - Query configuration type
- **[QueryKey](QueryKey)** - Cache key type for queries
- **[QueryState](QueryState)** - Query state information
- **[QueryObserverOptions](QueryObserverOptions)** - Query observer configuration options

### Mutation Types
- **[MutationConfig](MutationConfig)** - Mutation configuration type
- **[MutationMethod](MutationMethod)** - Allowed HTTP methods for mutations

### HTTP Types
- **[HttpMethod](HttpMethod)** - Supported HTTP methods

### Interceptor Types
- **[RequestInterceptor](RequestInterceptor)** - Request interceptor function type
- **[ResponseInterceptor](ResponseInterceptor)** - Response interceptor function type
- **[ErrorInterceptor](ErrorInterceptor)** - Error interceptor function type

### Utility Types
- **[ExtractQueryData](ExtractQueryData)** - Extract data type from query config
- **[ExtractParams](ExtractParams)** - Extract parameters type from config
- **[ExtractMutationData](ExtractMutationData)** - Extract data type from mutation config
- **[ExtractMutationError](ExtractMutationError)** - Extract error type from mutation config
- **[ExtractMutationVariables](ExtractMutationVariables)** - Extract variables type from mutation config

### Error Types
- **[ErrorCodeType](ErrorCodeType)** - Error code classification type

### Schema Types
- **[InferIfZodSchema](InferIfZodSchema)** - Infer type from Zod schema