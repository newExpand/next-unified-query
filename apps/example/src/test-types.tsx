// 실제 React 컴포넌트에서 타입이 올바르게 작동하는지 검증

import React from "react";
import {
  createQueryFactory,
  createMutationFactory,
  z,
} from "next-unified-query";

import { useQuery, useMutation } from "next-unified-query/react";

// 1. 스키마 정의 (문서와 동일)
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]),
});

// 2. Query Factory 생성 (문서와 동일)
const userQueries = createQueryFactory({
  list: {
    cacheKey: () => ["users"],
    url: () => "/api/users",
    schema: z.array(userSchema),
  },

  getById: {
    cacheKey: (id: number) => ["users", id],
    url: (id: number) => `/api/users/${id}`,
    schema: userSchema,
  },
});

// 3. 실제 컴포넌트에서 사용
function UserList() {
  // Factory 패턴: 첫 번째 인자로 factory 쿼리, 두 번째 인자로 옵션
  const { data: users } = useQuery(userQueries.list, {});

  if (users) {
    // users는 자동으로 User[] 타입
    return (
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.role}
          </li>
        ))}
      </ul>
    );
  }

  return <div>Loading...</div>;
}

function UserDetail({ userId }: { userId: number }) {
  // 파라미터가 있는 쿼리
  const { data: user } = useQuery(userQueries.getById, {
    params: userId,
  });

  if (user) {
    // user는 자동으로 User 타입
    return (
      <div>
        <h1>{user.name}</h1>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
      </div>
    );
  }

  return <div>Loading...</div>;
}

// 4. Mutation 테스트
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const userMutations = createMutationFactory({
  create: {
    url: () => "/api/users",
    method: "POST",
    requestSchema: createUserSchema,
    responseSchema: userSchema,
  },
});

function CreateUserForm() {
  const createUser = useMutation(userMutations.create);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 타입이 자동으로 추론됨
    createUser.mutate(
      {
        name: "John Doe",
        email: "john@example.com",
        password: "securepass123",
      },
      {
        onSuccess: (data) => {
          // data는 User 타입
          console.log("Created user:", data.name);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Create User</button>
    </form>
  );
}

// 5. 타입 에러 테스트 (의도적인 에러)
function TypeErrorExamples() {
  // ❌ 잘못된 파라미터 타입
  // 아래 코드는 타입 에러를 발생시켜야 함 - id는 number여야 함
  // const { data: user1 } = useQuery(userQueries.getById, {
  //   params: "string-id", // ❌ Type Error!
  // });

  // ❌ QueryFetcher에서 POST 사용 시도
  const { data: user2 } = useQuery({
    cacheKey: ["test"],
    queryFn: async (fetcher) => {
      // @ts-expect-error - QueryFetcher는 post 메서드가 없음
      return fetcher.post("/users", {});
    },
  });

  return null;
}

export { UserList, UserDetail, CreateUserForm };
