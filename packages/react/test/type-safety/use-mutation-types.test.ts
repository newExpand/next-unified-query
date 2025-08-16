/**
 * useMutation Type Safety Tests
 *
 * 이 파일은 useMutation hook의 개선된 타입 파라미터 순서와
 * 타입 추론이 올바르게 동작하는지 검증합니다.
 *
 * 개선사항:
 * - 타입 파라미터 순서: TVariables, TData, TError (사용 빈도 순)
 * - Context, RequestSchema, ResponseSchema 제거로 단순화
 * - 더 직관적인 타입 추론
 *
 * NOTE: 이 파일은 타입 검증만을 위한 것으로 실제로 실행되지 않습니다.
 */

import type {
  UseMutationOptions,
  UseMutationResult,
} from "../../src/hooks/use-mutation";
import type { FetchError } from "next-unified-query-core";
import { z } from "next-unified-query-core";
import {
  expectType,
} from "../type-utils/expect-type";

// Type-only tests - not meant to be executed
// Export to prevent TypeScript "not used" warnings
export namespace UseMutationTypeTests {
  // Test 1: 가장 일반적인 사용법 - 2개 타입 파라미터 (TVariables, TData)
  export namespace TwoParameterUsage {
    interface CreateUserInput {
      name: string;
      email: string;
      age: number;
    }

    interface User {
      id: number;
      name: string;
      email: string;
      age: number;
      createdAt: string;
    }

    // 2개 파라미터 사용 시 타입 추론
    type CreateUserOptions = UseMutationOptions<CreateUserInput, User>;
    type CreateUserResult = UseMutationResult<
      User,
      FetchError,
      CreateUserInput
    >;

    // ✅ onSuccess 콜백에서 타입이 올바르게 추론됨
    const _options: CreateUserOptions = {
      url: "/api/users",
      method: "POST",
      onSuccess: (newUser, variables, context) => {
        // newUser는 User 타입으로 추론됨
        expectType<User>(newUser);
        expectType<number>(newUser.id);
        expectType<string>(newUser.name);

        // variables는 CreateUserInput 타입으로 추론됨
        expectType<CreateUserInput>(variables);
        expectType<string>(variables.name);
        expectType<string>(variables.email);

        // context는 any 타입 (단순화됨)
        expectType<any>(context);
      },
      onError: (error, variables, context) => {
        // error는 기본 FetchError 타입
        expectType<FetchError>(error);
        expectType<CreateUserInput>(variables);
        expectType<any>(context);
      },
    };

    // ✅ mutate 함수의 타입 추론
    const result: CreateUserResult = {} as any;

    // mutate는 CreateUserInput을 받음
    result.mutate({
      name: "John",
      email: "john@example.com",
      age: 30,
    });

    // ❌ 잘못된 타입은 에러
    result.mutate({
      name: "John",
      email: "john@example.com",
      // @ts-expect-error - age must be number
      age: "30",
    });

    // data는 User 타입
    if (result.isSuccess) {
      expectType<User | undefined>(result.data);
      if (result.data) {
        expectType<number>(result.data.id);
        expectType<string>(result.data.name);
      }
    }
  }

  // Test 2: 커스텀 에러 타입 포함 - 3개 타입 파라미터
  export namespace ThreeParameterUsage {
    interface UpdatePostInput {
      id: number;
      title?: string;
      content?: string;
    }

    interface Post {
      id: number;
      title: string;
      content: string;
      updatedAt: string;
    }

    interface CustomError extends FetchError {
      validationErrors?: string[];
    }

    // 3개 파라미터 사용 시 타입 추론
    type UpdatePostOptions = UseMutationOptions<
      UpdatePostInput,
      Post,
      CustomError
    >;
    type UpdatePostResult = UseMutationResult<
      Post,
      CustomError,
      UpdatePostInput
    >;

    const options: UpdatePostOptions = {
      url: (data) => `/api/posts/${data.id}`,
      method: "PATCH",
      onSuccess: (updatedPost, variables, context) => {
        expectType<Post>(updatedPost);
        expectType<UpdatePostInput>(variables);
        expectType<any>(context);
      },
      onError: (error, variables, context) => {
        // 커스텀 에러 타입이 적용됨
        expectType<CustomError>(error);
        expectType<string[] | undefined>(error.validationErrors);
        expectType<UpdatePostInput>(variables);
      },
    };

