/**
 * useQuery Type Safety Tests
 *
 * 이 파일은 useQuery hook의 타입 시스템과 타입 추론이
 * 올바르게 동작하는지 검증합니다.
 *
 * 테스트 범위:
 * - URL 기반 쿼리 타입 추론
 * - queryFn 기반 쿼리 타입 추론
 * - Zod 스키마 기반 타입 변환
 * - select 변환 타입 추론
 * - placeholderData 타입 호환성
 * - Factory 패턴과의 통합
 *
 * NOTE: 이 파일은 타입 검증만을 위한 것으로 실제로 실행되지 않습니다.
 */

import type {
  UseQueryOptions,
  UseQueryResult,
} from "../../src/hooks/use-query";
import type { FetchError, QueryFetcher, ZodType } from "next-unified-query-core";
import { z } from "next-unified-query-core";
import {
  expectType,
} from "../type-utils/expect-type";

// Type-only tests - not meant to be executed
// Export to prevent TypeScript "not used" warnings
export namespace UseQueryTypeTests {
  // Test 1: URL 기반 쿼리 타입 추론
  export namespace UrlBasedQueries {
    interface User {
      id: number;
      name: string;
      email: string;
      createdAt: string;
    }

    // 기본 URL 쿼리
    type BasicUrlOptions = UseQueryOptions<User>;
    const urlOptions: BasicUrlOptions = {
      cacheKey: ["users"],
      url: "/users",
    };

    // URL과 params 조합
    const withParams: UseQueryOptions<User> = {
      cacheKey: ["users", { page: 1 }],
      url: "/users",
      params: { page: 1, limit: 10 },
    };

    // 전체 옵션
    const fullOptions: UseQueryOptions<User[]> = {
      cacheKey: ["users", "list"],
      url: "/api/users",
      params: { status: "active" },
      fetchConfig: {
        headers: { Authorization: "Bearer token" },
        timeout: 5000,
      },
      enabled: true,
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    };

    // URL과 queryFn 동시 사용 불가
    // @ts-expect-error - Cannot have both url and queryFn
    const invalidBoth: UseQueryOptions<any> = {
      cacheKey: ["test"],
      url: "/api/data",
      queryFn: async (fetcher: QueryFetcher) => {
        const response = await fetcher.get("/api/data");
        return response.data;
      },
    };
  }

  // Test 2: QueryFn 기반 쿼리 타입 추론
  export namespace QueryFnBasedQueries {
    interface Post {
      id: string;
      title: string;
      content: string;
      authorId: number;
    }

    // 기본 queryFn 사용
    const basicQueryFn: UseQueryOptions<Post[]> = {
      cacheKey: ["posts"],
      queryFn: async (fetcher: QueryFetcher) => {
        const response = await fetcher.get<Post[]>("/posts");
        return response.data;
      },
    };

    // 복잡한 queryFn 로직 - fetcher 타입이 자동 추론되어야 함
    const complexQueryFn: UseQueryOptions<Post[]> = {
      cacheKey: ["posts", "filtered"],
      queryFn: async (fetcher) => {
        // fetcher가 QueryFetcher 타입으로 자동 추론됨
        expectType<QueryFetcher>(fetcher);
        
        const [posts, authors] = await Promise.all([
          fetcher.get<Post[]>("/posts"),
          fetcher.get<{ id: number; name: string }[]>("/authors"),
        ]);

        // 복잡한 데이터 조합
        return posts.data.map((post) => ({
          ...post,
          authorName:
            authors.data.find((a) => a.id === post.authorId)?.name || "Unknown",
        })) as Post[];
      },
    };

    // queryFn과 url 동시 사용 불가
    // @ts-expect-error - Cannot have both queryFn and url
    const invalidBoth: UseQueryOptions<any> = {
      cacheKey: ["test"],
      queryFn: async (f: QueryFetcher) => {
        const response = await f.get("/data");
        return response.data;
      },
      url: "/api/data",
    };
  }

