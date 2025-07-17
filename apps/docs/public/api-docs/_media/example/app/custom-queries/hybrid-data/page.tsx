"use client";

import { useQuery } from "../../lib/query-client";

interface HybridData {
  graphqlUser: {
    id: number;
    name: string;
    posts: Array<{
      id: number;
      title: string;
    }>;
  };
  restAnalytics: {
    totalViews: number;
    totalLikes: number;
    engagement: number;
  };
  combined: {
    userName: string;
    postsCount: number;
    avgViewsPerPost: number;
    engagementRate: string;
  };
}

export default function HybridDataPage() {
  const { data, error, isLoading } = useQuery<HybridData, any>({
    cacheKey: ["hybrid-data"],
    queryFn: async () => {
      try {
        // 1. GraphQL API 호출
        const graphqlResponse = await fetch("/api/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query userProfile($userId: ID!) {
                user(id: $userId) {
                  id
                  name
                  posts {
                    id
                    title
                  }
                }
              }
            `,
            variables: { userId: 1 },
          }),
        });

        if (!graphqlResponse.ok) {
          throw new Error("GraphQL request failed");
        }

        const graphqlData = await graphqlResponse.json();
        const user = graphqlData.data.user;

        // 2. REST API 호출
        const analyticsResponse = await fetch("/api/users/1/analytics");
        if (!analyticsResponse.ok) {
          throw new Error("Analytics request failed");
        }

        const analyticsData = await analyticsResponse.json();

        // 3. 두 API 결과 조합
        const hybridData: HybridData = {
          graphqlUser: user,
          restAnalytics: analyticsData,
          combined: {
            userName: user.name,
            postsCount: user.posts.length,
            avgViewsPerPost:
              user.posts.length > 0
                ? Math.round(analyticsData.totalViews / user.posts.length)
                : 0,
            engagementRate: `${analyticsData.engagement}%`,
          },
        };

        return hybridData;
      } catch (error) {
        console.error("Error fetching hybrid data:", error);
        throw error;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>GraphQL + REST 데이터를 조합하는 중...</p>
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
              하이브리드 데이터 조합 오류
            </h1>
            <p className="text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="hybrid-profile"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              하이브리드 데이터 (GraphQL + REST)
            </h1>

            {/* 조합된 프로필 정보 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-bold text-purple-800 mb-4">
                🔗 통합 프로필
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <p
                    className="text-2xl font-bold text-purple-600"
                    data-testid="profile-name"
                  >
                    {data.combined.userName}
                  </p>
                  <p className="text-sm text-purple-700">사용자명</p>
                </div>
                <div className="text-center">
                  <p
                    className="text-2xl font-bold text-blue-600"
                    data-testid="posts-count"
                  >
                    {data.combined.postsCount}
                  </p>
                  <p className="text-sm text-blue-700">게시물 수</p>
                </div>
                <div className="text-center">
                  <p
                    className="text-2xl font-bold text-green-600"
                    data-testid="total-views"
                  >
                    {data.restAnalytics.totalViews.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-700">총 조회수</p>
                </div>
                <div className="text-center">
                  <p
                    className="text-2xl font-bold text-orange-600"
                    data-testid="engagement-rate"
                  >
                    {data.combined.engagementRate}
                  </p>
                  <p className="text-sm text-orange-700">참여율</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GraphQL 데이터 */}
              <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                  <span className="mr-2">🔮</span>GraphQL 데이터
                </h3>
                <div className="space-y-4">
                  <div>
                    <p>
                      <strong>사용자 ID:</strong> {data.graphqlUser.id}
                    </p>
                    <p>
                      <strong>이름:</strong> {data.graphqlUser.name}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">게시물 목록:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {data.graphqlUser.posts.map((post) => (
                        <div
                          key={post.id}
                          className="bg-white p-2 rounded text-sm"
                        >
                          <span className="font-medium">#{post.id}</span>{" "}
                          {post.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* REST API 데이터 */}
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                  <span className="mr-2">📊</span>REST API 데이터
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded">
                      <p className="text-2xl font-bold text-blue-600">
                        {data.restAnalytics.totalViews.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-700">총 조회수</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-2xl font-bold text-green-600">
                        {data.restAnalytics.totalLikes}
                      </p>
                      <p className="text-sm text-green-700">총 좋아요</p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-lg font-bold text-orange-600">
                      {data.restAnalytics.engagement}%
                    </p>
                    <p className="text-sm text-orange-700">참여율</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 계산된 통계 */}
            <div className="mt-6 bg-gray-50 p-6 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-4">📈 계산된 통계</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-indigo-600">
                    {data.combined.avgViewsPerPost.toLocaleString()}
                  </p>
                  <p className="text-sm text-indigo-700">
                    게시물당 평균 조회수
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-pink-600">
                    {Math.round(
                      data.restAnalytics.totalLikes / data.combined.postsCount
                    )}
                  </p>
                  <p className="text-sm text-pink-700">게시물당 평균 좋아요</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-cyan-600">
                    {(
                      data.restAnalytics.totalViews /
                      data.restAnalytics.totalLikes
                    ).toFixed(1)}
                  </p>
                  <p className="text-sm text-cyan-700">
                    조회수 대비 좋아요 비율
                  </p>
                </div>
              </div>
            </div>

            {/* API 호출 과정 */}
            <div className="mt-6 border-t pt-6">
              <h4 className="font-semibold mb-4">
                🔄 하이브리드 API 호출 과정
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 border border-purple-200 p-4 rounded">
                  <h5 className="font-medium text-purple-800 mb-2">
                    1. GraphQL 쿼리
                  </h5>
                  <p className="text-sm text-purple-700">POST /api/graphql</p>
                  <p className="text-xs text-purple-600 mt-1">
                    ✅ 사용자 정보 + 게시물 목록
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                  <h5 className="font-medium text-blue-800 mb-2">
                    2. REST API 호출
                  </h5>
                  <p className="text-sm text-blue-700">
                    GET /api/users/1/analytics
                  </p>
                  <p className="text-xs text-blue-600 mt-1">✅ 분석 데이터</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
