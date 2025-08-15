import { ssrPrefetch, createQueryFactory } from "next-unified-query";
import { HydrationBoundary } from "next-unified-query/react";
import ClientComponent from "./client-component";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// QueryFactory 사용하여 타입 안전하게 정의
const queries = createQueryFactory({
  todos: {
    cacheKey: () => ["todos"] as const,
    queryFn: async (_, fetcher) => {
      const response = await fetcher.get<Todo[]>("/todos");
      return response.data.slice(0, 10); // 처음 10개만
    },
  },
  users: {
    cacheKey: () => ["users"] as const,
    url: () => "/users",
  },
});

// Server Component
export default async function SSRPage() {
  // SSR에서 데이터 미리 가져오기 - 전역 설정 자동 사용!
  const dehydratedState = await ssrPrefetch([
    [queries.todos], // 파라미터가 없는 쿼리
    [queries.users], // 파라미터가 없는 쿼리
  ]);

  return (
    <div className="container">
      <h1>SSR & RSC Example</h1>
      <p className="mb-4 text-gray">
        This page demonstrates server-side rendering with data prefetching. The
        data is fetched on the server and hydrated on the client.
      </p>

      <HydrationBoundary state={dehydratedState}>
        <ClientComponent />
      </HydrationBoundary>
    </div>
  );
}