  // Test 3: Zod 스키마 기반 타입 변환
  export namespace SchemaBasedValidation {
    const UserSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
      age: z.number().min(0).max(120),
      isActive: z.boolean(),
    });

    type User = z.infer<typeof UserSchema>;

    // 스키마로 검증된 데이터
    const withSchema: UseQueryOptions<User> = {
      cacheKey: ["user", 1],
      url: "/users/1",
      schema: UserSchema,
    };

    // 배열 스키마
    const UsersSchema = z.array(UserSchema);
    const withArraySchema: UseQueryOptions<User[]> = {
      cacheKey: ["users"],
      url: "/users",
      schema: UsersSchema,
    };

    // 중첩된 스키마
    const PostWithAuthorSchema = z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      author: UserSchema,
      tags: z.array(z.string()),
      metadata: z.record(z.string(), z.unknown()),
    });

    type PostWithAuthor = z.infer<typeof PostWithAuthorSchema>;

    const withNestedSchema: UseQueryOptions<PostWithAuthor> = {
      cacheKey: ["post", "with-author"],
      url: "/posts/1?include=author",
      schema: PostWithAuthorSchema,
    };
  }

  // Test 4: Select 변환 타입 추론
  export namespace SelectTransformation {
    interface ApiResponse<T> {
      data: T;
      meta: {
        total: number;
        page: number;
        limit: number;
      };
      timestamp: string;
    }

    interface Product {
      id: string;
      name: string;
      price: number;
      stock: number;
    }

    // select로 데이터 변환
    const withSelect: UseQueryOptions<ApiResponse<Product[]>> = {
      cacheKey: ["products"],
      url: "/products",
      select: (response) => response.data, // Product[] 반환
    };

    // select와 타입 추론
    type QueryWithSelect = UseQueryResult<Product[], FetchError>;
    const selectResult: QueryWithSelect = {} as QueryWithSelect;
    if (selectResult.data) {
      // select가 적용되어 Product[]가 됨
      expectType<Product[]>(selectResult.data);
    }

    // select deps와 함께 사용
    const withSelectDeps: UseQueryOptions<ApiResponse<Product[]>> = {
      cacheKey: ["products", "filtered"],
      url: "/products",
      select: (response) => {
        return response.data.filter((p) => p.stock > 0);
      },
      selectDeps: ["filterStock"], // select 재실행 트리거
    };

    // 중첩된 select 변환
    const nestedSelect: UseQueryOptions<ApiResponse<Product[]>> = {
      cacheKey: ["products", "summary"],
      url: "/products",
      select: (response) => ({
        items: response.data.map((p) => p.name),
        total: response.meta.total,
        hasMore: response.meta.page * response.meta.limit < response.meta.total,
      }),
    };
  }

  // Test 5: PlaceholderData 타입 호환성
  export namespace PlaceholderDataTypes {
    interface Todo {
      id: number;
      text: string;
      completed: boolean;
    }

    // 정적 placeholder 데이터
    const staticPlaceholder: UseQueryOptions<Todo[]> = {
      cacheKey: ["todos"],
      url: "/todos",
      placeholderData: [
        { id: 0, text: "Loading...", completed: false },
      ],
    };

    // 함수형 placeholder 데이터
    const functionPlaceholder: UseQueryOptions<Todo[]> = {
      cacheKey: ["todos", "active"],
      url: "/todos?status=active",
      placeholderData: (prevData) => {
        // 이전 데이터가 있으면 유지, 없으면 기본값
        return prevData || [];
      },
    };

    // React Node placeholder (로딩 UI)
    const reactNodePlaceholder: UseQueryOptions<Todo[]> = {
      cacheKey: ["todos", "with-ui"],
      url: "/todos",
      placeholderData: null as any, // React.ReactNode 타입도 허용
    };

    // prevQuery 활용
    const withPrevQuery: UseQueryOptions<Todo[]> = {
      cacheKey: ["todos", "smart"],
      url: "/todos",
      placeholderData: (prevData, prevQuery) => {
        if (prevQuery?.stale) {
          return prevData; // stale하면 이전 데이터 유지
        }
        return []; // 아니면 빈 배열
      },
    };
  }

  // Test 6: Query Factory 패턴과의 통합
  export namespace FactoryIntegration {
    // Factory에서 생성된 쿼리 설정
    interface FactoryQueryConfig {
      cacheKey: readonly ["posts", number];
      url: string;
      schema: z.ZodType<Post>;
    }

    interface Post {
      id: number;
      title: string;
      content: string;
    }

    const PostSchema = z.object({
      id: z.number(),
      title: z.string(),
      content: z.string(),
    });

    // Factory에서 생성된 설정을 UseQueryOptions로 변환
    const factoryConfig: FactoryQueryConfig = {
      cacheKey: ["posts", 1] as const,
      url: "/posts/1",
      schema: PostSchema,
    };

    const queryOptions: UseQueryOptions<Post> = {
      ...factoryConfig,
      staleTime: 60 * 1000,
    };

    // Factory list 쿼리
    interface ListConfig<T> {
      cacheKey: readonly unknown[];
      url: string;
      params?: Record<string, any>;
      schema?: z.ZodType<T>;
    }

    const listConfig: ListConfig<Post[]> = {
      cacheKey: ["posts", "list", { page: 1 }],
      url: "/posts",
      params: { page: 1, limit: 10 },
      schema: z.array(PostSchema),
    };

    const listOptions: UseQueryOptions<Post[]> = {
      ...listConfig,
      enabled: true,
    };
  }

  // Test 7: UseQueryResult 타입 검증
  export namespace QueryResultTypes {
    interface Article {
      id: string;
      title: string;
      content: string;
      publishedAt: string;
    }

    // 기본 result 타입
    type BasicResult = UseQueryResult<Article[], FetchError>;

    // Result의 각 속성 타입 검증
    const result: BasicResult = {} as BasicResult;

    // data는 Article[] | undefined
    if (result.data) {
      expectType<Article[]>(result.data);
    }

    // error는 FetchError | null
    if (result.error) {
      expectType<FetchError>(result.error);
    }

    // 상태 플래그들
    expectType<boolean>(result.isLoading);
    expectType<boolean>(result.isFetching);
    expectType<boolean>(result.isError);
    expectType<boolean>(result.isSuccess);
    expectType<boolean>(result.isStale);

    // refetch 함수
    expectType<() => void>(result.refetch);

    // select가 적용된 result
    interface ApiWrapper<T> {
      data: T;
      success: boolean;
    }

    type SelectResult = UseQueryResult<Article, FetchError>;
    const selectResult: SelectResult = {} as SelectResult;

    if (selectResult.data) {
      // select로 변환된 타입
      expectType<Article>(selectResult.data);
    }
  }

  // Test 8: 고급 타입 시나리오
  export namespace AdvancedScenarios {
    // 제네릭 쿼리 훅
    function createTypedQuery<T>(
      cacheKey: readonly unknown[],
      url: string,
      schema?: z.ZodType<T>
    ): UseQueryOptions<T> {
      return {
        cacheKey,
        url,
        schema,
        staleTime: 5 * 60 * 1000,
      };
    }

    // 조건부 타입 쿼리
    type ConditionalQuery<T extends { type: string }> = T["type"] extends "list"
      ? UseQueryOptions<T[]>
      : UseQueryOptions<T>;

    // Discriminated Union 쿼리
    type DataResponse =
      | { type: "user"; data: { id: number; name: string } }
      | { type: "post"; data: { id: string; title: string } }
      | { type: "error"; message: string };

    const discriminatedQuery: UseQueryOptions<DataResponse> = {
      cacheKey: ["data", "mixed"],
      url: "/api/data",
      select: (response) => {
        if (response.type === "error") {
          throw new Error(response.message);
        }
        return response;
      },
    };

    // Mapped Types와 함께 사용
    type EntityQueries<T extends Record<string, any>> = {
      [K in keyof T]: UseQueryOptions<T[K]>;
    };

    interface Entities {
      user: { id: number; name: string };
      post: { id: string; title: string };
      comment: { id: number; text: string; postId: string };
    }

    type AllQueries = EntityQueries<Entities>;

    const queries: AllQueries = {
      user: {
        cacheKey: ["user"],
        url: "/user",
      },
      post: {
        cacheKey: ["post"],
        url: "/post",
      },
      comment: {
        cacheKey: ["comment"],
        url: "/comment",
      },
    };
  }

  // Test 9: 에러 타입 커스터마이징
  export namespace CustomErrorTypes {
    // 커스텀 에러 타입
    interface CustomError {
      code: string;
      message: string;
      details?: Record<string, any>;
    }

    type CustomErrorResult = UseQueryResult<any, CustomError>;

    const customErrorQuery: UseQueryOptions = {
      cacheKey: ["custom", "error"],
      queryFn: async (fetcher) => {
        // fetcher가 QueryFetcher 타입으로 자동 추론됨
        expectType<QueryFetcher>(fetcher);
        
        // QueryFetcher의 메서드들이 올바르게 타입되는지 확인
        expectType<typeof fetcher.get>(fetcher.get);
        expectType<typeof fetcher.head>(fetcher.head);
        expectType<typeof fetcher.request>(fetcher.request);
        
        try {
          return await fetcher.get("/api/data");
        } catch (error) {
          // 에러 변환
          throw {
            code: "CUSTOM_ERROR",
            message: "Something went wrong",
            details: { originalError: error },
          };
        }
      },
    };

    // 에러 처리 result
    const errorResult: CustomErrorResult = {} as CustomErrorResult;
    if (errorResult.error) {
      expectType<CustomError>(errorResult.error);
      expectType<string>(errorResult.error.code);
      expectType<string>(errorResult.error.message);
    }
  }

  // Test 10: 실제 사용 패턴
  export namespace RealWorldPatterns {
    // 페이지네이션 쿼리
    interface PaginatedResponse<T> {
      items: T[];
      pageInfo: {
        total: number;
        page: number;
        pageSize: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }

    interface User {
      id: string;
      name: string;
      email: string;
    }

    const paginatedQuery: UseQueryOptions<PaginatedResponse<User>> = {
      cacheKey: ["users", "paginated", { page: 1, pageSize: 20 }],
      url: "/users",
      params: { page: 1, pageSize: 20 },
      select: (response) => ({
        ...response,
        pageInfo: {
          ...response.pageInfo,
          hasNext: response.pageInfo.page * response.pageInfo.pageSize < response.pageInfo.total,
          hasPrev: response.pageInfo.page > 1,
        },
      }),
      staleTime: 30 * 1000, // 30초
    };

    // 무한 스크롤을 위한 쿼리 (간단 버전)
    const infiniteQuery: UseQueryOptions<User[]> = {
      cacheKey: ["users", "infinite", { cursor: null }],
      url: "/users",
      params: { cursor: null, limit: 20 },
      placeholderData: [], // 초기 빈 배열
    };

    // 검색 쿼리 with debounce 고려
    const searchQuery: UseQueryOptions<User[]> = {
      cacheKey: ["users", "search", "john"],
      url: "/users/search",
      params: { q: "john" },
      enabled: "john".length >= 2, // 2글자 이상일 때만 검색
      staleTime: 10 * 1000, // 10초
    };

    // 의존성 있는 쿼리 체인
    const userQuery: UseQueryOptions<User> = {
      cacheKey: ["user", "current"],
      url: "/user/me",
    };

    // userQuery 결과에 의존하는 쿼리
    const userPostsQuery: UseQueryOptions<Post[]> = {
      cacheKey: ["posts", "by-user", "123"], // userId would come from userQuery
      url: "/users/123/posts",
      enabled: false, // userQuery.data가 있을 때 true로 변경
    };

    interface Post {
      id: string;
      title: string;
      content: string;
      userId: string;
    }

    // 폴링 쿼리
    const pollingQuery: UseQueryOptions<{ status: string; data: any }> = {
      cacheKey: ["job", "status", "job-123"],
      url: "/jobs/job-123/status",
      staleTime: 0, // 항상 fresh data
      // refetchInterval would be set at runtime
    };
  }

  // Test 11: 타입 가드와 유틸리티 타입
  export namespace TypeGuardsAndUtilities {
    // 쿼리 옵션 타입 가드
    function isUrlBasedQuery(
      options: UseQueryOptions
    ): options is UseQueryOptions & { url: string } {
      return "url" in options && options.url !== undefined;
    }

    function isQueryFnBasedQuery(
      options: UseQueryOptions
    ): options is UseQueryOptions & { queryFn: Function } {
      return "queryFn" in options && options.queryFn !== undefined;
    }

    // 쿼리 옵션 빌더 유틸리티
    class QueryOptionsBuilder<T = unknown> {
      private options: Partial<UseQueryOptions<T>> = {};

      cacheKey(key: readonly unknown[]): this {
        this.options.cacheKey = key;
        return this;
      }

      url(url: string): this {
        this.options.url = url;
        return this;
      }

      params(params: Record<string, any>): this {
        this.options.params = params;
        return this;
      }

      schema<S extends z.ZodType>(schema: S): QueryOptionsBuilder<z.infer<S>> {
        (this.options as any).schema = schema;
        return this as any;
      }

      enabled(enabled: boolean): this {
        this.options.enabled = enabled;
        return this;
      }

      build(): UseQueryOptions<T> {
        if (!this.options.cacheKey) {
          throw new Error("cacheKey is required");
        }
        if (!this.options.url && !this.options.queryFn) {
          throw new Error("Either url or queryFn is required");
        }
        return this.options as UseQueryOptions<T>;
      }
    }

    // 사용 예시
    const builder = new QueryOptionsBuilder<{ id: number; name: string }>();
    const builtOptions = builder
      .cacheKey(["user", 1])
      .url("/users/1")
      .enabled(true)
      .build();

    expectType<UseQueryOptions<{ id: number; name: string }>>(builtOptions);
  }

  // Test 12: useQuery 함수 오버로드 시그니처 직접 테스트
  export namespace UseQueryOverloadTests {
    // Overload 1: 명시적 타입을 가진 Factory 기반
    interface UserData {
      id: number;
      name: string;
    }
    
    const mockQuery = {
      cacheKey: () => ["user"] as const,
      url: "/user",
    } as const;
    
    // Factory 기반에 명시적 타입 지정
    const explicitTypeFactory: UseQueryResult<UserData, FetchError> = {} as UseQueryResult<UserData, FetchError>;
    if (explicitTypeFactory.data) {
      expectType<UserData>(explicitTypeFactory.data);
    }
    
    // Overload 2: 스키마 추론을 가진 Factory 기반
    const schemaQuery = {
      cacheKey: () => ["user"] as const,
      url: "/user",
      schema: z.object({ id: z.number(), name: z.string() }),
    } as const;
    
    // Overload 3: Options with schema (이미 SchemaBasedValidation에서 테스트됨)
    
    // Overload 4: Options with explicit type (이미 여러 곳에서 테스트됨)
    
    // gcTime 옵션 테스트
    const withGcTime: UseQueryOptions<UserData> = {
      cacheKey: ["user"],
      url: "/user",
      gcTime: 10 * 60 * 1000, // 10분
    };
    
    // retry 옵션 테스트 (현재 타입에 없지만 추가 가능)
    const withRetry: UseQueryOptions<UserData> = {
      cacheKey: ["user"],
      url: "/user",
      // retry: 3, // 추후 추가 가능
      // retryDelay: 1000, // 추후 추가 가능
    };
    
    // refetchInterval 옵션 테스트 (현재 타입에 없지만 추가 가능)
    const withRefetchInterval: UseQueryOptions<UserData> = {
      cacheKey: ["user"],
      url: "/user",
      // refetchInterval: 5000, // 추후 추가 가능
      // refetchIntervalInBackground: true, // 추후 추가 가능
    };
    
    // onSuccess, onError 콜백 테스트 (현재 타입에 없지만 추가 가능)
    const withCallbacks: UseQueryOptions<UserData> = {
      cacheKey: ["user"],
      url: "/user",
      // onSuccess: (data: UserData) => console.log(data),
      // onError: (error: FetchError) => console.error(error),
      // onSettled: (data?: UserData, error?: FetchError) => console.log('settled'),
    };
  }

  // Test 13: 타입 추론 검증
  export namespace TypeInferenceValidation {
    // Schema 타입 추론
    const UserSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
    });

    // schema만으로 타입 추론
    const inferredFromSchema: UseQueryOptions = {
      cacheKey: ["user"],
      url: "/user",
      schema: UserSchema,
    };

    // Result 타입이 올바르게 추론되는지
    type InferredResult = UseQueryResult<z.infer<typeof UserSchema>, FetchError>;

    // select 변환 후 타입 추론
    const withSelectInference: UseQueryOptions = {
      cacheKey: ["user", "name"],
      url: "/user",
      schema: UserSchema,
      select: (user) => user.name, // string으로 추론
    };

    // 복잡한 select 체인
    const complexSelect: UseQueryOptions = {
      cacheKey: ["users", "emails"],
      url: "/users",
      schema: z.array(UserSchema),
      select: (users: z.infer<typeof UserSchema>[]) => users.map((u) => u.email).filter(Boolean),
    };

    // placeholder와 실제 데이터 타입 일치
    const matchingPlaceholder: UseQueryOptions<User> = {
      cacheKey: ["user", "placeholder"],
      url: "/user",
      placeholderData: {
        id: 0,
        name: "Loading...",
        email: "loading@example.com",
      } satisfies User, // 타입 체크
    };

    interface User {
      id: number;
      name: string;
      email: string;
    }
  }
}

  // Test 14: 실제 useQuery 함수 타입 시뮬레이션 테스트
  export namespace UseQuerySimulation {
    // useQuery의 실제 오버로드 시그니처를 시뮬레이션
    declare function useQuery<O extends UseQueryOptions<any> & { schema: ZodType }, E = FetchError>(
      options: O
    ): UseQueryResult<z.infer<O["schema"]>, E>;
    
    declare function useQuery<T, E = FetchError>(
      options: UseQueryOptions<T>
    ): UseQueryResult<T, E>;
    
    // 1. Schema 기반 타입 추론 테스트
    function testSchemaInference() {
      const UserSchema = z.object({
        id: z.number(),
        email: z.string().email(),
      });
      
      // schema가 있는 경우 타입이 자동 추론되어야 함
      const options: UseQueryOptions<any> & { schema: typeof UserSchema } = {
        cacheKey: ["user-with-schema"],
        url: "/api/user",
        schema: UserSchema,
      };
      
      const result = useQuery(options);
      
      // result.data는 z.infer<typeof UserSchema> 타입이어야 함
      if (result.data) {
        const userData: z.infer<typeof UserSchema> = result.data;
        expectType<{ id: number; email: string }>(userData);
      }
    }
    
    // 2. 명시적 타입 지정 테스트
    function testExplicitType() {
      interface User {
        id: number;
        name: string;
        email: string;
      }
      
      const result = useQuery<User>({
        cacheKey: ["user"],
        url: "/api/user",
      });
      
      if (result.data) {
        expectType<User>(result.data);
      }
    }
    
    // 3. queryFn과 타입 추론
    function testQueryFnType() {
      interface Post {
        id: string;
        title: string;
        content: string;
      }
      
      const result = useQuery<Post[]>({
        cacheKey: ["posts"],
        queryFn: async (fetcher: QueryFetcher) => {
          const response = await fetcher.get<Post[]>("/api/posts");
          return response.data;
        },
      });
      
      if (result.data) {
        expectType<Post[]>(result.data);
      }
    }
  }

