# Functions

This section contains all the function definitions in next-unified-query.

## Core Functions

### Factory Functions
- **[createQueryFactory](createQueryFactory)** - Create type-safe query definitions
- **[createMutationFactory](createMutationFactory)** - Create type-safe mutation definitions

### Client Management
- **[getQueryClient](getQueryClient)** - Get the global query client instance
- **[resetQueryClient](resetQueryClient)** - Reset the global query client
- **[configureQueryClient](configureQueryClient)** - Configure the global query client

### SSR Support
- **[ssrPrefetch](ssrPrefetch)** - Prefetch queries for server-side rendering

### HTTP Methods
- **[get](../variables/get)** - GET request function
- **[post](../variables/post)** - POST request function
- **[put](../variables/put)** - PUT request function
- **[patch](../variables/patch)** - PATCH request function
- **[del](../variables/del)** - DELETE request function

### Utility Functions
- **[createError](createError)** - Create standardized error objects
- **[handleFetchError](handleFetchError)** - Handle fetch errors
- **[getHeaders](getHeaders)** - Extract headers from response
- **[getStatus](getStatus)** - Extract status code from response  
- **[hasStatus](hasStatus)** - Check if response has specific status code

### Validation Functions
- **[getValidationErrors](getValidationErrors)** - Extract validation errors from response
- **[isFetchError](isFetchError)** - Check if error is a FetchError
- **[isValidationError](isValidationError)** - Check if error is a validation error
- **[hasErrorCode](hasErrorCode)** - Check if error has specific code