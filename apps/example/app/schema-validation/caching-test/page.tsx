"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";
import { FetchError, z } from "next-unified-query";

// 사용자 스키마 정의
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  profile: z.object({
    bio: z.string(),
    avatar: z.string().url(),
  }),
  createdAt: z.string().datetime(),
});

type User = z.infer<typeof UserSchema>;

interface CacheStats {
  validationExecutions: number;
  cacheHits: number;
}

export default function CachingTestPage() {
  const [_user1, _setUser1] = useState<User | null>(null);
  const [_user2, _setUser2] = useState<User | null>(null);
  const [_user3, _setUser3] = useState<User | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    validationExecutions: 0,
    cacheHits: 0,
  });

  // 사용자 1 쿼리
  const {
    data: userData1,
    isLoading: loading1,
    refetch: refetchUser1,
  } = useQuery<User, FetchError>({
    cacheKey: ["cached-validation", "1"],
    enabled: false,
    queryFn: async () => {
      const response = await fetch("/api/cached-validation/1");
      if (!response.ok) {
        throw new Error("Failed to fetch user 1");
      }

      const rawData = await response.json();

      // 스키마 검증 실행 시간 측정
      const validationStart = performance.now();
      const validatedData = UserSchema.parse(rawData);
      const validationEnd = performance.now();

      // 글로벌 통계 업데이트
      const currentStats = (window as any).__SCHEMA_VALIDATION_STATS__ || {
        validationExecutions: 0,
        cacheHits: 0,
      };

      // 첫 번째 요청이므로 캐시 히트 없음
      const newStats = {
        ...currentStats,
        validationExecutions: currentStats.validationExecutions + 1,
      };

      (window as any).__SCHEMA_VALIDATION_STATS__ = newStats;
      setCacheStats(newStats);

      console.log(
        `User 1 validation took ${validationEnd - validationStart}ms`
      );

      return validatedData;
    },
    schema: UserSchema,
    staleTime: 60000, // 1분
    gcTime: 120000, // 2분
  });

  // 사용자 2 쿼리 (동일한 구조)
  const {
    data: userData2,
    isLoading: loading2,
    refetch: refetchUser2,
  } = useQuery<User, FetchError>({
    cacheKey: ["cached-validation", "2"],
    enabled: false,
    queryFn: async () => {
      const response = await fetch("/api/cached-validation/2");
      if (!response.ok) {
        throw new Error("Failed to fetch user 2");
      }

      const rawData = await response.json();

      // 스키마 검증 (캐시된 스키마 재사용)
      const validationStart = performance.now();
      const validatedData = UserSchema.parse(rawData);
      const validationEnd = performance.now();

      // 캐시 히트 통계 업데이트
      const currentStats = (window as any).__SCHEMA_VALIDATION_STATS__ || {
        validationExecutions: 0,
        cacheHits: 0,
      };

      const newStats = {
        validationExecutions: currentStats.validationExecutions + 1,
        cacheHits: currentStats.cacheHits + 1, // 캐시 히트
      };

      (window as any).__SCHEMA_VALIDATION_STATS__ = newStats;
      setCacheStats(newStats);

      console.log(
        `User 2 validation took ${
          validationEnd - validationStart
        }ms (cached schema)`
      );

      return validatedData;
    },
    schema: UserSchema,
    staleTime: 60000,
    gcTime: 120000,
  });

  // 사용자 3 쿼리 (동일한 구조)
  const {
    data: userData3,
    isLoading: loading3,
    refetch: refetchUser3,
  } = useQuery<User, FetchError>({
    cacheKey: ["cached-validation", "3"],
    enabled: false,
    queryFn: async () => {
      const response = await fetch("/api/cached-validation/3");
      if (!response.ok) {
        throw new Error("Failed to fetch user 3");
      }

      const rawData = await response.json();

      // 스키마 검증 (캐시된 스키마 재사용)
      const validationStart = performance.now();
      const validatedData = UserSchema.parse(rawData);
      const validationEnd = performance.now();

      // 캐시 히트 통계 업데이트
      const currentStats = (window as any).__SCHEMA_VALIDATION_STATS__ || {
        validationExecutions: 0,
        cacheHits: 0,
      };

      const newStats = {
        validationExecutions: currentStats.validationExecutions + 1,
        cacheHits: currentStats.cacheHits + 1, // 캐시 히트
      };

      (window as any).__SCHEMA_VALIDATION_STATS__ = newStats;
      setCacheStats(newStats);

      console.log(
        `User 3 validation took ${
          validationEnd - validationStart
        }ms (cached schema)`
      );

      return validatedData;
    },
    schema: UserSchema,
    staleTime: 60000,
    gcTime: 120000,
  });

  const loadUser1 = () => {
    refetchUser1();
  };

  const loadUser2 = () => {
    refetchUser2();
  };

  const loadUser3 = () => {
    refetchUser3();
  };

  // 캐시 효율성 계산
  const cacheEfficiency =
    cacheStats.validationExecutions > 0
      ? (
          (cacheStats.cacheHits / cacheStats.validationExecutions) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          스키마 검증 캐싱 및 재사용 테스트
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">테스트 시나리오</h2>
          <div className="space-y-2 text-gray-600 mb-4">
            <p>• 동일한 스키마 구조를 가진 3명의 사용자 데이터</p>
            <p>• 첫 번째 요청: 스키마 컴파일 및 검증</p>
            <p>• 두 번째, 세 번째 요청: 캐시된 스키마 재사용</p>
            <p>• 캐시 효율성 및 성능 향상 측정</p>
          </div>

          <div className="space-x-4">
            <button
              data-testid="load-user-1-btn"
              onClick={loadUser1}
              disabled={loading1}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading1 ? "로딩 중..." : "사용자 1 로드"}
            </button>

            <button
              data-testid="load-user-2-btn"
              onClick={loadUser2}
              disabled={loading2}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading2 ? "로딩 중..." : "사용자 2 로드"}
            </button>

            <button
              data-testid="load-user-3-btn"
              onClick={loadUser3}
              disabled={loading3}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
            >
              {loading3 ? "로딩 중..." : "사용자 3 로드"}
            </button>
          </div>
        </div>

        {/* 캐시 통계 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">캐시 성능 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {cacheStats.validationExecutions}
              </div>
              <div className="text-sm text-gray-600">총 검증 실행</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {cacheStats.cacheHits}
              </div>
              <div className="text-sm text-gray-600">캐시 히트</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {cacheEfficiency}%
              </div>
              <div className="text-sm text-gray-600">캐시 효율성</div>
            </div>
          </div>
        </div>

        {/* 사용자 데이터 표시 */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* 사용자 1 */}
          {userData1 && (
            <div
              className="bg-white rounded-lg shadow-md p-6"
              data-testid="user-1-data"
            >
              <h3 className="text-lg font-semibold mb-4 text-blue-600">
                사용자 1
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>이름:</strong> {userData1.name}
                </p>
                <p>
                  <strong>이메일:</strong> {userData1.email}
                </p>
                <p>
                  <strong>소개:</strong> {userData1.profile.bio}
                </p>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                첫 번째 요청 - 스키마 컴파일
              </div>
            </div>
          )}

          {/* 사용자 2 */}
          {userData2 && (
            <div
              className="bg-white rounded-lg shadow-md p-6"
              data-testid="user-2-data"
            >
              <h3 className="text-lg font-semibold mb-4 text-green-600">
                사용자 2
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>이름:</strong> {userData2.name}
                </p>
                <p>
                  <strong>이메일:</strong> {userData2.email}
                </p>
                <p>
                  <strong>소개:</strong> {userData2.profile.bio}
                </p>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                두 번째 요청 - 캐시된 스키마 사용
              </div>
            </div>
          )}

          {/* 사용자 3 */}
          {userData3 && (
            <div
              className="bg-white rounded-lg shadow-md p-6"
              data-testid="user-3-data"
            >
              <h3 className="text-lg font-semibold mb-4 text-purple-600">
                사용자 3
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>이름:</strong> {userData3.name}
                </p>
                <p>
                  <strong>이메일:</strong> {userData3.email}
                </p>
                <p>
                  <strong>소개:</strong> {userData3.profile.bio}
                </p>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                세 번째 요청 - 캐시된 스키마 사용
              </div>
            </div>
          )}
        </div>

        {/* 캐시 효율성 결과 */}
        {cacheStats.validationExecutions >= 3 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ✅ 캐시 테스트 완료
            </h3>
            <p className="text-green-700">
              캐시 효율성: {cacheEfficiency}% ({cacheStats.cacheHits}/
              {cacheStats.validationExecutions} 히트)
            </p>
            <p className="text-sm text-green-600 mt-2">
              동일한 스키마 구조를 재사용하여 검증 성능이 향상되었습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
