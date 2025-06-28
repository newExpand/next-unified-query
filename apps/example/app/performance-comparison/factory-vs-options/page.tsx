"use client";

import { useState } from "react";
import { useQuery, createQueryFactory } from "../../lib/query-client";
import { z } from "next-unified-query";

const schema = z.object({
  data: z.array(z.object({
    id: z.number(),
    name: z.string(),
    value: z.number(),
  })),
});

type PerformanceTestData = z.infer<typeof schema>;

// queryFn 예제를 위한 스키마
const userWithPostsSchema = z.object({
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
  posts: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      content: z.string(),
    })
  ),
  totalPosts: z.number(),
});

type UserWithPostsData = z.infer<typeof userWithPostsSchema>;

// Factory 기반 쿼리 정의
const queryFactory = createQueryFactory({
  performanceTest: {
    cacheKey: (params: { id: number }) => ["performance-test-data", params.id],
    url: (params: { id: number }) => `/api/performance-test-data`,
    schema,
  },
  // queryFn을 사용한 복잡한 데이터 조합
  userWithPosts: {
    cacheKey: (userId: number) => ["user-with-posts", userId],
    queryFn: async (userId: number, fetcher) => {
      // 병렬로 여러 API 호출
      const [userResponse, postsResponse] = await Promise.all([
        fetcher.get(`/api/users/${userId}`),
        fetcher.get(`/api/users/${userId}/posts`),
      ]);

      const user = userResponse.data as any;
      const posts = postsResponse.data as any[];

      return {
        user,
        posts,
        totalPosts: posts.length,
      };
    },
    schema: userWithPostsSchema,
  },
});

// Factory 기반 컴포넌트
function FactoryBasedComponent({ id }: { id: number }) {
  const { data } = useQuery<PerformanceTestData>(queryFactory.performanceTest, {
    params: { id },
  });

  console.log("FactoryBasedComponent", data);

  return (
    <div>
      Factory Item {id}: {data?.data?.find(item => item.id === id)?.name || "Loading..."}
    </div>
  );
}

// Options 기반 컴포넌트
function OptionsBasedComponent({ id }: { id: number }) {
  const { data } = useQuery<PerformanceTestData>({
    cacheKey: ["performance-test-data", id],
    url: "/api/performance-test-data",
    schema,
  });

  console.log("OptionsBasedComponent", data);

  return (
    <div>
      Options Item {id}: {data?.data?.find(item => item.id === id)?.name || "Loading..."}
    </div>
  );
}

