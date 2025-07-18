/**
 * 타입 검증을 위한 유틸리티 함수
 * 컴파일 타임에 타입을 체크하여 타입 안전성을 검증합니다.
 */

/**
 * 두 타입이 정확히 일치하는지 검증합니다.
 */
export type Expect<T extends true> = T;

/**
 * 두 타입이 동일한지 체크합니다.
 */
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/**
 * 타입이 any인지 체크합니다.
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * 타입이 never인지 체크합니다.
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * 타입이 unknown인지 체크합니다.
 */
export type IsUnknown<T> = IsNever<T> extends false ? T extends unknown ? unknown extends T ? IsAny<T> extends false ? true : false : false : false : false;

/**
 * 함수의 파라미터 타입을 추출합니다.
 */
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

/**
 * 함수의 리턴 타입을 추출합니다.
 */
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

/**
 * 타입 테스트를 위한 헬퍼 함수들
 */
export const expectType = <T>(_value: T): void => {
  // 컴파일 타임에만 타입 체크, 런타임에는 아무것도 하지 않음
};

export const expectNotType = <T, U>(value: T & U extends never ? T : never): void => {
  // 타입이 일치하지 않을 때만 통과
};

export const expectAssignable = <T>(_value: T): void => {
  // 할당 가능한 타입인지 체크
};

export const expectNotAssignable = <T, U>(value: T extends U ? never : T): void => {
  // 할당 불가능한 타입인지 체크
};

/**
 * 컴파일 에러를 기대하는 테스트를 위한 주석 패턴
 * @ts-expect-error 를 사용하여 의도적인 타입 에러를 표시
 */
export const expectError = (_value: any): void => {
  // 타입 에러가 발생해야 하는 경우 사용
};