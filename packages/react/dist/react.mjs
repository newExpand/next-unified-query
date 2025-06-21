"use client";

// src/hooks/use-query.ts
import { useEffect, useRef as useRef2, useSyncExternalStore, useCallback } from "react";
import { isObject, has, isFunction } from "es-toolkit/compat";

// src/query-client-provider.tsx
import React, { createContext, useContext, useRef } from "react";
import { getQueryClient } from "next-unified-query-core";
var QueryClientContext = createContext(null);
function HydrationBoundary({
  state,
  children
}) {
  const client = useQueryClient();
  const hydratedRef = useRef(false);
  if (state && !hydratedRef.current) {
    client.hydrate(state);
    hydratedRef.current = true;
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, children);
}
function QueryClientProvider({
  client,
  options,
  setupInterceptors,
  children
}) {
  const queryClient = client || getQueryClient({
    ...options,
    setupInterceptors: setupInterceptors || options?.setupInterceptors
  });
  return /* @__PURE__ */ React.createElement(QueryClientContext.Provider, { value: queryClient }, children);
}
function useQueryClient() {
  const ctx = useContext(QueryClientContext);
  if (!ctx)
    throw new Error(
      "You must wrap your component tree with <QueryClientProvider>."
    );
  return ctx;
}

// src/hooks/use-query.ts
import { validateQueryConfig } from "next-unified-query-core";
import {
  QueryObserver
} from "next-unified-query-core";
function useQuery(arg1, arg2) {
  if (isObject(arg1) && has(arg1, "cacheKey") && isFunction(arg1.cacheKey)) {
    const query = arg1;
    validateQueryConfig(query);
    const options = arg2 ?? {};
    const params = options.params;
    const cacheKey = query.cacheKey?.(params);
    const url = query.url?.(params);
    const queryFn = query.queryFn;
    const schema = query.schema;
    const placeholderData = options.placeholderData ?? query.placeholderData;
    const fetchConfig = options.fetchConfig ?? query.fetchConfig;
    const select = options.select ?? query.select;
    const enabled = has(options, "enabled") ? options.enabled : isFunction(query.enabled) ? query.enabled(params) : query.enabled;
    return _useQueryObserver({
      ...query,
      ...options,
      enabled,
      cacheKey,
      url,
      queryFn,
      params,
      schema,
      placeholderData,
      fetchConfig,
      select
    });
  }
  return _useQueryObserver({
    ...arg1
  });
}
function _useQueryObserver(options) {
  validateQueryConfig(options);
  const queryClient = useQueryClient();
  const observerRef = useRef2(void 0);
  const optionsHashRef = useRef2("");
  const defaultResultRef = useRef2({
    data: void 0,
    error: void 0,
    isLoading: true,
    isFetching: true,
    isError: false,
    isSuccess: false,
    isStale: true,
    isPlaceholderData: false,
    refetch: () => {
    }
  });
  const createOptionsHash = (opts) => {
    const hashableOptions = {
      cacheKey: opts.cacheKey,
      url: opts.url,
      params: opts.params,
      enabled: opts.enabled,
      staleTime: opts.staleTime,
      gcTime: opts.gcTime
      // queryFn, select, placeholderData 등 함수들은 해시에서 제외 (항상 새로 생성되므로)
    };
    return JSON.stringify(hashableOptions);
  };
  const currentHash = createOptionsHash(options);
  const shouldUpdate = !observerRef.current || optionsHashRef.current !== currentHash;
  if (!observerRef.current) {
    observerRef.current = new QueryObserver(queryClient, {
      ...options,
      key: options.cacheKey
    });
    optionsHashRef.current = currentHash;
  } else if (shouldUpdate) {
    observerRef.current.setOptions({
      ...options,
      key: options.cacheKey
    });
    optionsHashRef.current = currentHash;
  }
  const subscribe = useCallback((callback) => {
    return observerRef.current.subscribe(callback);
  }, []);
  const getSnapshot = useCallback(() => {
    if (!observerRef.current) {
      return defaultResultRef.current;
    }
    return observerRef.current.getCurrentResult();
  }, []);
  const result = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
    // getServerSnapshot도 동일하게
  );
  useEffect(() => {
    return () => {
      observerRef.current?.destroy();
    };
  }, []);
  return result;
}

