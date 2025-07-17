[**Next Unified Query v1.0.0**](README.md)

***

# Next Unified Query v1.0.0

## Enumerations

- [ContentType](enumerations/ContentType.md)
- [ResponseType](enumerations/ResponseType.md)

## Classes

- [QueryClient](classes/QueryClient.md)
- [QueryObserver](classes/QueryObserver.md)
- [FetchError](classes/FetchError.md)

## Interfaces

- [QueryCacheOptions](interfaces/QueryCacheOptions.md)
- [QueryClientOptionsWithInterceptors](interfaces/QueryClientOptionsWithInterceptors.md)
- [QueryObserverResult](interfaces/QueryObserverResult.md)
- [ApiErrorResponse](interfaces/ApiErrorResponse.md)
- [AuthRetryOption](interfaces/AuthRetryOption.md)
- [FetchConfig](interfaces/FetchConfig.md)
- [RequestConfig](interfaces/RequestConfig.md)
- [NextTypeResponse](interfaces/NextTypeResponse.md)
- [InterceptorHandle](interfaces/InterceptorHandle.md)
- [Interceptors](interfaces/Interceptors.md)
- [CancelablePromise](interfaces/CancelablePromise.md)
- [NextTypeFetch](interfaces/NextTypeFetch.md)
- [QueryFetcher](interfaces/QueryFetcher.md)

## Type Aliases

- [QueryState](type-aliases/QueryState.md)
- [InterceptorSetupFunction](type-aliases/InterceptorSetupFunction.md)
- [InferIfZodSchema](type-aliases/InferIfZodSchema.md)
- [MutationConfig](type-aliases/MutationConfig.md)
- [ExtractMutationVariables](type-aliases/ExtractMutationVariables.md)
- [ExtractMutationData](type-aliases/ExtractMutationData.md)
- [ExtractMutationError](type-aliases/ExtractMutationError.md)
- [QueryConfig](type-aliases/QueryConfig.md)
- [ExtractParams](type-aliases/ExtractParams.md)
- [ExtractQueryData](type-aliases/ExtractQueryData.md)
- [QueryObserverOptions](type-aliases/QueryObserverOptions.md)
- [HttpMethod](type-aliases/HttpMethod.md)
- [RequestInterceptor](type-aliases/RequestInterceptor.md)
- [ResponseInterceptor](type-aliases/ResponseInterceptor.md)
- [ErrorInterceptor](type-aliases/ErrorInterceptor.md)
- [QueryKey](type-aliases/QueryKey.md)
- [ErrorCodeType](type-aliases/ErrorCodeType.md)

## Variables

- [request](variables/request.md)
- [get](variables/get.md)
- [post](variables/post.md)
- [put](variables/put.md)
- [del](variables/del.md)
- [patch](variables/patch.md)
- [head](variables/head.md)
- [options](variables/options.md)
- [ntFetch](variables/ntFetch.md)
- [interceptors](variables/interceptors.md)
- [defaultInstance](variables/defaultInstance.md)
- [interceptorTypes](variables/interceptorTypes.md)
- [ErrorCode](variables/ErrorCode.md)

## Functions

- [createFetch](functions/createFetch.md)
- [getQueryClient](functions/getQueryClient.md)
- [resetQueryClient](functions/resetQueryClient.md)
- [createQueryClientWithInterceptors](functions/createQueryClientWithInterceptors.md)
- [createMutationFactory](functions/createMutationFactory.md)
- [createQueryFactory](functions/createQueryFactory.md)
- [ssrPrefetch](functions/ssrPrefetch.md)
- [isFetchError](functions/isFetchError.md)
- [isValidationError](functions/isValidationError.md)
- [getValidationErrors](functions/getValidationErrors.md)
- [hasErrorCode](functions/hasErrorCode.md)
- [handleFetchError](functions/handleFetchError.md)
- [handleHttpError](functions/handleHttpError.md)
- [errorToResponse](functions/errorToResponse.md)
- [unwrap](functions/unwrap.md)
- [getStatus](functions/getStatus.md)
- [getHeaders](functions/getHeaders.md)
- [hasStatus](functions/hasStatus.md)
- [createError](functions/createError.md)
