/**
 * 쿼리키 팩토리 타입
 */
export type QueryKeyFactory<
  T extends Record<string, (...args: any[]) => unknown[]>
> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => readonly unknown[];
};

/**
 * 네임스페이스와 정의 객체를 받아 쿼리키 팩토리를 생성합니다.
 * @param namespace 쿼리 도메인(네임스페이스)
 * @param definitions 쿼리키 생성 함수 집합
 * @returns 쿼리키 팩토리 객체
 */
export function createQueryKeyFactory<
  T extends Record<string, (...args: any[]) => unknown[]>
>(namespace: string, definitions: T): QueryKeyFactory<T> {
  const factory = {} as QueryKeyFactory<T>;
  for (const key in definitions) {
    factory[key] = (...args: any[]) =>
      [namespace, key, ...definitions[key](...args)] as const;
  }
  return factory;
}
