/**
 * Factory Pattern Type Inference Tests
 * 
 * 이 파일은 createQueryFactory와 createMutationFactory의 
 * 타입 추론 기능을 검증합니다.
 * 
 * NOTE: 이 파일은 타입 검증만을 위한 것으로 실제로 실행되지 않습니다.
 */

import { z } from 'zod/v4';
import { createQueryFactory, createMutationFactory } from '../../src';
import type { ExtractParams, ExtractQueryData, ExtractMutationVariables, ExtractMutationData } from '../../src';
import { expectType, type Expect, type Equal } from '../type-utils/expect-type';

// Type-only tests - not meant to be executed
namespace FactoryTypeInferenceTests {
  // Test: createQueryFactory Type Inference
  export namespace QueryFactoryTests {
    // Test parameter type inference
    const userQueries = createQueryFactory({
      // 파라미터가 없는 쿼리
      list: {
        cacheKey: () => ['users'] as const,
        url: () => '/users'
      },
      // 단일 파라미터 쿼리
      getById: {
        cacheKey: (id: number) => ['users', id] as const,
        url: (id: number) => `/users/${id}`
      },
      // 복잡한 파라미터 쿼리
      search: {
        cacheKey: (params: { query: string; page?: number }) => ['users', 'search', params] as const,
        url: (params: { query: string; page?: number }) => `/users/search?q=${params.query}&page=${params.page || 1}`
      }
    });

    // 파라미터 타입 추론 검증
    type ListParams = ExtractParams<typeof userQueries.list>;
    type GetByIdParams = ExtractParams<typeof userQueries.getById>;
    type SearchParams = ExtractParams<typeof userQueries.search>;

    // ✅ void 파라미터 (파라미터가 없을 때)
    const _testListParams: Expect<Equal<ListParams, void>> = true;
    
    // ✅ number 파라미터
    const _testGetByIdParams: Expect<Equal<GetByIdParams, number>> = true;
    
    // ✅ 객체 파라미터
    const _testSearchParams: Expect<Equal<SearchParams, { query: string; page?: number }>> = true;

