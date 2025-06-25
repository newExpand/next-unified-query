import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMutationFactory, QueryClient, z } from "../src/index";
import { useMutation, QueryClientProvider } from "../src/react";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";

const mockResponse = (data: any) => ({
  data,
  status: 200,
  statusText: "OK",
  headers: new Headers(),
  config: {},
});

const createWrapper = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

// 스키마 정의
const userCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).optional(),
});

const userResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  age: z.number().optional(),
  createdAt: z.string(),
});

const userUpdateSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  age: z.number().min(0).optional(),
});

// 테스트용 mutation 팩토리 정의
const userMutations = createMutationFactory({
  // URL + Method 방식 - 사용자 생성
  createUser: {
    cacheKey: ["users", "create"],
    url: "/api/users",
    method: "POST" as const,
    requestSchema: userCreateSchema,
    responseSchema: userResponseSchema,
    invalidateQueries: [["users"]],
    onSuccess: vi.fn(),
  },

  // URL + Method 방식 - 동적 URL (사용자 수정)
  updateUser: {
    cacheKey: ["users", "update"],
    url: (variables: {
      id: number;
      name?: string;
      email?: string;
      age?: number;
    }) => `/api/users/${variables.id}`,
    method: "PUT" as const,
    requestSchema: userUpdateSchema,
    responseSchema: userResponseSchema,
    invalidateQueries: (data, variables) => [
      ["users"],
      ["users", variables.id],
    ],
  },

  // URL + Method 방식 - 사용자 삭제
  deleteUser: {
    cacheKey: ["users", "delete"],
    url: (variables: { id: number }) => `/api/users/${variables.id}`,
    method: "DELETE" as const,
    onSuccess: vi.fn((data, variables) => {
      console.log(`User ${variables.id} deleted`);
    }),
    invalidateQueries: [["users"]],
  },

  // Custom Function 방식 - 복잡한 사용자 생성 (프로필 + 아바타)
  createUserWithProfile: {
    cacheKey: ["users", "create-with-profile"],
    mutationFn: async (
      variables: {
        userData: { name: string; email: string };
        profileData: { bio: string };
        avatar?: File;
      },
      fetcher
    ) => {
      // 1단계: 사용자 생성
      const userResult = await fetcher.request({
        url: "/api/users",
        method: "POST",
        data: variables.userData,
        schema: userResponseSchema,
      });

      // 2단계: 아바타 업로드 (있는 경우)
      let avatarUrl: string | null = null;
      if (variables.avatar) {
        const formData = new FormData();
        formData.append("avatar", variables.avatar);

        const uploadResult = await fetcher.request({
          url: "/api/upload/avatar",
          method: "POST",
          data: formData,
          schema: z.object({ url: z.string() }),
        });
        avatarUrl = (uploadResult.data as { url: string }).url;
      }

      // 3단계: 프로필 생성
      const profileResult = await fetcher.request({
        url: `/api/users/${(userResult.data as { id: number }).id}/profile`,
        method: "POST",
        data: {
          ...variables.profileData,
          avatar: avatarUrl,
        },
        schema: z.object({
          id: z.number(),
          bio: z.string(),
          avatar: z.string().nullable(),
        }),
      });

      return {
        user: userResult.data,
        profile: profileResult.data,
      };
    },
    responseSchema: z.object({
      user: userResponseSchema,
      profile: z.object({
        id: z.number(),
        bio: z.string(),
        avatar: z.string().nullable(),
      }),
    }),
    invalidateQueries: [["users"], ["profiles"]],
  },

  // Custom Function 방식 - 배치 업데이트
  batchUpdateUsers: {
    cacheKey: ["users", "batch-update"],
    mutationFn: async (
      userUpdates: Array<{
        id: number;
        updates: Partial<{ name: string; email: string }>;
      }>,
      fetcher
    ) => {
      const results = await Promise.allSettled(
        userUpdates.map(({ id, updates }) =>
          fetcher.request({
            url: `/api/users/${id}`,
            method: "PATCH",
            data: updates,
            schema: userResponseSchema,
          })
        )
      );

      const successful = results
        .map((result, index) => ({ result, original: userUpdates[index] }))
        .filter(({ result }) => result.status === "fulfilled")
        .map(({ result, original }) => ({
          id: original.id,
          data: (result as PromiseFulfilledResult<any>).value.data,
        }));

      const failed = results
        .map((result, index) => ({ result, original: userUpdates[index] }))
        .filter(({ result }) => result.status === "rejected")
        .map(({ result, original }) => ({
          id: original.id,
          error: (result as PromiseRejectedResult).reason,
        }));

      return { successful, failed, total: userUpdates.length };
    },
    onError: vi.fn(),
  },
});