// src/hooks/use-mutation.ts
import { useReducer, useCallback as useCallback2, useRef as useRef3 } from "react";
import { validateMutationConfig } from "next-unified-query-core";
import { z } from "zod/v4";
import { merge, isArray, isFunction as isFunction2 } from "es-toolkit/compat";
var getInitialState = () => ({
  data: void 0,
  error: null,
  isPending: false,
  isSuccess: false,
  isError: false
});
function isOptionsBasedUsage(arg) {
  return isFunction2(arg.mutationFn) && !arg.url && !arg.method;
}
function validateFactoryConfig(config) {
  validateMutationConfig(config);
}
function validateRequestData(data, schema) {
  if (!schema) return data;
  try {
    return schema.parse(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const zodErr = e;
      const validationError = new Error(
        `Request validation failed: ${zodErr.issues.map((issue) => issue.message).join(", ")}`
      );
      validationError.isValidationError = true;
      validationError.details = zodErr.issues;
      throw validationError;
    }
    throw e;
  }
}
function createUrlBasedMutationFn(config) {
  return async (variables, fetcher) => {
    const url = isFunction2(config.url) ? config.url(variables) : config.url;
    const method = config.method;
    const dataForRequest = validateRequestData(variables, config.requestSchema);
    const requestConfig = merge(
      { schema: config.responseSchema },
      config.fetchConfig || {},
      {
        url,
        method,
        data: dataForRequest
      }
    );
    const response = await fetcher.request(requestConfig);
    return response.data;
  };
}
function extractMutationFnFromFactory(config) {
  validateFactoryConfig(config);
  if (isFunction2(config.mutationFn)) {
    return config.mutationFn;
  }
  return createUrlBasedMutationFn(config);
}
function convertFactoryToOptions(factoryConfig, overrideOptions = {}) {
  const mutationFn = extractMutationFnFromFactory(factoryConfig);
  return merge({}, factoryConfig, overrideOptions, {
    mutationFn
  });
}
async function handleInvalidateQueries(invalidateQueriesOption, data, variables, context, queryClient) {
  if (!invalidateQueriesOption) return;
  let keysToInvalidate;
  if (isFunction2(invalidateQueriesOption)) {
    keysToInvalidate = invalidateQueriesOption(
      data,
      variables,
      context
    );
  } else {
    keysToInvalidate = invalidateQueriesOption;
  }
  if (isArray(keysToInvalidate)) {
    keysToInvalidate.forEach((queryKey) => {
      queryClient.invalidateQueries(queryKey);
    });
  }
}
async function executeSuccessCallbacks(data, variables, context, options) {
  if (options.hookOnSuccess) {
    await options.hookOnSuccess(data, variables, context);
  }
  if (options.localOnSuccess) {
    options.localOnSuccess(data, variables, context);
  }
}
async function executeErrorCallbacks(error, variables, context, options) {
  if (options.hookOnError) {
    await options.hookOnError(error, variables, context);
  }
  if (options.localOnError) {
    options.localOnError(error, variables, context);
  }
}
async function executeSettledCallbacks(data, error, variables, context, options) {
  if (options.hookOnSettled) {
    await options.hookOnSettled(data, error, variables, context);
  }
  if (options.localOnSettled) {
    options.localOnSettled(data, error, variables, context);
  }
}
function useMutation(arg1, arg2) {
  const queryClient = useQueryClient();
  let combinedOptions;
  if (isOptionsBasedUsage(arg1)) {
    combinedOptions = arg1;
  } else {
    combinedOptions = convertFactoryToOptions(arg1, arg2);
  }
  return _useMutationInternal(combinedOptions, queryClient);
}
function _useMutationInternal(options, queryClient) {
  const fetcher = queryClient.getFetcher();
  const [state, dispatch] = useReducer(
    (prevState, action) => {
      switch (action.type) {
        case "MUTATE":
          return {
            ...prevState,
            isPending: true,
            isSuccess: false,
            isError: false,
            error: null
          };
        case "SUCCESS":
          return {
            ...prevState,
            isPending: false,
            isSuccess: true,
            isError: false,
            data: action.data,
            error: null
          };
        case "ERROR":
          return {
            ...prevState,
            isPending: false,
            isSuccess: false,
            isError: true,
            error: action.error
          };
        case "RESET":
          return getInitialState();
        default:
          return prevState;
      }
    },
    getInitialState()
  );
  const latestOptions = useRef3(options);
  latestOptions.current = options;
  const mutateCallback = useCallback2(
    async (variables, mutateLocalOptions) => {
      dispatch({ type: "MUTATE", variables });
      let context;
      try {
        const onMutateCb = latestOptions.current.onMutate;
        if (onMutateCb) {
          context = await onMutateCb(variables);
        }
        const data = await latestOptions.current.mutationFn(variables, fetcher);
        dispatch({ type: "SUCCESS", data });
        await executeSuccessCallbacks(data, variables, context, {
          hookOnSuccess: latestOptions.current.onSuccess,
          localOnSuccess: mutateLocalOptions?.onSuccess
        });
        await handleInvalidateQueries(
          latestOptions.current.invalidateQueries,
          data,
          variables,
          context,
          queryClient
        );
        await executeSettledCallbacks(
          data,
          null,
          variables,
          context,
          {
            hookOnSettled: latestOptions.current.onSettled,
            localOnSettled: mutateLocalOptions?.onSettled
          }
        );
        return data;
      } catch (err) {
        const error = err;
        dispatch({ type: "ERROR", error });
        await executeErrorCallbacks(error, variables, context, {
          hookOnError: latestOptions.current.onError,
          localOnError: mutateLocalOptions?.onError
        });
        await executeSettledCallbacks(
          void 0,
          error,
          variables,
          context,
          {
            hookOnSettled: latestOptions.current.onSettled,
            localOnSettled: mutateLocalOptions?.onSettled
          }
        );
        throw error;
      }
    },
    [queryClient, fetcher]
  );
  const mutate = (variables, options2) => {
    mutateCallback(variables, options2).catch(() => {
    });
  };
  const mutateAsync = useCallback2(
    (variables, options2) => {
      return mutateCallback(variables, options2);
    },
    [mutateCallback]
  );
  const reset = useCallback2(() => {
    dispatch({ type: "RESET" });
  }, []);
  return { ...state, mutate, mutateAsync, reset };
}
export {
  HydrationBoundary,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient
};
//# sourceMappingURL=react.mjs.map