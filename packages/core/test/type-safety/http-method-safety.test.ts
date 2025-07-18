/**
 * HTTP Method Type Safety Tests
 * 
 * 이 파일은 next-unified-query의 HTTP 메서드 타입 안전성을 검증합니다.
 * useQuery는 GET/HEAD만, useMutation은 다른 메서드만 허용하는지 확인합니다.
 * 
 * NOTE: 이 파일은 타입 검증만을 위한 것으로 실제로 실행되지 않습니다.
 */

import type { QueryFetcher, NextTypeFetch, RequestConfig } from '../../src/types';
import { expectType, expectError, type Expect, type Equal } from '../type-utils/expect-type';

// Type-only tests - not meant to be executed
namespace HTTPMethodSafetyTests {
  // Test: QueryFetcher Type Safety
  export namespace QueryFetcherTests {
    declare const queryFetcher: QueryFetcher;
    
    // ✅ GET 메서드는 허용됨
    const getResult = queryFetcher.get('/api/users');
    expectType<ReturnType<typeof queryFetcher.get>>(getResult);
    
    // ✅ HEAD 메서드는 허용됨  
    const headResult = queryFetcher.head('/api/users');
    expectType<ReturnType<typeof queryFetcher.head>>(headResult);
    
    // ✅ request 메서드에서 GET은 허용됨
    const getRequest = queryFetcher.request({ url: '/api/users', method: 'GET' });
    expectType<ReturnType<typeof queryFetcher.request>>(getRequest);
    
    // ✅ request 메서드에서 HEAD는 허용됨
    const headRequest = queryFetcher.request({ url: '/api/users', method: 'HEAD' });
    expectType<ReturnType<typeof queryFetcher.request>>(headRequest);
    
    // ❌ QueryFetcher는 POST 메서드를 가지지 않음
    // @ts-expect-error QueryFetcher doesn't have post method
    queryFetcher.post;
    
    // ❌ QueryFetcher는 PUT 메서드를 가지지 않음
    // @ts-expect-error QueryFetcher doesn't have put method
    queryFetcher.put;
    
    // ❌ QueryFetcher는 DELETE 메서드를 가지지 않음
    // @ts-expect-error QueryFetcher doesn't have delete method
    queryFetcher.delete;
    
    // ❌ request 메서드에서 POST는 허용되지 않음
    // @ts-expect-error POST method not allowed in QueryFetcher
    queryFetcher.request({ url: '/api/users', method: 'POST' });
    
    // ❌ request 메서드에서 PUT은 허용되지 않음
    // @ts-expect-error PUT method not allowed in QueryFetcher
    queryFetcher.request({ url: '/api/users', method: 'PUT' });
    
    // ❌ request 메서드에서 DELETE는 허용되지 않음
    // @ts-expect-error DELETE method not allowed in QueryFetcher
    queryFetcher.request({ url: '/api/users', method: 'DELETE' });
  }

  // Test: NextTypeFetch Type Safety
  export namespace NextTypeFetchTests {
    declare const fetcher: NextTypeFetch;
    
    // ✅ 모든 메서드가 사용 가능
    const getResult = fetcher.get('/api/users');
    const postResult = fetcher.post('/api/users', {});
    const putResult = fetcher.put('/api/users', {});
    const deleteResult = fetcher.delete('/api/users');
    const patchResult = fetcher.patch('/api/users', {});
    const headResult = fetcher.head('/api/users');
    const optionsResult = fetcher.options('/api/users');
    
    // ✅ request 메서드는 모든 HTTP 메서드 허용
    const getRequest = fetcher.request({ url: '/api/users', method: 'GET' });
    const postRequest = fetcher.request({ url: '/api/users', method: 'POST', data: {} });
    const putRequest = fetcher.request({ url: '/api/users', method: 'PUT', data: {} });
    const deleteRequest = fetcher.request({ url: '/api/users', method: 'DELETE' });
  }

  // Test: Method Type Constraints
  export namespace MethodTypeConstraints {
    type QueryFetcherRequestConfig = Parameters<QueryFetcher['request']>[0];
    type AllowedMethods = QueryFetcherRequestConfig['method'];
    
    // QueryFetcher는 GET | HEAD | undefined만 허용
    const _testQueryMethods: Expect<Equal<AllowedMethods, "GET" | "HEAD" | undefined>> = true;
    
    // NextTypeFetch는 모든 HTTP 메서드 허용
    type FetchRequestConfig = Parameters<NextTypeFetch['request']>[0];
    type AllMethods = FetchRequestConfig['method'];
    const _testAllMethods: Expect<Equal<AllMethods, "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | undefined>> = true;
  }

  // Test: Real-world Usage Scenarios
  export namespace RealWorldScenarios {
    declare const queryFetcher: QueryFetcher;
    declare const fetcher: NextTypeFetch;
    
    // ✅ 올바른 사용: 데이터 조회
    const fetchUsers = () => queryFetcher.get<{ id: number; name: string }[]>('/api/users');
    const checkUserExists = (id: number) => queryFetcher.head(`/api/users/${id}`);
    
    // ❌ 잘못된 사용: 데이터 생성/수정/삭제
    // @ts-expect-error Cannot use POST with QueryFetcher
    const createUser = () => queryFetcher.post('/api/users', { name: 'John' });
    
    // @ts-expect-error Cannot use DELETE with QueryFetcher  
    const deleteUser = (id: number) => queryFetcher.delete(`/api/users/${id}`);
    
    // ✅ NextTypeFetch로는 모든 작업이 가능
    const fetchUsersWithFetcher = () => fetcher.get<{ id: number; name: string }[]>('/api/users');
    const createUserWithFetcher = (data: { name: string }) => fetcher.post('/api/users', data);
    const updateUser = (id: number, data: { name: string }) => fetcher.put(`/api/users/${id}`, data);
    const deleteUserWithFetcher = (id: number) => fetcher.delete(`/api/users/${id}`);
    const patchUser = (id: number, data: Partial<{ name: string }>) => fetcher.patch(`/api/users/${id}`, data);
  }
}