    const result: UpdatePostResult = {} as any;

    // error는 CustomError 타입
    if (result.isError) {
      expectType<CustomError | null>(result.error);
      if (result.error) {
        expectType<string[] | undefined>(result.error.validationErrors);
      }
    }
  }

  // Test 3: Zod 스키마 기반 타입 추론
  export namespace SchemaBasedInference {
    // 요청 스키마
    const createProductSchema = z.object({
      name: z.string().min(1),
      price: z.number().positive(),
      description: z.string().optional(),
      inStock: z.boolean(),
    });

    // 응답 스키마
    const productResponseSchema = z.object({
      id: z.string().uuid(),
      name: z.string(),
      price: z.number(),
      description: z.string().nullable(),
      inStock: z.boolean(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    });

    type CreateProductInput = z.infer<typeof createProductSchema>;
    type ProductResponse = z.infer<typeof productResponseSchema>;

    // 스키마를 사용한 옵션
    const options: UseMutationOptions<CreateProductInput, ProductResponse> = {
      url: "/api/products",
      method: "POST",
      requestSchema: createProductSchema, // 요청 검증
      responseSchema: productResponseSchema, // 응답 검증
      onSuccess: (product, variables) => {
        // 스키마에서 추론된 타입
        expectType<ProductResponse>(product);
        expectType<string>(product.id);
        expectType<number>(product.price);

        expectType<CreateProductInput>(variables);
        expectType<string>(variables.name);
        expectType<boolean>(variables.inStock);
      },
    };

    // 스키마 검증이 적용됨
    const result = {} as UseMutationResult<
      ProductResponse,
      FetchError,
      CreateProductInput
    >;

    result.mutate({
      name: "Product",
      price: 99.99,
      inStock: true,
      // description은 optional이므로 생략 가능
    });

    // ❌ 스키마와 맞지 않는 데이터
    result.mutate({
      name: "Product",
      // @ts-expect-error - price must be number
      price: "99.99",
      inStock: true,
    });
  }

  // Test 4: mutationFn 사용 시 타입 추론
  export namespace CustomMutationFunction {
    interface LoginInput {
      email: string;
      password: string;
    }

    interface AuthResponse {
      token: string;
      user: {
        id: string;
        email: string;
        name: string;
      };
    }

    // Custom mutation function
    const options: UseMutationOptions<LoginInput, AuthResponse> = {
      mutationFn: async (credentials, fetcher) => {
        // credentials는 LoginInput 타입
        expectType<LoginInput>(credentials);
        expectType<string>(credentials.email);
        expectType<string>(credentials.password);

        // fetcher는 NextTypeFetch 타입
        const response = await fetcher.post<AuthResponse>(
          "/api/auth/login",
          credentials
        );

        // 추가 로직 수행 가능
        localStorage.setItem("token", response.data.token);

        return response.data;
      },
      onSuccess: (data, variables) => {
        expectType<AuthResponse>(data);
        expectType<string>(data.token);
        expectType<LoginInput>(variables);
      },
    };
  }

  // Test 5: Factory 패턴과의 호환성
  export namespace FactoryPatternCompatibility {
    interface DeleteInput {
      id: number;
    }

    // 간단한 inline config 테스트
    const deleteConfig = {
      url: (data: DeleteInput) => `/api/items/${data.id}`,
      method: "DELETE" as const,
      onSuccess: (data: void, variables: DeleteInput) => {
        console.log(`Deleted item ${variables.id}`);
      },
    };

    // Factory config를 사용한 mutation
    type DeleteOptions = typeof deleteConfig;
    type DeleteResult = UseMutationResult<void, FetchError, DeleteInput>;

    const result: DeleteResult = {} as any;

    result.mutate({ id: 123 });

    // ❌ 잘못된 타입
    // @ts-expect-error - id must be number
    result.mutate({ id: "123" });
  }

  // Test 5-2: createMutationFactory를 사용한 고급 Factory 패턴
  export namespace AdvancedFactoryPattern {
    type MutationConfig<V, D, E> = import("next-unified-query-core").MutationConfig<V, D, E>;
    type ExtractMutationVariables<T> = import("next-unified-query-core").ExtractMutationVariables<T>;
    type ExtractMutationData<T> = import("next-unified-query-core").ExtractMutationData<T>;
    type ExtractMutationError<T> = import("next-unified-query-core").ExtractMutationError<T>;
    type FetchError = import("next-unified-query-core").FetchError;

