import type {
  ErrorInterceptor,
  RequestInterceptor,
  RequestConfig,
  ResponseInterceptor,
  FetchError,
  NextTypeResponse,
} from "./types";

/**
 * 인터셉터 핸들러와 제거 함수를 함께 반환하는 타입
 */
export interface InterceptorHandle {
  /**
   * 인터셉터 제거 함수
   */
  remove: () => void;
}

/**
 * 인터셉터 유형을 식별하는 심볼 매핑
 * 유니크한 식별자를 통해 인터셉터 그룹 지정 가능
 */
const interceptorTypeSymbols = {
  // 기본 인터셉터 유형
  default: Symbol("default-interceptor"),
  // 인증 관련 인터셉터 - 자동 교체 설정 가능
  auth: Symbol("auth-interceptor"),
  // 로깅 관련 인터셉터 - 자동 교체 설정 가능
  logging: Symbol("logging-interceptor"),
  // 에러 처리 인터셉터 - 자동 교체 설정 가능
  errorHandler: Symbol("error-handler-interceptor"),
};

/**
 * 인터셉터 등록 옵션 (내부용)
 * @internal
 */
interface InterceptorOptions {
  /**
   * 인터셉터 유형 - 같은 유형의 기존 인터셉터를 교체할지 결정
   */
  type?: symbol;

  /**
   * 인터셉터 식별 태그 - 로깅 및 디버깅용
   */
  tag?: string;
}

/**
 * 인터셉터 매니저 클래스
 */
export class InterceptorManager<
  T extends RequestInterceptor | ResponseInterceptor | ErrorInterceptor
> {
  private handlers: Array<{
    id: number;
    handler: T;
    type?: symbol;
    tag?: string;
  } | null> = [];

  private idCounter = 0;

  /**
   * 인터셉터 추가
   * @param handler 인터셉터 핸들러 함수
   * @param options 인터셉터 등록 옵션
   * @returns 제거 함수가 포함된 핸들 객체
   * @note 여러 번 use를 호출하면 등록한 모든 인터셉터가 순차적으로 실행됩니다. (Axios 등과 동일)
   */
  use(handler: T, options?: InterceptorOptions): InterceptorHandle {
    const id = this.idCounter++;
    const type = options?.type || interceptorTypeSymbols.default;
    const tag = options?.tag || "unnamed-interceptor";

    this.handlers.push({
      id,
      handler,
      type,
      tag,
    });

    return {
      remove: () => this.eject(id),
    };
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
   * 특정 유형의 인터셉터 모두 제거
   * @param type 제거할 인터셉터 유형
   */
  ejectByType(type: symbol): void {
    this.handlers.forEach((item, index) => {
      if (item !== null && item.type === type) {
        this.handlers[index] = null;
      }
    });
  }

  /**
   * 모든 인터셉터 제거
   */
  clear(): void {
    this.handlers = [];
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
        result = (await (
          handler.handler as (arg: unknown) => unknown | Promise<unknown>
        )(result)) as V;
      }
    }

    return result;
  }

  /**
   * 디버깅 용도로 현재 등록된 인터셉터 정보 반환
   */
  getRegisteredInterceptors() {
    return this.handlers
      .filter((h) => h !== null)
      .map((h) => ({
        id: h?.id,
        tag: h?.tag || "(unnamed)",
        type: h?.type?.description || "default",
      }));
  }
}

/**
 * 요청 인터셉터 매니저 클래스
 */
export class RequestInterceptorManager {
  private manager = new InterceptorManager<RequestInterceptor>();

  /**
   * 요청 인터셉터 추가
   * @param interceptor 요청 인터셉터 함수
   * @param type 인터셉터 유형 - 기본값은 auth 타입 (자동 교체됨)
   * @returns 제거 함수가 포함된 핸들 객체
   */
  use(
    interceptor: RequestInterceptor,
    type = interceptorTypeSymbols.auth
  ): InterceptorHandle {
    return this.manager.use(interceptor, { type, tag: "request-interceptor" });
  }

  /**
   * 모든 요청 인터셉터 제거
   */
  clear(): void {
    this.manager.clear();
  }

