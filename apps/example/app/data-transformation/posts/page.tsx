"use client";

import { useQuery } from "../../lib/query-client";
import { useMemo } from "react";

// 실제 API에서 받아오는 Post 구조
interface ApiPost {
  id: string;
  userId: string;
  title: string;
  body: string;
}

// 변환된 Post 구조
interface TransformedPost {
  id: string;
  title: string;
  authorName: string;
  popularity: number;
  publishDate: string;
  summary: string;
}

export default function PostsTransformationPage() {
  // select 함수를 컴포넌트 외부에서 정의하여 메모이제이션
  const selectFunction = useMemo(
    () =>
      (posts: ApiPost[]): TransformedPost[] => {
        console.log(
          "🔄 Select function executing - transforming posts data",
          posts
        );

        return posts.map((post) => ({
          id: post.id,
          title: post.title,
          authorName: `사용자 ${post.userId}`, // userId를 사용해서 더미 작성자명 생성
          popularity: Math.floor(Math.random() * 1000) + 100, // 더미 인기도 (100-1099)
          publishDate: new Date().toLocaleDateString(), // 현재 날짜 사용
          summary: post.body.slice(0, 50) + "...", // body를 사용해서 요약 생성
        }));
      },
    []
  );

  const { data, error, isLoading, refetch } = useQuery<ApiPost[], any>({
    cacheKey: ["posts-transformation"],
    queryFn: async (fetcher) => {
      // 내장 fetcher 사용
      const response = await fetcher.get("/api/posts");
      return response.data;
    },
    select: selectFunction,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
  });

  // data는 select 함수에 의해 TransformedPost[]로 변환됨
  const transformedData = data as unknown as TransformedPost[];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>게시물 데이터를 변환하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-900 mb-4">
              데이터 조회 오류
            </h1>
            <p className="text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (transformedData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="posts-transformation"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Select 함수를 통한 데이터 변환
            </h1>

            {/* 변환 설명 */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">
                🔄 데이터 변환
              </h3>
              <p className="text-blue-700 text-sm">
                원본 API Post 데이터를 select 함수를 통해 TransformedPost로
                변환하고 있습니다. 콘솔에서 변환 과정을 확인할 수 있습니다.
              </p>
            </div>

            {/* 변환된 게시물 목록 */}
            <div className="space-y-4 mb-8" data-testid="posts-list">
              <h2 className="text-xl font-semibold text-gray-800">
                📝 변환된 게시물 목록
              </h2>
              <div
                data-testid="transform-stats"
                className="text-sm text-gray-600"
              >
                {transformedData.length} posts transformed
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transformedData.map((post: TransformedPost) => (
                  <div
                    key={post.id}
                    className="bg-gray-50 border border-gray-200 p-4 rounded-lg"
                    data-testid={`post-item-${post.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3
                        className="font-semibold text-gray-900 text-lg"
                        data-testid="post-title"
                      >
                        {post.title}
                      </h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ID: {post.id}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p>
                        <strong className="text-gray-700">작성자:</strong>
                        <span className="text-blue-600 ml-1">
                          {post.authorName}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-700">인기도:</strong>
                        <span className="text-purple-600 ml-1">
                          {post.popularity.toLocaleString()}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-700">발행일:</strong>
                        <span
                          className="text-gray-600 ml-1"
                          data-testid="post-date"
                        >
                          {post.publishDate}
                        </span>
                      </p>
                      <p
                        className="text-gray-600 text-xs mt-2 italic"
                        data-testid="post-summary"
                      >
                        {post.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 변환 로직 설명 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">⚙️ 변환 로직</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">
                    📥 실제 API 데이터 구조
                  </h4>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {`interface ApiPost {
  id: string;
  userId: string;
  title: string;
  body: string;
}`}
                  </pre>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">
                    📤 변환된 데이터 구조
                  </h4>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {`interface TransformedPost {
  id: string;
  title: string;
  authorName: string;    // userId -> "사용자 X"
  popularity: number;    // 랜덤 생성 (100-1099)
  publishDate: string;   // 현재 날짜
  summary: string;       // body 처음 50자
}`}
                  </pre>
                </div>
              </div>

              {/* Select 함수 코드 */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-3">
                  💡 Select 함수 최적화
                </h4>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p>
                    • <strong>메모이제이션:</strong> useMemo로 select 함수가 매
                    렌더링마다 재생성되지 않도록 최적화
                  </p>
                  <p>
                    • <strong>성능:</strong> 원본 데이터가 변경되지 않으면 변환
                    함수가 다시 실행되지 않음
                  </p>
                  <p>
                    • <strong>디버깅:</strong> 콘솔 로그로 select 함수 실행 시점
                    추적 가능
                  </p>
                </div>
              </div>

              {/* 실제 변환 코드 */}
              <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">
                  🔧 실제 변환 코드
                </h4>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {`const selectFunction = useMemo(
  () => (posts: ApiPost[]): TransformedPost[] => {
    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      authorName: \`사용자 \${post.userId}\`,
      popularity: Math.floor(Math.random() * 1000) + 100,
      publishDate: new Date().toLocaleDateString(),
      summary: post.body.slice(0, 50) + "..."
    }));
  },
  []
);`}
                </pre>
              </div>
            </div>

            {/* 새로고침 버튼 */}
            <div className="mt-6 text-center">
              <button
                onClick={() => refetch()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                🔄 데이터 새로고침
              </button>
              <p className="text-xs text-gray-500 mt-2">
                새로고침 시 콘솔에서 select 함수 실행 여부를 확인해보세요
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