    // Test response type inference from schema
    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
      role: z.enum(['admin', 'user'])
    });

    const userListSchema = z.array(userSchema);

    const paginatedSchema = z.object({
      items: userListSchema,
      total: z.number(),
      page: z.number(),
      pageSize: z.number()
    });

    const userQueriesWithSchema = createQueryFactory({
      // 스키마가 있는 쿼리
      list: {
        cacheKey: () => ['users'] as const,
        url: () => '/users',
        schema: userListSchema
      },
      getById: {
        cacheKey: (id: number) => ['users', id] as const,
        url: (id: number) => `/users/${id}`,
        schema: userSchema
      },
      paginated: {
        cacheKey: (page: number) => ['users', 'page', page] as const,
        url: (page: number) => `/users?page=${page}`,
        schema: paginatedSchema
      },
      // 스키마가 없는 쿼리
      raw: {
        cacheKey: () => ['users', 'raw'] as const,
        url: () => '/users/raw'
      }
    });

    // 응답 타입 추론 검증
    type ListData = ExtractQueryData<typeof userQueriesWithSchema.list>;
    type UserData = ExtractQueryData<typeof userQueriesWithSchema.getById>;
    type PaginatedData = ExtractQueryData<typeof userQueriesWithSchema.paginated>;
    type RawData = ExtractQueryData<typeof userQueriesWithSchema.raw>;

    // ✅ 스키마 기반 타입 추론
    const _testListData: Expect<Equal<ListData, z.infer<typeof userListSchema>>> = true;
    const _testUserData: Expect<Equal<UserData, z.infer<typeof userSchema>>> = true;
    const _testPaginatedData: Expect<Equal<PaginatedData, z.infer<typeof paginatedSchema>>> = true;
    
    // ✅ 스키마가 없으면 unknown
    const _testRawData: Expect<Equal<RawData, unknown>> = true;

    // 실제 사용 시 타입 체크
    const user: UserData = {
      id: 1,
      name: 'John',
      email: 'john@example.com',
      role: 'user'
    };

    // @ts-expect-error role must be 'admin' or 'user'
    const invalidUser: UserData = {
      id: 1,
      name: 'John',
      email: 'john@example.com',
      role: 'manager'
    };

    // Test custom queryFn support
    const complexQueries = createQueryFactory({
      // URL 기반 쿼리
      simple: {
        cacheKey: () => ['simple'] as const,
        url: () => '/simple'
      },
      // Custom queryFn 사용
      complex: {
        cacheKey: (params: { ids: number[] }) => ['complex', params.ids] as const,
        queryFn: async (params: { ids: number[] }, fetcher) => {
          // fetcher는 QueryFetcher 타입 (GET/HEAD만 가능)
          const results = await Promise.all(
            params.ids.map(id => fetcher.get(`/items/${id}`))
          );
          return results.map(r => r.data);
        }
      }
    });

    // 파라미터 타입이 올바르게 추론됨
    type ComplexParams = ExtractParams<typeof complexQueries.complex>;
    const _testComplexParams: Expect<Equal<ComplexParams, { ids: number[] }>> = true;
  }

  // Test: createMutationFactory Type Inference
  export namespace MutationFactoryTests {
    // 스키마 정의
    const createUserSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8)
    });

    const userResponseSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      createdAt: z.string()
    });

    const updateUserSchema = z.object({
      name: z.string().optional(),
      email: z.string().email().optional()
    });

    const userMutations = createMutationFactory({
      // 요청/응답 스키마가 있는 뮤테이션
      create: {
        url: () => '/users',
        method: 'POST',
        requestSchema: createUserSchema,
        responseSchema: userResponseSchema
      },
      // 동적 URL 뮤테이션
      update: {
        url: (vars: { id: number; data: z.infer<typeof updateUserSchema> }) => `/users/${vars.id}`,
        method: 'PUT',
        requestSchema: updateUserSchema,
        responseSchema: userResponseSchema
      },
      // 스키마가 없는 뮤테이션
      delete: {
        url: (id: number) => `/users/${id}`,
        method: 'DELETE'
      }
    });

    // Variables 타입 추론
    type CreateVars = ExtractMutationVariables<typeof userMutations.create>;
    type UpdateVars = ExtractMutationVariables<typeof userMutations.update>;
    type DeleteVars = ExtractMutationVariables<typeof userMutations.delete>;

    // ✅ requestSchema가 있으면 스키마 타입
    const _testCreateVars: Expect<Equal<CreateVars, z.infer<typeof createUserSchema>>> = true;
    const _testUpdateVars: Expect<Equal<UpdateVars, { id: number; data: z.infer<typeof updateUserSchema> }>> = true;
    const _testDeleteVars: Expect<Equal<DeleteVars, number>> = true;

    // Response 타입 추론
    type CreateResponse = ExtractMutationData<typeof userMutations.create>;
    type UpdateResponse = ExtractMutationData<typeof userMutations.update>;
    type DeleteResponse = ExtractMutationData<typeof userMutations.delete>;

    // ✅ responseSchema 기반 타입 추론
    const _testCreateResponse: Expect<Equal<CreateResponse, z.infer<typeof userResponseSchema>>> = true;
    const _testUpdateResponse: Expect<Equal<UpdateResponse, z.infer<typeof userResponseSchema>>> = true;
    const _testDeleteResponse: Expect<Equal<DeleteResponse, unknown>> = true;

    // Test custom mutationFn support
    interface FileUploadResponse {
      id: string;
      url: string;
      size: number;
    }

    const fileMutations = createMutationFactory({
      // URL + method 방식
      simple: {
        url: () => '/files',
        method: 'POST'
      },
      // Custom mutationFn 방식
      upload: {
        mutationFn: async (variables: { file: File; folder?: string }, fetcher) => {
          // fetcher는 NextTypeFetch 타입 (모든 메서드 사용 가능)
          const formData = new FormData();
          formData.append('file', variables.file);
          if (variables.folder) {
            formData.append('folder', variables.folder);
          }

          const response = await fetcher.post<FileUploadResponse>('/files/upload', formData);
          return response.data;
        }
      }
    });

    // Variables 타입 추론
    type UploadVars = ExtractMutationVariables<typeof fileMutations.upload>;
    const _testUploadVars: Expect<Equal<UploadVars, { file: File; folder?: string }>> = true;

    // Response 타입 추론
    type UploadResponse = ExtractMutationData<typeof fileMutations.upload>;
    const _testUploadResponse: Expect<Equal<UploadResponse, FileUploadResponse>> = true;
  }

  // Test: URL and method XOR mutationFn enforcement
  export namespace XOREnforcementTests {
    // ✅ URL + method 방식 (올바름)
    const validUrlMutation = createMutationFactory({
      create: {
        url: () => '/users',
        method: 'POST'
      }
    });

    // ✅ mutationFn 방식 (올바름)
    const validFnMutation = createMutationFactory({
      create: {
        mutationFn: async (data: any, fetcher) => {
          return fetcher.post('/users', data);
        }
      }
    });

    // ❌ 둘 다 있으면 안됨 (컴파일 에러)
    // @ts-expect-error Cannot have both url/method and mutationFn
    const invalidBothMutation = createMutationFactory({
      create: {
        url: () => '/users',
        method: 'POST',
        mutationFn: async (data: any, fetcher) => {
          return fetcher.post('/users', data);
        }
      }
    });

    // ❌ 둘 다 없으면 안됨 (런타임 에러)
    // Note: 이는 런타임에 validateMutationConfig에서 잡힘
    const invalidNoneMutation = createMutationFactory({
      create: {
        // url도 없고 mutationFn도 없음
        cacheKey: ['create']
      } as any
    });
  }
}