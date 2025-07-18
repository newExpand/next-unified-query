/**
 * useMutation Hook Type Safety Tests
 * 
 * 이 파일은 useMutation 훅의 타입 안전성을 검증합니다.
 * URL+method 기반과 mutationFn 기반 모두를 테스트합니다.
 */

import { describe, it } from 'vitest';
import type { UseMutationOptions, MutationState } from '../../src/hooks/use-mutation';
import type { NextTypeFetch, FetchError, ApiErrorResponse } from 'next-unified-query-core';
import { z } from 'next-unified-query-core';
import { expectType, type Expect, type Equal } from '../../../core/test/type-utils/expect-type';

describe('useMutation Type Safety', () => {
  describe('URL + Method based mutations', () => {
    it('should enforce correct option types', () => {
      // ✅ 올바른 URL + method 옵션
      const validUrlOptions: UseMutationOptions = {
        url: '/users',
        method: 'POST'
      };

      // ✅ 동적 URL
      const dynamicUrlOptions: UseMutationOptions<any, FetchError, { id: number; data: any }> = {
        url: (variables) => `/users/${variables.id}`,
        method: 'PUT'
      };

      // ✅ 모든 HTTP 메서드 지원 (GET 제외)
      const postOptions: UseMutationOptions = { url: '/data', method: 'POST' };
      const putOptions: UseMutationOptions = { url: '/data', method: 'PUT' };
      const deleteOptions: UseMutationOptions = { url: '/data', method: 'DELETE' };
      const patchOptions: UseMutationOptions = { url: '/data', method: 'PATCH' };

      // ❌ GET은 mutation에서 사용 불가 (실제 훅에서 런타임 체크)
      // 타입 레벨에서는 HttpMethod에 포함되어 있어 컴파일은 됨
      const getOptions: UseMutationOptions = { url: '/data', method: 'GET' };

      // ❌ URL + method와 mutationFn을 동시에 사용할 수 없음
      // @ts-expect-error Cannot have both url/method and mutationFn
      const invalidBoth: UseMutationOptions = {
        url: '/users',
        method: 'POST',
        mutationFn: async (data, fetcher) => fetcher.post('/users', data)
      };
    });

    it('should work with request/response schemas', () => {
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

      type CreateUserData = z.infer<typeof createUserSchema>;
      type UserResponse = z.infer<typeof userResponseSchema>;

      const options: UseMutationOptions<
        UserResponse,
        FetchError,
        CreateUserData,
        unknown,
        typeof createUserSchema,
        typeof userResponseSchema
      > = {
        url: '/users',
        method: 'POST',
        requestSchema: createUserSchema,
        responseSchema: userResponseSchema,
        onSuccess: (data, variables, context) => {
          // data는 UserResponse 타입으로 추론됨
          expectType<UserResponse>(data);
          expectType<CreateUserData>(variables);
        }
      };
    });
  });

  describe('Function-based mutations', () => {
    it('should enforce NextTypeFetch in mutationFn', () => {
      // ✅ 올바른 mutationFn 사용
      const validFnOptions: UseMutationOptions<any, FetchError, { name: string }> = {
        mutationFn: async (variables, fetcher: NextTypeFetch) => {
          // fetcher는 모든 HTTP 메서드 사용 가능
          const response = await fetcher.post('/users', variables);
          return response.data;
        }
      };

      // ✅ 복잡한 mutation 로직
      const complexMutation: UseMutationOptions<any, FetchError, { 
        userId: number; 
        postData: { title: string; content: string } 
      }> = {
        mutationFn: async ({ userId, postData }, fetcher) => {
          // 1. 사용자 확인
          const user = await fetcher.get(`/users/${userId}`);
          
          // 2. 포스트 생성
          const post = await fetcher.post(`/users/${userId}/posts`, postData);
          
          // 3. 알림 전송
          await fetcher.post('/notifications', {
            userId,
            message: `New post: ${postData.title}`
          });
          
          return post.data;
        }
      };

      // NextTypeFetch 타입 검증
      const fetcherTest: UseMutationOptions = {
        mutationFn: async (data, fetcher) => {
          // ✅ 모든 메서드 사용 가능
          await fetcher.get('/check');
          await fetcher.post('/create', data);
          await fetcher.put('/update', data);
          await fetcher.patch('/partial', data);
          await fetcher.delete('/remove');
          await fetcher.head('/exists');
          await fetcher.options('/options');

          // ✅ request 메서드도 모든 HTTP 메서드 지원
          await fetcher.request({ 
            url: '/custom', 
            method: 'POST',
            data 
          });

          return { success: true };
        }
      };
    });
  });

  describe('Mutation callbacks', () => {
    it('should type callback parameters correctly', () => {
      interface CreatePostData {
        title: string;
        content: string;
      }

      interface PostResponse {
        id: number;
        title: string;
        content: string;
        authorId: number;
        createdAt: string;
      }

      interface MutationContext {
        previousPosts?: PostResponse[];
      }

      const mutationOptions: UseMutationOptions<
        PostResponse,
        FetchError<ApiErrorResponse>,
        CreatePostData,
        MutationContext
      > = {
        url: '/posts',
        method: 'POST',
        
        onMutate: async (variables) => {
          // variables는 CreatePostData 타입
          expectType<CreatePostData>(variables);
          
          // context 반환
          return {
            previousPosts: []
          };
        },
        
        onSuccess: (data, variables, context) => {
          // 모든 파라미터가 올바른 타입으로 추론됨
          expectType<PostResponse>(data);
          expectType<CreatePostData>(variables);
          expectType<MutationContext | undefined>(context);
        },
        
        onError: (error, variables, context) => {
          expectType<FetchError<ApiErrorResponse>>(error);
          expectType<CreatePostData>(variables);
          expectType<MutationContext | undefined>(context);
        },
        
        onSettled: (data, error, variables, context) => {
          expectType<PostResponse | undefined>(data);
          expectType<FetchError<ApiErrorResponse> | null>(error);
          expectType<CreatePostData>(variables);
          expectType<MutationContext | undefined>(context);
        }
      };
    });

    it('should handle invalidateQueries option', () => {
      // ✅ 정적 쿼리 키 배열
      const staticInvalidation: UseMutationOptions = {
        url: '/posts',
        method: 'POST',
        invalidateQueries: [
          ['posts'],
          ['posts', 'list'],
          ['dashboard']
        ]
      };

      // ✅ 동적 쿼리 키 (함수)
      const dynamicInvalidation: UseMutationOptions<
        { id: number; authorId: number },
        FetchError,
        any
      > = {
        url: '/posts',
        method: 'POST',
        invalidateQueries: (data, variables, context) => {
          // data 기반으로 무효화할 쿼리 결정
          return [
            ['posts'],
            ['posts', data.id],
            ['users', data.authorId, 'posts']
          ];
        }
      };
    });
  });

  describe('Mutation state types', () => {
    it('should have correct state shape', () => {
      // MutationState 타입 검증
      type State = MutationState<
        { id: number; name: string }, // TData
        FetchError<{ code: string; message: string }>, // TError
        { name: string; email: string } // TVariables
      >;

      const idleState: State = {
        data: undefined,
        error: null,
        isPending: false,
        isSuccess: false,
        isError: false
      };

      const pendingState: State = {
        data: undefined,
        error: null,
        isPending: true,
        isSuccess: false,
        isError: false
      };

      const successState: State = {
        data: { id: 1, name: 'John' },
        error: null,
        isPending: false,
        isSuccess: true,
        isError: false
      };

      const errorState: State = {
        data: undefined,
        error: new FetchError(
          'Failed',
          { url: '/test' },
          'ERROR_CODE'
        ),
        isPending: false,
        isSuccess: false,
        isError: true
      };
    });
  });

  describe('Real-world patterns', () => {
    it('should handle file upload mutations', () => {
      interface UploadResponse {
        fileId: string;
        url: string;
        size: number;
        mimeType: string;
      }

      const fileUploadMutation: UseMutationOptions<
        UploadResponse,
        FetchError,
        { file: File; folder?: string }
      > = {
        mutationFn: async ({ file, folder }, fetcher) => {
          const formData = new FormData();
          formData.append('file', file);
          if (folder) {
            formData.append('folder', folder);
          }

          const response = await fetcher.post<UploadResponse>(
            '/api/upload',
            formData,
            {
              headers: {
                // Content-Type은 자동으로 multipart/form-data로 설정됨
              }
            }
          );

          return response.data;
        },
        onSuccess: (data) => {
          console.log(`File uploaded: ${data.url}`);
        }
      };
    });

    it('should handle optimistic updates', () => {
      interface Todo {
        id: number;
        text: string;
        completed: boolean;
      }

      const toggleTodoMutation: UseMutationOptions<
        Todo,
        FetchError,
        { id: number; completed: boolean },
        { previousTodo?: Todo }
      > = {
        url: (variables) => `/todos/${variables.id}`,
        method: 'PATCH',
        
        onMutate: async (variables) => {
          // 낙관적 업데이트를 위한 이전 데이터 저장
          // 실제로는 queryClient.getQueryData 사용
          const previousTodo = { id: variables.id, text: 'Todo', completed: !variables.completed };
          
          // 낙관적 업데이트
          // 실제로는 queryClient.setQueryData 사용
          
          return { previousTodo };
        },
        
        onError: (error, variables, context) => {
          // 에러 시 롤백
          if (context?.previousTodo) {
            // 실제로는 queryClient.setQueryData로 복원
          }
        },
        
        onSettled: () => {
          // 성공/실패 관계없이 쿼리 재검증
          // 실제로는 queryClient.invalidateQueries 사용
        }
      };
    });

    it('should handle multi-step mutations', () => {
      interface OrderData {
        items: Array<{ productId: string; quantity: number }>;
        shippingAddress: {
          street: string;
          city: string;
          zipCode: string;
        };
        paymentMethod: 'card' | 'paypal';
      }

      interface OrderResponse {
        orderId: string;
        status: 'pending' | 'confirmed';
        totalAmount: number;
        estimatedDelivery: string;
      }

      const createOrderMutation: UseMutationOptions<
        OrderResponse,
        FetchError,
        OrderData
      > = {
        mutationFn: async (orderData, fetcher) => {
          // 1. 재고 확인
          const stockCheck = await fetcher.post('/api/inventory/check', {
            items: orderData.items
          });

          if (!stockCheck.data.available) {
            throw new Error('Some items are out of stock');
          }

          // 2. 주문 생성
          const order = await fetcher.post<OrderResponse>('/api/orders', orderData);

          // 3. 결제 처리
          await fetcher.post('/api/payments', {
            orderId: order.data.orderId,
            method: orderData.paymentMethod
          });

          return order.data;
        },
        
        onSuccess: (data) => {
          // 주문 성공 처리
          console.log(`Order ${data.orderId} created successfully`);
        },
        
        invalidateQueries: [
          ['cart'],
          ['user', 'orders']
        ]
      };
    });
  });
});