// 타입 추론 테스트를 위한 실제 사용 예시 (실행되지 않음)
function typeInferenceExamples() {
  // 1. 기본 타입 추론
  const options1: UseQueryOptions<string> = {
    cacheKey: ["simple"],
    url: "/api/text",
  };

  // 2. 복잡한 타입 추론
  interface ComplexData {
    users: Array<{ id: number; name: string }>;
    posts: Array<{ id: string; title: string }>;
    metadata: {
      total: number;
      timestamp: string;
    };
  }

  const options2: UseQueryOptions<ComplexData> = {
    cacheKey: ["complex"],
    queryFn: async (fetcher: QueryFetcher) => {
      const [users, posts] = await Promise.all([
        fetcher.get<Array<{ id: number; name: string }>>("/users"),
        fetcher.get<Array<{ id: string; title: string }>>("/posts"),
      ]);
      return {
        users: users.data,
        posts: posts.data,
        metadata: {
          total: users.data.length + posts.data.length,
          timestamp: new Date().toISOString(),
        },
      };
    },
  };

  // 3. Select 변환 타입 추론
  const options3: UseQueryOptions<ComplexData> = {
    cacheKey: ["with-select"],
    url: "/api/complex",
    select: (data) => data.users.length, // number로 추론
  };

  // Result 타입 검증
  type Result1 = UseQueryResult<string, FetchError>;
  type Result2 = UseQueryResult<ComplexData, FetchError>;
  type Result3 = UseQueryResult<number, FetchError>; // select 적용 후
}