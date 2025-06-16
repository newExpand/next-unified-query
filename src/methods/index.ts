import type {
  AxiosLikeResponse,
  CancelablePromise,
  FetchConfig,
  HttpMethod,
  RequestConfig,
} from "../types";
import { mergeConfigs } from "../utils";

/**
 * HTTP 메서드 함수들을 생성합니다.
 * @param request 기본 요청 함수
 * @param defaultConfig 기본 설정
 * @returns HTTP 메서드 함수 객체
 */
export function createHttpMethods(
  request: <T>(
    config: RequestConfig
  ) => CancelablePromise<AxiosLikeResponse<T>>,
  defaultConfig: FetchConfig
) {
  return {
    get<T>(
      url: string,
      config: FetchConfig = {}
    ): CancelablePromise<AxiosLikeResponse<T>> {
      return request<T>(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "GET" as HttpMethod,
        })
      );
    },

    post<T>(
      url: string,
      data?: unknown,
      config: FetchConfig = {}
    ): CancelablePromise<AxiosLikeResponse<T>> {
      return request<T>(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "POST" as HttpMethod,
          data,
        })
      );
    },

    put<T>(
      url: string,
      data?: unknown,
      config: FetchConfig = {}
    ): CancelablePromise<AxiosLikeResponse<T>> {
      return request<T>(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "PUT" as HttpMethod,
          data,
        })
      );
    },

    delete<T>(
      url: string,
      config: FetchConfig = {}
    ): CancelablePromise<AxiosLikeResponse<T>> {
      return request<T>(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "DELETE" as HttpMethod,
        })
      );
    },

    patch<T>(
      url: string,
      data?: unknown,
      config: FetchConfig = {}
    ): CancelablePromise<AxiosLikeResponse<T>> {
      return request<T>(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "PATCH" as HttpMethod,
          data,
        })
      );
    },

    head<T>(
      url: string,
      config: FetchConfig = {}
    ): CancelablePromise<AxiosLikeResponse<T>> {
      return request<T>(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "HEAD" as HttpMethod,
        })
      );
    },

    options<T>(
      url: string,
      config: FetchConfig = {}
    ): CancelablePromise<AxiosLikeResponse<T>> {
      return request<T>(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "OPTIONS" as HttpMethod,
        })
      );
    },
  };
}