describe("useMutation Factory-based 사용법", () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient();
    client.clear();
    // vi.clearAllMocks(); // 이를 제거하거나 각 테스트에서 필요한 spy를 재설정
  });

  describe("URL + Method 방식", () => {
    it("POST 요청으로 사용자 생성 성공", async () => {
      const responseData = {
        id: 1,
        name: "Alice",
        email: "alice@example.com",
        age: 25,
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(
        mockResponse(responseData)
      );

      const { result } = renderHook(
        () => useMutation(userMutations.createUser),
        { wrapper: createWrapper(client) }
      );

      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toBeUndefined();

      await act(async () => {
        result.current.mutate({
          name: "Alice",
          email: "alice@example.com",
          age: 25,
        });
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(responseData);
      expect(result.current.isError).toBe(false);

      expect(client.getFetcher().request).toHaveBeenCalledWith({
        url: "/api/users",
        method: "POST",
        data: { name: "Alice", email: "alice@example.com", age: 25 },
        schema: userResponseSchema,
      });
    });

    it("동적 URL로 사용자 수정 성공", async () => {
      const responseData = {
        id: 1,
        name: "Alice Updated",
        email: "alice.updated@example.com",
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(
        mockResponse(responseData)
      );

      const { result } = renderHook(
        () => useMutation(userMutations.updateUser),
        { wrapper: createWrapper(client) }
      );

      await act(async () => {
        result.current.mutate({
          id: 1,
          name: "Alice Updated",
          email: "alice.updated@example.com",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(responseData);
      expect(client.getFetcher().request).toHaveBeenCalledWith({
        url: "/api/users/1",
        method: "PUT",
        data: {
          id: 1,
          name: "Alice Updated",
          email: "alice.updated@example.com",
        },
        schema: userResponseSchema,
      });
    });

    it("DELETE 요청으로 사용자 삭제 성공", async () => {
      vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(
        mockResponse({ success: true })
      );

      const { result } = renderHook(
        () => useMutation(userMutations.deleteUser),
        { wrapper: createWrapper(client) }
      );

      await act(async () => {
        result.current.mutate({ id: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(client.getFetcher().request).toHaveBeenCalledWith({
        url: "/api/users/1",
        method: "DELETE",
        data: { id: 1 },
      });
    });

    it("요청 스키마 검증 실패 시 에러", async () => {
      const { result } = renderHook(
        () => useMutation(userMutations.createUser),
        { wrapper: createWrapper(client) }
      );

      await act(async () => {
        result.current.mutate({
          name: "", // 빈 문자열 - 스키마 검증 실패
          email: "invalid-email", // 잘못된 이메일
        } as any);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as any)?.isValidationError).toBe(true);
    });
  });

  describe("Custom Function 방식", () => {
    it("복잡한 다단계 mutation 성공", async () => {
      const userResponseData = {
        id: 1,
        name: "Alice",
        email: "alice@example.com",
        createdAt: new Date().toISOString(),
      };

      const uploadResponseData = { url: "https://example.com/avatar.jpg" };
      const profileResponseData = {
        id: 1,
        bio: "Hello, I'm Alice",
        avatar: "https://example.com/avatar.jpg",
      };

      vi.spyOn(client.getFetcher(), "request")
        .mockResolvedValueOnce(mockResponse(userResponseData)) // 사용자 생성
        .mockResolvedValueOnce(mockResponse(uploadResponseData)) // 아바타 업로드
        .mockResolvedValueOnce(mockResponse(profileResponseData)); // 프로필 생성

      const { result } = renderHook(
        () => useMutation(userMutations.createUserWithProfile),
        { wrapper: createWrapper(client) }
      );

      const mockFile = new File([""], "avatar.jpg", { type: "image/jpeg" });

      await act(async () => {
        result.current.mutate({
          userData: { name: "Alice", email: "alice@example.com" },
          profileData: { bio: "Hello, I'm Alice" },
          avatar: mockFile,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        user: userResponseData,
        profile: profileResponseData,
      });

      // 3번의 API 호출이 순서대로 실행되었는지 확인
      expect(client.getFetcher().request).toHaveBeenCalledTimes(3);
    });

    it("배치 업데이트에서 일부 실패 처리", async () => {
      const successUser = {
        id: 1,
        name: "Alice Updated",
        email: "alice@example.com",
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(client.getFetcher(), "request")
        .mockResolvedValueOnce(mockResponse(successUser)) // 첫 번째 성공
        .mockRejectedValueOnce(new Error("Network error")); // 두 번째 실패

      const { result } = renderHook(
        () => useMutation(userMutations.batchUpdateUsers),
        { wrapper: createWrapper(client) }
      );

      await act(async () => {
        result.current.mutate([
          { id: 1, updates: { name: "Alice Updated" } },
          { id: 2, updates: { name: "Bob Updated" } },
        ]);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        successful: [{ id: 1, data: successUser }],
        failed: [{ id: 2, error: expect.any(Error) }],
        total: 2,
      });
    });
  });

  describe("콜백 및 상태 관리", () => {
    it("onSuccess 콜백 실행", async () => {
      const onSuccessSpy = vi.fn();
      const factoryOnSuccessSpy = userMutations.deleteUser.onSuccess as any;

      vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(
        mockResponse({ success: true })
      );

      const { result } = renderHook(
        () =>
          useMutation(userMutations.deleteUser, { onSuccess: onSuccessSpy }),
        { wrapper: createWrapper(client) }
      );

      await act(async () => {
        result.current.mutate({ id: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Factory의 onSuccess와 옵션의 onSuccess 둘 다 호출되어야 함
      expect(factoryOnSuccessSpy).toHaveBeenCalled();
      expect(onSuccessSpy).toHaveBeenCalled();
    });

    it("invalidateQueries 동적 함수 실행", async () => {
      const responseData = {
        id: 1,
        name: "Alice Updated",
        email: "alice@example.com",
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(
        mockResponse(responseData)
      );

      const invalidateQueriesSpy = vi.spyOn(client, "invalidateQueries");

      const { result } = renderHook(
        () => useMutation(userMutations.updateUser),
        { wrapper: createWrapper(client) }
      );

      await act(async () => {
        result.current.mutate({ id: 1, name: "Alice Updated" });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // invalidateQueries 함수로 전달된 키들이 무효화되었는지 확인
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(["users"]);
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(["users", 1]);
    });

    it("mutateAsync 사용법", async () => {
      const responseData = {
        id: 1,
        name: "Alice",
        email: "alice@example.com",
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(
        mockResponse(responseData)
      );

      const { result } = renderHook(
        () => useMutation(userMutations.createUser),
        { wrapper: createWrapper(client) }
      );

      let mutateAsyncResult: any;
      await act(async () => {
        mutateAsyncResult = await result.current.mutateAsync({
          name: "Alice",
          email: "alice@example.com",
        });
      });

      expect(mutateAsyncResult).toEqual(responseData);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(responseData);
    });

    it("reset 함수로 상태 초기화", async () => {
      vi.spyOn(client.getFetcher(), "request").mockResolvedValueOnce(
        mockResponse({
          id: 1,
          name: "Alice",
          email: "alice@example.com",
          createdAt: new Date().toISOString(),
        })
      );

      const { result } = renderHook(
        () => useMutation(userMutations.createUser),
        { wrapper: createWrapper(client) }
      );

      // mutation 실행
      await act(async () => {
        result.current.mutate({ name: "Alice", email: "alice@example.com" });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // reset 실행
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  describe("에러 처리", () => {
    it("네트워크 에러 처리", async () => {
      vi.spyOn(client.getFetcher(), "request").mockRejectedValueOnce(
        new Error("Network error")
      );

      const { result } = renderHook(
        () => useMutation(userMutations.createUser),
        { wrapper: createWrapper(client) }
      );

      await act(async () => {
        result.current.mutate({ name: "Alice", email: "alice@example.com" });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe("Network error");
      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(false);
    });

    it("Custom Function에서 에러 발생 시 처리", async () => {
      const factoryOnErrorSpy = userMutations.batchUpdateUsers.onError as any;

      // 모든 요청이 실패하도록 설정
      vi.spyOn(client.getFetcher(), "request")
        .mockRejectedValueOnce(new Error("First request failed"))
        .mockRejectedValueOnce(new Error("Second request failed"));

      const { result } = renderHook(
        () => useMutation(userMutations.batchUpdateUsers),
        { wrapper: createWrapper(client) }
      );

      await act(async () => {
        result.current.mutate([
          { id: 1, updates: { name: "Test1" } },
          { id: 2, updates: { name: "Test2" } },
        ]);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true); // batchUpdateUsers는 Promise.allSettled를 사용하므로 성공으로 처리됨
      });

      // 결과에서 실패한 항목들이 있는지 확인
      expect(result.current.data).toEqual({
        successful: [],
        failed: [
          { id: 1, error: expect.any(Error) },
          { id: 2, error: expect.any(Error) },
        ],
        total: 2,
      });
    });
  });
});
