/**
 * useQuery Hook Type Safety Tests
 * 
 * 이 파일은 useQuery 훅의 타입 안전성을 검증합니다.
 * URL 기반과 queryFn 기반 모두를 테스트합니다.
 */

import { describe, it } from 'vitest';
import type { UseQueryOptions } from '../../src/hooks/use-query';
import type { QueryFetcher } from 'next-unified-query-core';
import { z } from 'next-unified-query-core';
import { expectType, type Expect, type Equal } from '../type-utils/expect-type';

describe('useQuery Type Safety', () => {
  describe('URL-based queries', () => {
    it('should enforce correct option types', () => {
      // ✅ 올바른 URL 기반 옵션
      const validUrlOptions: UseQueryOptions = {
        cacheKey: ['users'],
        url: '/users',
        enabled: true,
        staleTime: 60000
      };

      // ✅ 모든 선택적 옵션들
      const fullOptions: UseQueryOptions = {
        cacheKey: ['users', 1, { filter: 'active' }],
        url: '/users',
        params: { page: 1, limit: 10 },
        schema: z.array(z.object({ id: z.number(), name: z.string() })),
        fetchConfig: { 
          timeout: 5000,
          headers: { 'X-Custom': 'value' }
        },
        enabled: true,
        staleTime: 5 * 60 * 1000,
        select: (data: any) => data.items,
        selectDeps: ['dependency'],
        placeholderData: [],
        gcTime: 10 * 60 * 1000
      };

      // ❌ URL과 queryFn을 동시에 사용할 수 없음
      // @ts-expect-error Cannot have both url and queryFn
      const invalidBoth: UseQueryOptions = {
        cacheKey: ['users'],
        url: '/users',
        queryFn: async (fetcher) => fetcher.get('/users')
      };

      // ❌ URL도 queryFn도 없으면 안됨
      // @ts-expect-error Must have either url or queryFn
      const invalidNone: UseQueryOptions = {
        cacheKey: ['users']
      };
    });

    it('should work with schema validation', () => {
      const userSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email()
      });

      const options: UseQueryOptions = {
        cacheKey: ['user', 1],
        url: '/users/1',
        schema: userSchema
      };

      // select 함수에서 스키마 타입이 추론되어야 함 (실제 훅에서)
      const selectOptions: UseQueryOptions = {
        cacheKey: ['user', 1],
        url: '/users/1',
        schema: userSchema,
        select: (data) => {
          // data는 any 타입이지만, 실제 훅에서는 스키마 기반으로 추론됨
          return data;
        }
      };
    });
  });

  describe('Function-based queries', () => {
    it('should enforce QueryFetcher in queryFn', () => {
      // ✅ 올바른 queryFn 사용
      const validFnOptions: UseQueryOptions = {
        cacheKey: ['custom'],
        queryFn: async (fetcher: QueryFetcher) => {
          // fetcher는 GET/HEAD만 가능
          const users = await fetcher.get('/users');
          const metadata = await fetcher.head('/users');
          return { users: users.data, metadata: metadata.headers };
        }
      };

      // ✅ 복잡한 데이터 조합
      const complexQuery: UseQueryOptions = {
        cacheKey: ['dashboard'],
        queryFn: async (fetcher) => {
          const [users, posts, stats] = await Promise.all([
            fetcher.get('/users'),
            fetcher.get('/posts'),
            fetcher.get('/stats')
          ]);
          
          return {
            users: users.data,
            posts: posts.data,
            stats: stats.data
          };
        }
      };

      // QueryFetcher 타입 검증
      const fetcherTest: UseQueryOptions = {
        cacheKey: ['test'],
        queryFn: async (fetcher) => {
          // ✅ GET은 사용 가능
          const getData = await fetcher.get('/data');
          
          // ✅ HEAD도 사용 가능
          const headData = await fetcher.head('/data');
          
          // ✅ request with GET
          const requestData = await fetcher.request({ 
            url: '/data', 
            method: 'GET' 
          });

          // ❌ POST는 사용 불가 (QueryFetcher에 없음)
          // @ts-expect-error QueryFetcher doesn't have post method
          const postData = await fetcher.post('/data', {});
          
          // ❌ PUT도 사용 불가
          // @ts-expect-error QueryFetcher doesn't have put method
          const putData = await fetcher.put('/data', {});

          // ❌ request with POST도 불가
          // @ts-expect-error POST not allowed in QueryFetcher.request
          const postRequest = await fetcher.request({ 
            url: '/data', 
            method: 'POST' 
          });

          return getData.data;
        }
      };
    });
  });

  describe('Placeholder data types', () => {
    it('should accept various placeholder data types', () => {
      // ✅ 정적 placeholder 데이터
      const staticPlaceholder: UseQueryOptions = {
        cacheKey: ['users'],
        url: '/users',
        placeholderData: [{ id: 1, name: 'Placeholder User' }]
      };

      // ✅ 함수형 placeholder 데이터
      const functionPlaceholder: UseQueryOptions = {
        cacheKey: ['users'],
        url: '/users',
        placeholderData: (prevData, prevQuery) => {
          // prevData와 prevQuery를 사용하여 placeholder 생성
          return prevData || [];
        }
      };

      // ✅ React Node도 가능 (로딩 컴포넌트 등)
      const nodePlaceholder: UseQueryOptions = {
        cacheKey: ['users'],
        url: '/users',
        placeholderData: null // React.ReactNode 타입
      };
    });
  });

  describe('Select function type safety', () => {
    it('should handle select transformations', () => {
      interface User {
        id: number;
        name: string;
        email: string;
        posts: { id: number; title: string }[];
      }

      // select로 데이터 변환
      const selectOptions: UseQueryOptions = {
        cacheKey: ['users'],
        url: '/users',
        select: (data: User[]) => {
          // 사용자 이름만 추출
          return data.map(user => user.name);
        },
        selectDeps: [] // select 함수의 의존성
      };

      // 중첩된 select
      const nestedSelect: UseQueryOptions = {
        cacheKey: ['user', 1],
        url: '/users/1',
        select: (data: User) => ({
          info: {
            id: data.id,
            name: data.name
          },
          postCount: data.posts.length,
          latestPost: data.posts[0]
        })
      };
    });
  });

  describe('Cache configuration', () => {
    it('should accept proper cache configurations', () => {
      // ✅ 모든 캐시 관련 옵션
      const cacheOptions: UseQueryOptions = {
        cacheKey: ['data'],
        url: '/data',
        staleTime: 5 * 60 * 1000, // 5분
        gcTime: 10 * 60 * 1000, // 10분 (가비지 컬렉션)
        enabled: true
      };

      // 동적 enabled
      const conditionalQuery: UseQueryOptions = {
        cacheKey: ['user', 'profile'],
        url: '/user/profile',
        enabled: false // 조건부 실행
      };

      // 복잡한 캐시 키
      const complexCacheKey: UseQueryOptions = {
        cacheKey: ['posts', { userId: 1, status: 'published', page: 1 }] as const,
        url: '/posts?userId=1&status=published&page=1'
      };
    });
  });

  describe('Real-world patterns', () => {
    it('should handle dependent queries', () => {
      // 사용자 정보를 먼저 가져온 후 포스트 가져오기
      const userQuery: UseQueryOptions = {
        cacheKey: ['user', 'current'],
        url: '/user/current'
      };

      const postsQuery: UseQueryOptions<any> = {
        cacheKey: ['posts', 'byUser', 123],
        url: '/posts?userId=123',
        enabled: true // 실제로는 !!user.id 같은 조건
      };
    });

    it('should handle paginated queries', () => {
      const page = 1;
      const limit = 20;

      const paginatedQuery: UseQueryOptions = {
        cacheKey: ['posts', 'paginated', { page, limit }] as const,
        url: `/posts?page=${page}&limit=${limit}`,
        params: { page, limit },
        placeholderData: (prevData) => prevData, // 이전 페이지 데이터 유지
        staleTime: 30 * 1000 // 30초
      };
    });

    it('should handle search queries', () => {
      const searchTerm = 'typescript';
      
      const searchQuery: UseQueryOptions = {
        cacheKey: ['search', searchTerm] as const,
        url: '/search',
        params: { q: searchTerm },
        enabled: searchTerm.length > 2, // 3글자 이상일 때만 검색
        staleTime: 60 * 1000 // 1분
      };
    });
  });
});