  /**
   * 특정 유형의 인터셉터 모두 제거
   * @param type 제거할 인터셉터 유형
   */
  clearByType(type: symbol): void {
    this.manager.ejectByType(type);
  }

  /**
   * 요청 인터셉터 실행
   */
  async run(config: RequestConfig): Promise<RequestConfig> {
    return this.manager.forEach<RequestConfig>(config);
  }

  /**
   * 디버깅 용도로 현재 등록된 인터셉터 정보 반환
   */
  getRegisteredInterceptors() {
    return this.manager.getRegisteredInterceptors();
  }
}

/**
 * 응답 인터셉터 매니저 클래스
 */
export class ResponseInterceptorManager {
  private manager = new InterceptorManager<ResponseInterceptor>();

  /**
   * 응답 인터셉터 추가
   * @param interceptor 응답 인터셉터 함수
   * @param type 인터셉터 유형 - 기본값은 auth 타입 (자동 교체됨)
   * @returns 제거 함수가 포함된 핸들 객체
   */
  use(
    interceptor: ResponseInterceptor,
    type = interceptorTypeSymbols.auth
  ): InterceptorHandle {
    return this.manager.use(interceptor, { type, tag: "response-interceptor" });
  }

  /**
   * 모든 응답 인터셉터 제거
   */
  clear(): void {
    this.manager.clear();
  }

  /**
   * 특정 유형의 인터셉터 제거
   * @param type 제거할 인터셉터 유형
   */
  clearByType(type: symbol): void {
    this.manager.ejectByType(type);
  }

  /**
   * 응답 인터셉터 실행 (내부용)
   */
  async run<T>(response: NextTypeResponse<T>): Promise<NextTypeResponse<T>> {
    return this.manager.forEach<NextTypeResponse<T>>(response);
  }

  /**
   * 디버깅 용도로 현재 등록된 인터셉터 정보 반환
   */
  getRegisteredInterceptors() {
    return this.manager.getRegisteredInterceptors();
  }
}

/**
 * 에러 인터셉터 매니저 클래스
 */
export class ErrorInterceptorManager {
  private manager = new InterceptorManager<ErrorInterceptor>();

  /**
   * 에러 인터셉터 추가
   * @param interceptor 에러 인터셉터 함수
   * @param type 인터셉터 유형 - 기본값은 errorHandler 타입 (자동 교체됨)
   * @returns 제거 함수가 포함된 핸들 객체
   */
  use(
    interceptor: ErrorInterceptor,
    type = interceptorTypeSymbols.errorHandler
  ): InterceptorHandle {
    return this.manager.use(interceptor, { type, tag: "error-interceptor" });
  }

  /**
   * 모든 에러 인터셉터 제거
   */
  clear(): void {
    this.manager.clear();
  }

  /**
   * 특정 유형의 인터셉터 제거
   * @param type 제거할 인터셉터 유형
   */
  clearByType(type: symbol): void {
    this.manager.ejectByType(type);
  }

  /**
   * 에러 인터셉터 실행 (내부용)
   */
  async run(
    error: FetchError
  ): Promise<NextTypeResponse<unknown> | FetchError> {
    return this.manager.forEach<FetchError>(error);
  }

  /**
   * 디버깅 용도로 현재 등록된 인터셉터 정보 반환
   */
  getRegisteredInterceptors() {
    return this.manager.getRegisteredInterceptors();
  }
}

/**
 * 요청/응답 인터셉터 생성
 */
