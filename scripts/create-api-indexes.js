#!/usr/bin/env node

/**
 * Create index pages for TypeDoc generated API documentation
 * Run this after TypeDoc generation
 */

const fs = require('fs');
const path = require('path');

const API_DOCS_PATH = path.join(__dirname, '..', 'apps', 'docs', 'public', 'api-docs');

// Index page templates
const indexes = {
  'classes.md': `# Classes

This section contains all the class definitions in next-unified-query.

## Available Classes

- **[FetchError](FetchError)** - Error class for HTTP request failures
- **[QueryClient](QueryClient)** - Main query client for managing queries and cache  
- **[QueryObserver](QueryObserver)** - Observer for tracking query state changes`,

  'functions.md': `# Functions

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
- **[hasErrorCode](hasErrorCode)** - Check if error has specific code`,

  'interfaces.md': `# Interfaces

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
- **[AuthRetryOption](AuthRetryOption)** - Authentication retry options`,

  'type-aliases.md': `# Type Aliases

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
- **[InferIfZodSchema](InferIfZodSchema)** - Infer type from Zod schema`,

  'variables.md': `# Variables

This section contains all the variable definitions in next-unified-query.

## HTTP Method Functions

### Core HTTP Methods
- **[get](get)** - GET request function
- **[post](post)** - POST request function  
- **[put](put)** - PUT request function
- **[patch](patch)** - PATCH request function
- **[del](del)** - DELETE request function
- **[head](head)** - HEAD request function

### Request Function
- **[request](request)** - Generic HTTP request function

## Instance & Configuration

### Default Instance
- **[defaultInstance](defaultInstance)** - Default HTTP client instance
- **[ntFetch](ntFetch)** - Next Type Fetch instance

### Configuration
- **[options](options)** - Default configuration options

### Interceptors
- **[interceptors](interceptors)** - Global interceptor configuration
- **[interceptorTypes](interceptorTypes)** - Available interceptor types

## Error Handling

### Error Codes
- **[ErrorCode](ErrorCode)** - Standard error codes for HTTP requests`,

  'enumerations.md': `# Enumerations

This section contains all the enumeration definitions in next-unified-query.

## HTTP Enumerations

### Content Types
- **[ContentType](ContentType)** - Standard HTTP content type constants

### Response Types  
- **[ResponseType](ResponseType)** - HTTP response type classifications

## Usage

These enumerations provide strongly-typed constants for common HTTP operations, ensuring type safety and reducing magic strings in your code.`
};

// Create index files
function createIndexFiles() {
  console.log('📝 Creating API documentation index files...');
  
  Object.entries(indexes).forEach(([filename, content]) => {
    const filepath = path.join(API_DOCS_PATH, filename);
    
    try {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`✅ Created: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to create ${filename}:`, error.message);
    }
  });
  
  console.log('✨ API documentation indexes created successfully!');
}

// Run if executed directly
if (require.main === module) {
  createIndexFiles();
}

module.exports = { createIndexFiles };