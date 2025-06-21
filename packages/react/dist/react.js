"use client";
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/react.ts
var react_exports = {};
__export(react_exports, {
  HydrationBoundary: () => HydrationBoundary,
  QueryClientProvider: () => QueryClientProvider,
  useMutation: () => useMutation,
  useQuery: () => useQuery,
  useQueryClient: () => useQueryClient
});
module.exports = __toCommonJS(react_exports);

// src/hooks/use-query.ts
var import_react2 = require("react");
var import_compat = require("es-toolkit/compat");

// src/query-client-provider.tsx
var import_react = __toESM(require("react"));
var import_next_unified_query_core = require("next-unified-query-core");
var QueryClientContext = (0, import_react.createContext)(null);
function HydrationBoundary({
  state,
  children
}) {
  const client = useQueryClient();
  const hydratedRef = (0, import_react.useRef)(false);
  if (state && !hydratedRef.current) {
    client.hydrate(state);
    hydratedRef.current = true;
  }
  return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, children);
}
function QueryClientProvider({
  client,
  options,
  setupInterceptors,
  children
}) {
  const queryClient = client || (0, import_next_unified_query_core.getQueryClient)({
    ...options,
    setupInterceptors: setupInterceptors || options?.setupInterceptors
  });
  return /* @__PURE__ */ import_react.default.createElement(QueryClientContext.Provider, { value: queryClient }, children);
}
function useQueryClient() {
  const ctx = (0, import_react.useContext)(QueryClientContext);
  if (!ctx)
    throw new Error(
      "You must wrap your component tree with <QueryClientProvider>."
    );
  return ctx;
}

// src/hooks/use-query.ts
var import_next_unified_query_core2 = require("next-unified-query-core");
var import_next_unified_query_core3 = require("next-unified-query-core");
function useQuery(arg1, arg2) {
  if ((0, import_compat.isObject)(arg1) && (0, import_compat.has)(arg1, "cacheKey") && (0, import_compat.isFunction)(arg1.cacheKey)) {
    const query = arg1;
    (0, import_next_unified_query_core2.validateQueryConfig)(query);
    const options = arg2 ?? {};
    const params = options.params;
    const cacheKey = query.cacheKey?.(params);
    const url = query.url?.(params);
    const queryFn = query.queryFn;
    const schema = query.schema;
    const placeholderData = options.placeholderData ?? query.placeholderData;
    const fetchConfig = options.fetchConfig ?? query.fetchConfig;
    const select = options.select ?? query.select;
    const enabled = (0, import_compat.has)(options, "enabled") ? options.enabled : (0, import_compat.isFunction)(query.enabled) ? query.enabled(params) : query.enabled;
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
  (0, import_next_unified_query_core2.validateQueryConfig)(options);
  const queryClient = useQueryClient();
  const observerRef = (0, import_react2.useRef)(void 0);
  const optionsHashRef = (0, import_react2.useRef)("");
  const defaultResultRef = (0, import_react2.useRef)({
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
    observerRef.current = new import_next_unified_query_core3.QueryObserver(queryClient, {
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
  const subscribe = (0, import_react2.useCallback)((callback) => {
    return observerRef.current.subscribe(callback);
  }, []);
  const getSnapshot = (0, import_react2.useCallback)(() => {
    if (!observerRef.current) {
      return defaultResultRef.current;
    }
    return observerRef.current.getCurrentResult();
  }, []);
  const result = (0, import_react2.useSyncExternalStore)(
    subscribe,
    getSnapshot,
    getSnapshot
    // getServerSnapshot도 동일하게
  );
  (0, import_react2.useEffect)(() => {
    return () => {
      observerRef.current?.destroy();
    };
  }, []);
  return result;
}

// src/hooks/use-mutation.ts
var import_react3 = require("react");
var import_next_unified_query_core4 = require("next-unified-query-core");
var import_v4 = require("zod/v4");
var import_compat2 = require("es-toolkit/compat");
var getInitialState = () => ({
  data: void 0,
  error: null,
  isPending: false,
  isSuccess: false,
  isError: false
});
function isOptionsBasedUsage(arg) {
  return (0, import_compat2.isFunction)(arg.mutationFn) && !arg.url && !arg.method;
}
function validateFactoryConfig(config) {
  (0, import_next_unified_query_core4.validateMutationConfig)(config);
}
function validateRequestData(data, schema) {
  if (!schema) return data;
  try {
    return schema.parse(data);
  } catch (e) {
    if (e instanceof import_v4.z.ZodError) {
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
    const url = (0, import_compat2.isFunction)(config.url) ? config.url(variables) : config.url;
    const method = config.method;
    const dataForRequest = validateRequestData(variables, config.requestSchema);
    const requestConfig = (0, import_compat2.merge)(
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
  if ((0, import_compat2.isFunction)(config.mutationFn)) {
    return config.mutationFn;
  }
  return createUrlBasedMutationFn(config);
}
function convertFactoryToOptions(factoryConfig, overrideOptions = {}) {
  const mutationFn = extractMutationFnFromFactory(factoryConfig);
  return (0, import_compat2.merge)({}, factoryConfig, overrideOptions, {
    mutationFn
  });
}
async function handleInvalidateQueries(invalidateQueriesOption, data, variables, context, queryClient) {
  if (!invalidateQueriesOption) return;
  let keysToInvalidate;
  if ((0, import_compat2.isFunction)(invalidateQueriesOption)) {
    keysToInvalidate = invalidateQueriesOption(
      data,
      variables,
      context
    );
  } else {
    keysToInvalidate = invalidateQueriesOption;
  }
  if ((0, import_compat2.isArray)(keysToInvalidate)) {
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
  const [state, dispatch] = (0, import_react3.useReducer)(
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
  const latestOptions = (0, import_react3.useRef)(options);
  latestOptions.current = options;
  const mutateCallback = (0, import_react3.useCallback)(
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
  const mutateAsync = (0, import_react3.useCallback)(
    (variables, options2) => {
      return mutateCallback(variables, options2);
    },
    [mutateCallback]
  );
  const reset = (0, import_react3.useCallback)(() => {
    dispatch({ type: "RESET" });
  }, []);
  return { ...state, mutate, mutateAsync, reset };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HydrationBoundary,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient
});
//# sourceMappingURL=react.js.map