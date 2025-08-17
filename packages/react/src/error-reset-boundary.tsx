import React, { createContext, useContext, useState, useCallback } from "react";
import { QueryErrorBoundary } from "./error-boundary";
import type { QueryErrorBoundaryProps } from "./error-boundary";

/**
 * Error Reset Context
 * Error Boundary를 프로그래매틱하게 리셋할 수 있는 함수를 제공합니다.
 */
const ErrorResetContext = createContext<() => void>(() => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      "useErrorResetBoundary must be used within QueryErrorResetBoundary"
    );
  }
});

/**
 * Error Boundary를 리셋하는 함수를 반환하는 Hook
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const resetErrorBoundary = useErrorResetBoundary();
 *
 *   const handleRetry = () => {
 *     // 상태 초기화 등의 작업 수행
 *     resetErrorBoundary();
 *   };
 * }
 * ```
 */
export const useErrorResetBoundary = () => {
  return useContext(ErrorResetContext);
};

export interface QueryErrorResetBoundaryProps
  extends Omit<QueryErrorBoundaryProps, "resetKeys" | "onReset"> {
  /**
   * Error Boundary가 리셋될 때 호출되는 콜백
   */
  onReset?: () => void;
}

/**
 * Error Reset Boundary 컴포넌트
 *
 * QueryErrorBoundary를 감싸고 리셋 기능을 Context로 제공합니다.
 * 하위 컴포넌트에서 useErrorResetBoundary Hook을 사용하여 Error Boundary를 리셋할 수 있습니다.
 *
 * @example
 * ```tsx
 * <QueryErrorResetBoundary
 *   fallback={(error, reset) => <ErrorFallback error={error} reset={reset} />}
 * >
 *   <App />
 * </QueryErrorResetBoundary>
 * ```
 */
export function QueryErrorResetBoundary({
  children,
  onReset,
  ...errorBoundaryProps
}: QueryErrorResetBoundaryProps) {
  const [resetCount, setResetCount] = useState(0);

  const reset = useCallback(() => {
    setResetCount((count) => count + 1);
    onReset?.();
  }, [onReset]);

  return (
    <ErrorResetContext.Provider value={reset}>
      <QueryErrorBoundary
        {...errorBoundaryProps}
        resetKeys={[resetCount]}
        onReset={reset}
      >
        {children}
      </QueryErrorBoundary>
    </ErrorResetContext.Provider>
  );
}
