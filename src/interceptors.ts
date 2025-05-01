import type { ErrorInterceptor, RequestInterceptor, ResponseInterceptor } from "./types/index.js";

/**
 * 인터셉터 매니저 클래스
 */
export class InterceptorManager<T extends RequestInterceptor | ResponseInterceptor | ErrorInterceptor> {
	private handlers: Array<{
		id: number;
		handler: T;
	} | null> = [];

	private idCounter = 0;

	/**
	 * 인터셉터 추가
	 * @param handler 인터셉터 핸들러 함수
	 * @returns 인터셉터 ID (제거 시 사용)
	 */
	use(handler: T): number {
		const id = this.idCounter++;
		this.handlers.push({
			id,
			handler,
		});
		return id;
	}

	/**
	 * 인터셉터 제거
	 * @param id 제거할 인터셉터 ID
	 */
	eject(id: number): void {
		const index = this.handlers.findIndex((h) => h !== null && h.id === id);
		if (index !== -1) {
			this.handlers[index] = null;
		}
	}

	/**
	 * 모든 인터셉터 실행
	 * @param value 인터셉터에 전달할 값
	 * @returns 처리된 값
	 */
	async forEach<V>(value: V): Promise<V> {
		let result = value;

		for (const handler of this.handlers) {
			if (handler !== null) {
				// 핸들러 실행 - T와 V 타입이 항상 일치하지 않으므로 타입 검사 우회
				result = (await (handler.handler as (arg: unknown) => unknown | Promise<unknown>)(result)) as V;
			}
		}

		return result;
	}
}

/**
 * 요청/응답 인터셉터 생성
 */
export function createInterceptors() {
	const requestInterceptors = new InterceptorManager<RequestInterceptor>();
	const responseInterceptors = new InterceptorManager<ResponseInterceptor>();
	const responseErrorInterceptors = new InterceptorManager<ErrorInterceptor>();

	return {
		request: {
			use: (interceptor: RequestInterceptor) => requestInterceptors.use(interceptor),
			eject: (id: number) => requestInterceptors.eject(id),
			run: requestInterceptors.forEach.bind(requestInterceptors),
		},
		response: {
			use: (onFulfilled?: ResponseInterceptor, onRejected?: ErrorInterceptor) => {
				const fulfillId = onFulfilled ? responseInterceptors.use(onFulfilled) : -1;

				const rejectId = onRejected ? responseErrorInterceptors.use(onRejected) : -1;

				// 두 인터셉터를 하나의 ID로 연결하여 나중에 제거할 수 있도록 함
				return Math.max(fulfillId, rejectId);
			},
			eject: (id: number) => {
				responseInterceptors.eject(id);
				responseErrorInterceptors.eject(id);
			},
			run: responseInterceptors.forEach.bind(responseInterceptors),
			runError: responseErrorInterceptors.forEach.bind(responseErrorInterceptors),
		},
	};
}
