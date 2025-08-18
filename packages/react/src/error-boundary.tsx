import * as React from 'react';
import type { FetchError } from 'next-unified-query-core';

/**
 * Error Boundary Props
 */
export interface QueryErrorBoundaryProps {
	/**
	 * Fallback UI를 렌더링하는 함수
	 * @param error - 발생한 에러
	 * @param reset - Error Boundary를 리셋하는 함수
	 */
	fallback?: (error: Error, reset: () => void) => React.ReactNode;
	
	/**
	 * 에러 발생 시 호출되는 콜백
	 * 에러 로깅이나 모니터링 서비스 전송에 사용
	 */
	onError?: (error: Error, errorInfo: { componentStack: string }) => void;
	
	/**
	 * Error Boundary가 리셋될 때 호출되는 콜백
	 */
	onReset?: () => void;
	
	/**
	 * 이 키들이 변경되면 Error Boundary가 자동으로 리셋됨
	 */
	resetKeys?: Array<string | number>;
	
	/**
	 * Error Boundary로 감쌀 컴포넌트
	 */
	children: React.ReactNode;
}

interface QueryErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * 내부 Error Boundary 클래스 컴포넌트
 * React 18과 19 호환을 위한 타입 처리
 */
class QueryErrorBoundaryClass extends React.Component<
	QueryErrorBoundaryProps,
	QueryErrorBoundaryState
> {
	constructor(props: QueryErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	/**
	 * React 공식 Error Boundary 메서드
	 * 에러 발생 시 state를 업데이트하여 fallback UI를 렌더링합니다.
	 */
	static getDerivedStateFromError(error: Error): QueryErrorBoundaryState {
		// 다음 렌더링에서 fallback UI를 표시하도록 state 업데이트
		return { hasError: true, error };
	}

	/**
	 * React 공식 Error Boundary 메서드
	 * 에러 정보를 로깅하고 부수 효과를 처리합니다.
	 */
	componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
		// 에러 로깅 콜백 호출
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}
		
		// FetchError인 경우 추가 정보 로깅
		if (this.isFetchError(error)) {
			console.error('Query Error Details:', {
				status: error.response?.status,
				statusText: error.response?.statusText,
				url: error.config?.url,
				method: error.config?.method,
				message: error.message,
				code: error.code,
				componentStack: errorInfo.componentStack
			});
		} else {
			console.error('Error caught by QueryErrorBoundary:', error, errorInfo);
		}
	}

	componentDidUpdate(prevProps: QueryErrorBoundaryProps) {
		// resetKeys가 변경되면 자동으로 Error Boundary 리셋
		if (this.state.hasError && this.props.resetKeys && prevProps.resetKeys) {
			const hasResetKeyChanged = 
				this.props.resetKeys.length !== prevProps.resetKeys.length ||
				this.props.resetKeys.some((key, idx) => key !== prevProps.resetKeys![idx]);
			
			if (hasResetKeyChanged) {
				this.reset();
			}
		} else if (this.state.hasError && this.props.resetKeys && !prevProps.resetKeys) {
			// resetKeys가 새로 추가된 경우
			this.reset();
		}
	}

	/**
	 * Error Boundary를 리셋하고 정상 상태로 되돌립니다.
	 */
	reset = () => {
		this.props.onReset?.();
		this.setState({ hasError: false, error: null });
	};

	/**
	 * 에러가 FetchError 인스턴스인지 확인합니다.
	 */
	private isFetchError(error: unknown): error is FetchError {
		return (
			error !== null &&
			typeof error === 'object' &&
			'config' in error &&
			'response' in error &&
			'code' in error
		);
	}

	render() {
		if (this.state.hasError && this.state.error) {
			// 커스텀 fallback이 제공된 경우
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.reset);
			}
			
			// 기본 fallback UI
			return (
				<div 
					role="alert"
					aria-live="assertive"
					style={{ padding: '20px', border: '1px solid #f0f0f0', borderRadius: '4px' }}
				>
					<h2 style={{ color: '#d32f2f', marginTop: 0 }}>Something went wrong</h2>
					<p style={{ color: '#666' }}>An error occurred while rendering this component.</p>
					<details style={{ marginTop: '16px', cursor: 'pointer' }}>
						<summary style={{ cursor: 'pointer', outline: 'none' }}>
							Error details
						</summary>
						<pre 
							style={{ 
								marginTop: '8px',
								padding: '12px',
								backgroundColor: '#f5f5f5',
								borderRadius: '4px',
								overflow: 'auto',
								fontSize: '12px',
								whiteSpace: 'pre-wrap'
							}}
							aria-label="Error stack trace"
						>
							{this.state.error.toString()}
							{this.state.error.stack && (
								<>
									{'\n\nStack trace:\n'}
									{this.state.error.stack}
								</>
							)}
						</pre>
					</details>
					<button
						onClick={this.reset}
						style={{
							marginTop: '16px',
							padding: '8px 16px',
							backgroundColor: '#1976d2',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '14px'
						}}
						aria-label="Reset error boundary and try again"
					>
						Try again
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}

/**
 * Query Error Boundary 컴포넌트
 * 
 * React 공식 Error Boundary 패턴을 기반으로 Next Unified Query에 최적화된 Error Boundary입니다.
 * 하위 컴포넌트에서 발생하는 에러를 캐치하고 fallback UI를 표시합니다.
 * 
 * @example
 * ```tsx
 * <QueryErrorBoundary
 *   fallback={(error, reset) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={reset}>Retry</button>
 *     </div>
 *   )}
 *   onError={(error) => console.error(error)}
 * >
 *   <MyComponent />
 * </QueryErrorBoundary>
 * ```
 */
/**
 * QueryErrorBoundaryComponent 인터페이스
 * React 18/19 호환을 위한 커스텀 타입 정의
 * 
 * @important 이 인터페이스는 React 버전 간 호환성을 위해 필수적입니다.
 * React.FC나 다른 내장 타입을 사용하면 React 18과 19 사이의 타입 불일치로 인해
 * 컴파일 에러가 발생할 수 있습니다.
 */
interface QueryErrorBoundaryComponent {
	(props: QueryErrorBoundaryProps): React.JSX.Element;
	displayName?: string;
}

/**
 * Query Error Boundary 컴포넌트 구현
 * 
 * @important React 18/19 호환성을 위해 다음과 같이 구현됨:
 * 1. 함수 시그니처에서 QueryErrorBoundaryProps 타입 명시 (타입 추론 유지)
 * 2. React.createElement 사용 (클래스 컴포넌트를 함수로 래핑)
 * 3. as any 캐스팅 (React 버전 간 타입 차이 해결)
 * 4. 반환 타입을 React.JSX.Element로 명시 (일관된 타입)
 * 5. QueryErrorBoundaryComponent 인터페이스로 캐스팅 (타입 안정성)
 */
export const QueryErrorBoundary = ((props: QueryErrorBoundaryProps) => {
	// 내부적으로 클래스 컴포넌트 사용하되, any로 타입 캐스팅하여 호환성 확보
	return React.createElement(
		QueryErrorBoundaryClass as any,
		props
	) as React.JSX.Element;
}) as QueryErrorBoundaryComponent;

QueryErrorBoundary.displayName = 'QueryErrorBoundary';