export function createInterceptors() {
  const requestInterceptors = new RequestInterceptorManager();
  const responseInterceptors = new ResponseInterceptorManager();
  const errorInterceptors = new ErrorInterceptorManager();

  return {
    request: {
      /**
       * 요청 인터셉터 추가 - 자동으로 같은 유형의 이전 인터셉터 교체
       * @param interceptor 요청 처리 함수
       * @returns 제거 함수가 포함된 핸들
       * @example
       * ```typescript
       * // 인터셉터 추가 (auth 유형 기본값)
       * const authInterceptor = api.interceptors.request.use(config => {
       *   config.headers = config.headers || {};
       *   config.headers['Authorization'] = `Bearer ${getToken()}`;
       *   return config;
       * });
       *
       * // 다른 인터셉터 추가 시 이전 auth 유형 인터셉터는 자동 제거됨
       * api.interceptors.request.use(config => {
       *   config.headers = config.headers || {};
       *   config.headers['Authorization'] = `Bearer ${getNewToken()}`;
       *   return config;
       * });
       * ```
       */
      use: (interceptor: RequestInterceptor) =>
        requestInterceptors.use(interceptor),

      /**
       * 인터셉터 제거 (하위 호환성)
       * @deprecated InterceptorHandle.remove() 사용 권장
       */
      eject: (id: number) => {
        console.warn(
          "eject() 메서드는 사용되지 않습니다. use()가 반환하는 InterceptorHandle.remove()를 사용하세요."
        );
      },

      /**
       * 모든 요청 인터셉터 제거
       * @example
       * ```typescript
       * // 모든 요청 인터셉터 제거
       * api.interceptors.request.clear();
       * ```
       */
      clear: () => requestInterceptors.clear(),

      /**
       * 특정 유형의 인터셉터 제거
       * @param type 제거할 인터셉터 유형
       * @example
       * ```typescript
       * // 인증 관련 인터셉터만 제거
       * api.interceptors.request.clearByType(interceptorTypes.auth);
       * ```
       */
      clearByType: (type: symbol) => requestInterceptors.clearByType(type),

      /**
       * 요청 인터셉터 실행 (내부용)
       */
      run: requestInterceptors.run.bind(requestInterceptors),

      /**
       * 디버깅 용도로 현재 등록된 인터셉터 정보 조회
       */
      getRegistered: () => requestInterceptors.getRegisteredInterceptors(),
    },
    response: {
      /**
       * 응답 인터셉터 추가 - 자동으로 같은 유형의 이전 인터셉터 교체
       * @param onFulfilled 성공 응답 처리 함수
       * @returns 제거 함수가 포함된 핸들
       */
      use: (onFulfilled: ResponseInterceptor) =>
        responseInterceptors.use(onFulfilled),

      /**
       * 인터셉터 제거 (하위 호환성)
       * @deprecated InterceptorHandle.remove() 사용 권장
       */
      eject: (id: number) => {
        console.warn(
          "eject() 메서드는 사용되지 않습니다. use()가 반환하는 InterceptorHandle.remove()를 사용하세요."
        );
      },

      /**
       * 모든 응답 인터셉터 제거
       */
      clear: () => responseInterceptors.clear(),

      /**
       * 특정 유형의 인터셉터 제거
       * @param type 제거할 인터셉터 유형
       */
      clearByType: (type: symbol) => responseInterceptors.clearByType(type),

      /**
       * 응답 인터셉터 실행 (내부용)
       */
      run: responseInterceptors.run.bind(responseInterceptors),

      /**
       * 디버깅 용도로 현재 등록된 인터셉터 정보 조회
       */
      getRegistered: () => responseInterceptors.getRegisteredInterceptors(),
    },
    error: {
      /**
       * 에러 인터셉터 추가 - 자동으로 같은 유형의 이전 인터셉터 교체
       * @param onRejected 에러 처리 함수
       * @returns 제거 함수가 포함된 핸들
       */
      use: (onRejected: ErrorInterceptor) => errorInterceptors.use(onRejected),

      /**
       * 인터셉터 제거 (하위 호환성)
       * @deprecated InterceptorHandle.remove() 사용 권장
       */
      eject: (id: number) => {
        console.warn(
          "eject() 메서드는 사용되지 않습니다. use()가 반환하는 InterceptorHandle.remove()를 사용하세요."
        );
      },

      /**
       * 모든 에러 인터셉터 제거
       */
      clear: () => errorInterceptors.clear(),

      /**
       * 특정 유형의 인터셉터 제거
       * @param type 제거할 인터셉터 유형
       */
      clearByType: (type: symbol) => errorInterceptors.clearByType(type),

      /**
       * 에러 인터셉터 실행 (내부용)
       */
      run: errorInterceptors.run.bind(errorInterceptors),

      /**
       * 디버깅 용도로 현재 등록된 인터셉터 정보 조회
       */
      getRegistered: () => errorInterceptors.getRegisteredInterceptors(),
    },
  };
}

// 인터셉터 유형 타입 익스포트
export const interceptorTypes = interceptorTypeSymbols;