// Factory 기반 queryFn 컴포넌트
function FactoryQueryFnComponent({ userId }: { userId: number }) {
  const { data, isLoading, error } = useQuery<UserWithPostsData>(
    queryFactory.userWithPosts,
    { params: userId }
  );

  if (isLoading) return <div>Loading user and posts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-4 border rounded">
      <h4 className="font-semibold">Factory QueryFn - User {userId}</h4>
      <p>Name: {data?.user.name}</p>
      <p>Email: {data?.user.email}</p>
      <p>Total Posts: {data?.totalPosts}</p>
      <ul className="mt-2">
        {data?.posts.slice(0, 3).map((post) => (
          <li key={post.id} className="text-sm">
            • {post.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Options 기반 queryFn 컴포넌트
function OptionsQueryFnComponent({ userId }: { userId: number }) {
  const { data, isLoading, error } = useQuery<UserWithPostsData>({
    cacheKey: ["user-with-posts-options", userId],
    queryFn: async (fetcher) => {
      // Options 방식에서는 fetcher만 받음
      const [userResponse, postsResponse] = await Promise.all([
        fetcher.get(`/api/users/${userId}`),
        fetcher.get(`/api/users/${userId}/posts`),
      ]);

      const user = userResponse.data as any;
      const posts = postsResponse.data as any[];

      return {
        user,
        posts,
        totalPosts: posts.length,
      };
    },
    schema: userWithPostsSchema,
  });

  if (isLoading) return <div>Loading user and posts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-4 border rounded">
      <h4 className="font-semibold">Options QueryFn - User {userId}</h4>
      <p>Name: {data?.user.name}</p>
      <p>Email: {data?.user.email}</p>
      <p>Total Posts: {data?.totalPosts}</p>
      <ul className="mt-2">
        {data?.posts.slice(0, 3).map((post) => (
          <li key={post.id} className="text-sm">
            • {post.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FactoryVsOptionsPerformancePage() {
  const [factoryRendered, setFactoryRendered] = useState(false);
  const [optionsRendered, setOptionsRendered] = useState(false);
  const [queryFnExampleVisible, setQueryFnExampleVisible] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<{
    factoryTime: number;
    optionsTime: number;
  } | null>(null);

  const renderFactoryComponents = async () => {
    const startTime = performance.now();
    setFactoryRendered(true);

    // 렌더링 완료를 위해 다음 틱 대기
    await new Promise((resolve) => setTimeout(resolve, 100));

    const endTime = performance.now();
    setPerformanceStats(
      (prev) =>
        ({
          ...prev,
          factoryTime: endTime - startTime,
        } as any)
    );
  };

  const renderOptionsComponents = async () => {
    const startTime = performance.now();
    setOptionsRendered(true);

    // 렌더링 완료를 위해 다음 틱 대기
    await new Promise((resolve) => setTimeout(resolve, 100));

    const endTime = performance.now();
    setPerformanceStats(
      (prev) =>
        ({
          ...prev,
          optionsTime: endTime - startTime,
        } as any)
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Factory vs Options Performance Test
      </h1>

      <div className="space-y-4">
        <div className="space-x-4">
          <button
            data-testid="render-factory-components-btn"
            onClick={renderFactoryComponents}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Render Factory Components
          </button>

          <button
            data-testid="render-options-components-btn"
            onClick={renderOptionsComponents}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Render Options Components
          </button>

          <button
            onClick={() => setQueryFnExampleVisible(!queryFnExampleVisible)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            {queryFnExampleVisible ? "Hide" : "Show"} QueryFn Examples
          </button>
        </div>

        {performanceStats && (
          <div
            data-testid="performance-stats"
            className="p-4 bg-gray-100 rounded"
          >
            <h3 className="font-semibold mb-2">Performance Results:</h3>
            {performanceStats.factoryTime && (
              <div>Factory: {performanceStats.factoryTime.toFixed(2)}ms</div>
            )}
            {performanceStats.optionsTime && (
              <div>Options: {performanceStats.optionsTime.toFixed(2)}ms</div>
            )}
          </div>
        )}

        {factoryRendered && (
          <div data-testid="factory-components-rendered" className="space-y-2">
            <h3 className="font-semibold">Factory-based Components:</h3>
            {Array.from({ length: 100 }, (_, i) => (
              <FactoryBasedComponent key={i} id={i} />
            ))}
          </div>
        )}

        {optionsRendered && (
          <div data-testid="options-components-rendered" className="space-y-2">
            <h3 className="font-semibold">Options-based Components:</h3>
            {Array.from({ length: 100 }, (_, i) => (
              <OptionsBasedComponent key={i} id={i} />
            ))}
          </div>
        )}

        {queryFnExampleVisible && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold">QueryFn Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Factory QueryFn</h3>
                <FactoryQueryFnComponent userId={1} />
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                  <pre>{`// Factory 방식: params와 fetcher를 받음
queryFn: async (userId: number, fetcher) => {
  const [userRes, postsRes] = await Promise.all([
    fetcher.get(\`/api/users/\${userId}\`),
    fetcher.get(\`/api/users/\${userId}/posts\`)
  ]);
  // ...
}`}</pre>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Options QueryFn</h3>
                <OptionsQueryFnComponent userId={1} />
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                  <pre>{`// Options 방식: fetcher만 받음
queryFn: async (fetcher) => {
  const [userRes, postsRes] = await Promise.all([
    fetcher.get(\`/api/users/\${userId}\`),
    fetcher.get(\`/api/users/\${userId}/posts\`)
  ]);
  // ...
}`}</pre>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <h4 className="font-semibold">주요 차이점:</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  • Factory 방식: 파라미터를 첫 번째 인자로 받아 동적 처리 가능
                </li>
                <li>
                  • Options 방식: fetcher만 받으므로 클로저로 외부 변수 참조
                  필요
                </li>
                <li>
                  • 두 방식 모두 schema로 런타임 검증, 제네릭으로 타입
                  오버라이드 가능
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