    // 스키마 정의
    const createUserSchema = z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.number().min(0)
    });

    const userResponseSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      age: z.number(),
      createdAt: z.string()
    });

    const updateUserSchema = z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      age: z.number().min(0).optional()
    });

    // Factory 생성 (실제 createMutationFactory 시뮬레이션)
    // satisfies를 사용하지 않고 const assertion 사용
    const userMutationConfigs = {
      create: {
        url: () => '/users',
        method: 'POST' as const,
        requestSchema: createUserSchema,
        responseSchema: userResponseSchema,
        onSuccess: (newUser: z.infer<typeof userResponseSchema>) => {
          expectType<z.infer<typeof userResponseSchema>>(newUser);
          expectType<number>(newUser.id);
          expectType<string>(newUser.createdAt);
        }
      } as MutationConfig<z.infer<typeof createUserSchema>, z.infer<typeof userResponseSchema>, FetchError>,
      
      update: {
        url: (data: z.infer<typeof updateUserSchema>) => `/users/${data.id}`,
        method: 'PUT' as const,
        requestSchema: updateUserSchema,
        responseSchema: userResponseSchema
      } as MutationConfig<z.infer<typeof updateUserSchema>, z.infer<typeof userResponseSchema>, FetchError>,
      
      delete: {
        url: (id: number) => `/users/${id}`,
        method: 'DELETE' as const,
        onSuccess: (_data: void, variables: number) => {
          expectType<number>(variables);
        }
      } as MutationConfig<number, void, FetchError>,

      // mutationFn을 사용하는 복잡한 케이스
      bulkCreate: {
        mutationFn: async (users: z.infer<typeof createUserSchema>[], fetcher: any) => {
          const results = await Promise.all(
            users.map(user => fetcher.post('/users', user))
          );
          return results.map(r => r.data as z.infer<typeof userResponseSchema>);
        },
        onSuccess: (createdUsers: z.infer<typeof userResponseSchema>[]) => {
          expectType<z.infer<typeof userResponseSchema>[]>(createdUsers);
          if (createdUsers.length > 0) {
            expectType<number>(createdUsers[0].id);
          }
        }
      } as MutationConfig<z.infer<typeof createUserSchema>[], z.infer<typeof userResponseSchema>[], FetchError>
    } as const;

    // 타입 추출 테스트
    type CreateVariables = ExtractMutationVariables<typeof userMutationConfigs.create>;
    type CreateData = ExtractMutationData<typeof userMutationConfigs.create>;
    type CreateError = ExtractMutationError<typeof userMutationConfigs.create>;

    // 타입이 제대로 추출되었는지 직접 확인
    // CreateVariables는 z.infer<typeof createUserSchema>와 같아야 함
    type ExpectedCreateVariables = z.infer<typeof createUserSchema>;
    type TestCreateVariablesEquality = CreateVariables extends ExpectedCreateVariables 
      ? ExpectedCreateVariables extends CreateVariables 
        ? true 
        : false 
      : false;
    const _testVariablesEquality: TestCreateVariablesEquality = true;

    // 타입 검증
    const createVars: CreateVariables = {
      name: "John",
      email: "john@example.com",
      age: 30
    };

    const createResponse: CreateData = {
      id: 1,
      name: "John",
      email: "john@example.com",
      age: 30,
      createdAt: "2024-01-01"
    };

    // useMutation과 함께 사용 시 타입 추론
    type CreateMutationResult = UseMutationResult<
      CreateData,
      CreateError,
      CreateVariables
    >;

    const createMutation: CreateMutationResult = {} as any;
    
    // ✅ 올바른 타입
    createMutation.mutate({
      name: "Jane",
      email: "jane@example.com",
      age: 25
    });

    // 타입 추론 확인을 위한 테스트
    // Variables 타입이 올바르게 추론되는지 확인
    const testVariables: CreateVariables = {
      name: "Test",
      email: "test@example.com", 
      age: 30
    };
    
    // Variables를 직접 사용하여 타입 체크
    expectType<CreateVariables>(testVariables);
    expectType<string>(testVariables.name);
    expectType<string>(testVariables.email);
    expectType<number>(testVariables.age);
    
    // expectType 동작 테스트 - 의도적으로 잘못된 타입 전달
    // @ts-expect-error - Testing expectType: string is not number
    expectType<number>(testVariables.name);
    // @ts-expect-error - Testing expectType: string is not boolean  
    expectType<boolean>(testVariables.email);
    // @ts-expect-error - Testing expectType: number is not string
    expectType<string>(testVariables.age);
    
    // 추가 테스트: 복잡한 타입 체크
    const testData: CreateData = createResponse;
    expectType<number>(testData.id);
    expectType<string>(testData.name);
    // @ts-expect-error - createdAt is string, not number
    expectType<number>(testData.createdAt);
    
    // 타입 안전성 확인 - 이제 제대로 타입 에러가 발생함!
    const wrongVariables: CreateVariables = {
      // @ts-expect-error - Type 'number' is not assignable to type 'string'
      name: 123,
      email: "test@example.com",
      age: 30
    };
    
    void testVariables; // 사용되지 않는 변수 경고 제거
    void wrongVariables; // 사용되지 않는 변수 경고 제거
    void testData; // 사용되지 않는 변수 경고 제거

    // Data는 response 타입 검증
    if (createMutation.isSuccess) {
      expectType<CreateData | undefined>(createMutation.data);
      if (createMutation.data) {
        expectType<number>(createMutation.data.id);
        expectType<string>(createMutation.data.createdAt);
      }
    }

    // mutationFn 사용 시 타입 추론
    type BulkCreateVariables = ExtractMutationVariables<typeof userMutationConfigs.bulkCreate>;
    type BulkCreateData = ExtractMutationData<typeof userMutationConfigs.bulkCreate>;

    const bulkCreateVars: BulkCreateVariables = [
      { name: "User1", email: "user1@example.com", age: 20 },
      { name: "User2", email: "user2@example.com", age: 25 }
    ];

    const bulkCreateResponse: BulkCreateData = [
      { id: 1, name: "User1", email: "user1@example.com", age: 20, createdAt: "2024-01-01" },
      { id: 2, name: "User2", email: "user2@example.com", age: 25, createdAt: "2024-01-01" }
    ];
  }

  // Test 6: 다양한 HTTP 메서드 지원
  export namespace HTTPMethodSupport {
    interface ResourceData {
      field1: string;
      field2: number;
    }

    // POST
    const postOptions: UseMutationOptions<ResourceData, ResourceData> = {
      url: "/api/resource",
      method: "POST",
    };

    // PUT
    const putOptions: UseMutationOptions<ResourceData, ResourceData> = {
      url: "/api/resource",
      method: "PUT",
    };

    // PATCH
    const patchOptions: UseMutationOptions<
      Partial<ResourceData>,
      ResourceData
    > = {
      url: "/api/resource",
      method: "PATCH",
    };

    // DELETE
    const deleteOptions: UseMutationOptions<{ id: number }, void> = {
      url: (data) => `/api/resource/${data.id}`,
      method: "DELETE",
    };

    // ❌ GET은 허용되지 않음 (useMutation에서)
    const _getOptions: UseMutationOptions<void, ResourceData> = {
      url: "/api/resource",
      // @ts-expect-error - GET method not allowed in mutation
      method: "GET",
    };

    // ❌ HEAD도 허용되지 않음 (useMutation에서)
    const _headOptions: UseMutationOptions<void, ResourceData> = {
      url: "/api/resource",
      // @ts-expect-error - HEAD method not allowed in mutation
      method: "HEAD",
    };
  }

  // Test 7: onMutate와 optimistic updates
  export namespace OptimisticUpdates {
    interface TodoInput {
      title: string;
      completed: boolean;
    }

    interface Todo extends TodoInput {
      id: number;
      createdAt: string;
    }

    const options: UseMutationOptions<TodoInput, Todo> = {
      url: "/api/todos",
      method: "POST",
      onMutate: async (newTodo) => {
        // newTodo는 TodoInput 타입
        expectType<TodoInput>(newTodo);
        expectType<string>(newTodo.title);

        // Optimistic update를 위한 임시 데이터
        const optimisticTodo: Todo = {
          ...newTodo,
          id: Date.now(),
          createdAt: new Date().toISOString(),
        };

        // context 반환 (any 타입)
        return { optimisticTodo };
      },
      onSuccess: (data, variables, context) => {
        expectType<Todo>(data);
        expectType<TodoInput>(variables);
        expectType<any>(context);

        // context에서 optimistic 데이터 접근 가능
        if (context?.optimisticTodo) {
          console.log("Replacing optimistic todo with real data");
        }
      },
      onError: (error, variables, context) => {
        expectType<FetchError>(error);
        expectType<TodoInput>(variables);

        // Rollback 로직
        if (context?.optimisticTodo) {
          console.log("Rolling back optimistic update");
        }
      },
    };
  }

  // Test 8: invalidateQueries 타입 검증
  export namespace QueryInvalidation {
    interface CommentInput {
      postId: number;
      content: string;
    }

    interface Comment {
      id: number;
      postId: number;
      content: string;
      author: string;
      createdAt: string;
    }

    // 정적 쿼리 키 무효화
    const staticInvalidation: UseMutationOptions<CommentInput, Comment> = {
      url: "/api/comments",
      method: "POST",
      invalidateQueries: [["posts"], ["comments"], ["recent-activity"]],
    };

    // 동적 쿼리 키 무효화
    const dynamicInvalidation: UseMutationOptions<CommentInput, Comment> = {
      url: "/api/comments",
      method: "POST",
      invalidateQueries: (newComment, variables, context) => {
        expectType<Comment>(newComment);
        expectType<CommentInput>(variables);
        expectType<any>(context);

        return [
          ["posts", variables.postId.toString()],
          ["comments", "post", variables.postId.toString()],
          ["user", "activity"],
        ];
      },
    };
  }

  // Test 9: 실제 사용 예제 시나리오
  export namespace RealWorldExample {
    // 사용자 프로필 업데이트
    interface UpdateProfileInput {
      name?: string;
      bio?: string;
      avatar?: string;
    }

    interface UserProfile {
      id: string;
      name: string;
      bio: string;
      avatar: string;
      updatedAt: string;
    }

    const updateProfile: UseMutationOptions<UpdateProfileInput, UserProfile> = {
      url: "/api/profile",
      method: "PATCH",
      onSuccess: (updatedProfile, changes) => {
        // 타입이 명확하게 추론됨
        console.log(`Profile updated: ${updatedProfile.name}`);

        if (changes.avatar) {
          console.log("Avatar was changed");
        }
      },
    };

    // 파일 업로드
    interface UploadInput {
      file: File;
      description?: string;
    }

    interface UploadResponse {
      id: string;
      url: string;
      size: number;
      mimeType: string;
    }

    const uploadFile: UseMutationOptions<UploadInput, UploadResponse> = {
      mutationFn: async (data, fetcher) => {
        const formData = new FormData();
        formData.append("file", data.file);
        if (data.description) {
          formData.append("description", data.description);
        }

        const response = await fetcher.post<UploadResponse>(
          "/api/upload",
          formData
        );
        return response.data;
      },
      onSuccess: (result, input) => {
        expectType<UploadResponse>(result);
        expectType<string>(result.url);
        expectType<UploadInput>(input);
        expectType<File>(input.file);
      },
    };
  }

  // Test 10: 타입 파라미터 순서 검증
  export namespace ParameterOrderValidation {
    interface Input {
      value: string;
    }

    interface Output {
      result: number;
    }

    interface CustomErr extends FetchError {
      code: string;
    }

    // ✅ 올바른 순서: TVariables, TData, TError
    type Correct2Params = UseMutationOptions<Input, Output>;
    type Correct3Params = UseMutationOptions<Input, Output, CustomErr>;

    // Result 타입도 같은 순서 따름
    type Result2Params = UseMutationResult<Output, FetchError, Input>;
    type Result3Params = UseMutationResult<Output, CustomErr, Input>;

    // 타입 체크
    const options: Correct3Params = {
      url: "/api/process",
      method: "POST",
      onSuccess: (output, input, context) => {
        // 순서대로 타입이 적용됨
        expectType<Output>(output); // TData (두 번째)
        expectType<Input>(input); // TVariables (첫 번째)
        expectType<any>(context); // 단순화됨
      },
      onError: (error, input, context) => {
        expectType<CustomErr>(error); // TError (세 번째)
        expectType<Input>(input); // TVariables (첫 번째)
      },
    };
  }
}
