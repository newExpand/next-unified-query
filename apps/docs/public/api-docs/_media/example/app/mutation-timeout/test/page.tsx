"use client";

import { useState } from "react";
import { useMutation, createMutationFactory } from "../../lib/query-client";

// 타임아웃 테스트를 위한 mutation factory
const timeoutMutations = createMutationFactory({
  // 기본 타임아웃 (30초) 테스트
  defaultTimeout: {
    cacheKey: ["timeout", "default"],
    url: "/api/slow-mutation",
    method: "POST" as const,
    onSuccess: (data) => {
      console.log("기본 타임아웃 성공:", data);
    },
    onError: (error) => {
      console.error("기본 타임아웃 에러:", error);
    },
  },

  // 짧은 타임아웃 (2초) 테스트
  shortTimeout: {
    cacheKey: ["timeout", "short"],
    url: "/api/slow-mutation",
    method: "POST" as const,
    fetchConfig: {
      timeout: 2000, // 2초 타임아웃
    },
    onSuccess: (data) => {
      console.log("짧은 타임아웃 성공:", data);
    },
    onError: (error) => {
      console.error("짧은 타임아웃 에러:", error);
    },
  },

  // 매우 짧은 타임아웃 (500ms) 테스트
  veryShortTimeout: {
    cacheKey: ["timeout", "very-short"],
    url: "/api/async-mutation",
    method: "POST" as const,
    fetchConfig: {
      timeout: 500, // 500ms 타임아웃
    },
    onSuccess: (data) => {
      console.log("매우 짧은 타임아웃 성공:", data);
    },
    onError: (error) => {
      console.error("매우 짧은 타임아웃 에러:", error);
    },
  },

  // 긴 타임아웃 (60초) 테스트
  longTimeout: {
    cacheKey: ["timeout", "long"],
    url: "/api/slow-mutation",
    method: "POST" as const,
    fetchConfig: {
      timeout: 60000, // 60초 타임아웃
    },
    onSuccess: (data) => {
      console.log("긴 타임아웃 성공:", data);
    },
    onError: (error) => {
      console.error("긴 타임아웃 에러:", error);
    },
  },

  // Custom Function 방식 + 타임아웃
  customWithTimeout: {
    cacheKey: ["timeout", "custom"],
    mutationFn: async (variables: { message: string; delay: number }, fetcher) => {
      // 여러 요청을 순차적으로 실행
      const result1 = await fetcher.request({
        url: "/api/async-mutation",
        method: "POST",
        data: { message: variables.message, delay: variables.delay },
        timeout: 3000, // 개별 요청에 3초 타임아웃
      });

      await new Promise(resolve => setTimeout(resolve, 100)); // 추가 지연

      const result2 = await fetcher.request({
        url: "/api/fast-mutation",
        method: "POST",
        data: { result: result1.data },
        timeout: 1000, // 개별 요청에 1초 타임아웃
      });

      return {
        firstResult: result1.data,
        secondResult: result2.data,
        totalTime: Date.now(),
      };
    },
    fetchConfig: {
      timeout: 10000, // 전체 mutation에 10초 타임아웃
    },
    onSuccess: (data) => {
      console.log("복합 타임아웃 성공:", data);
    },
    onError: (error) => {
      console.error("복합 타임아웃 에러:", error);
    },
  },
});

export default function MutationTimeoutTestPage() {
  const [delayTime, setDelayTime] = useState(3000);
  const [customData, setCustomData] = useState({ message: "테스트", delay: 2000 });

  // Mutation hooks
  const defaultTimeoutMutation = useMutation(timeoutMutations.defaultTimeout);
  const shortTimeoutMutation = useMutation(timeoutMutations.shortTimeout);
  const veryShortTimeoutMutation = useMutation(timeoutMutations.veryShortTimeout);
  const longTimeoutMutation = useMutation(timeoutMutations.longTimeout);
  const customTimeoutMutation = useMutation(timeoutMutations.customWithTimeout);

  const handleDefaultTimeout = () => {
    defaultTimeoutMutation.mutate({ delay: delayTime });
  };

  const handleShortTimeout = () => {
    shortTimeoutMutation.mutate({ delay: delayTime });
  };

  const handleVeryShortTimeout = () => {
    veryShortTimeoutMutation.mutate({ delay: 1000 });
  };

  const handleLongTimeout = () => {
    longTimeoutMutation.mutate({ delay: delayTime });
  };

  const handleCustomTimeout = () => {
    customTimeoutMutation.mutate(customData);
  };

  const resetAllMutations = () => {
    defaultTimeoutMutation.reset();
    shortTimeoutMutation.reset();
    veryShortTimeoutMutation.reset();
    longTimeoutMutation.reset();
    customTimeoutMutation.reset();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Mutation 타임아웃 테스트</h1>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">테스트 개요</h2>
        <p className="text-sm text-gray-700 mb-3">
          이 페이지는 다양한 타임아웃 설정을 가진 mutation들의 동작을 테스트합니다.
        </p>
        <div className="text-sm space-y-1">
          <div>• 기본 타임아웃: 30초 (전역 설정)</div>
          <div>• 짧은 타임아웃: 2초</div>
          <div>• 매우 짧은 타임아웃: 500ms</div>
          <div>• 긴 타임아웃: 60초</div>
          <div>• 복합 타임아웃: 전체 10초, 개별 요청 3초/1초</div>
        </div>
      </div>

      {/* 지연 시간 설정 */}
      <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">서버 응답 지연 시간 설정</h3>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            value={delayTime}
            onChange={(e) => setDelayTime(parseInt(e.target.value) || 0)}
            className="px-3 py-2 border border-gray-300 rounded-md w-32"
            placeholder="밀리초"
            min="0"
            max="120000"
            step="500"
          />
          <span className="text-sm text-gray-600">밀리초 (1초 = 1000ms)</span>
          <button
            onClick={resetAllMutations}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            모든 상태 초기화
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          권장 테스트 값: 1000ms (성공), 3000ms (일부 타임아웃), 10000ms (대부분 타임아웃)
        </div>
      </div>

      <div className="space-y-6">
        {/* 기본 타임아웃 테스트 */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">기본 타임아웃 (30초)</h3>
          <p className="text-sm text-gray-600 mb-4">
            전역 설정된 30초 타임아웃을 사용합니다. 매우 긴 요청이 아닌 이상 성공해야 합니다.
          </p>
          <button
            data-testid="default-timeout-btn"
            onClick={handleDefaultTimeout}
            disabled={defaultTimeoutMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {defaultTimeoutMutation.isPending ? `요청 중... (30초 타임아웃)` : "기본 타임아웃 테스트"}
          </button>
          
          {defaultTimeoutMutation.isSuccess && (
            <div data-testid="default-success" className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <span className="text-sm text-green-800">✅ 기본 타임아웃 성공!</span>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-green-600">응답 데이터 보기</summary>
                <pre className="text-xs bg-white p-2 rounded mt-1">
                  {JSON.stringify(defaultTimeoutMutation.data, null, 2)}
                </pre>
              </details>
            </div>
          )}
          {defaultTimeoutMutation.isError && (
            <div data-testid="default-error" className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <span className="text-sm text-red-800">❌ 기본 타임아웃 에러: {defaultTimeoutMutation.error?.message}</span>
            </div>
          )}
        </div>

        {/* 짧은 타임아웃 테스트 */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">짧은 타임아웃 (2초)</h3>
          <p className="text-sm text-gray-600 mb-4">
            2초 타임아웃으로 설정된 요청입니다. 지연 시간이 2초를 초과하면 실패합니다.
          </p>
          <button
            data-testid="short-timeout-btn"
            onClick={handleShortTimeout}
            disabled={shortTimeoutMutation.isPending}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300"
          >
            {shortTimeoutMutation.isPending ? "요청 중... (2초 타임아웃)" : "짧은 타임아웃 테스트"}
          </button>
          
          {shortTimeoutMutation.isSuccess && (
            <div data-testid="short-success" className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <span className="text-sm text-green-800">✅ 짧은 타임아웃 성공!</span>
            </div>
          )}
          {shortTimeoutMutation.isError && (
            <div data-testid="short-error" className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <span className="text-sm text-red-800">❌ 짧은 타임아웃 에러: {shortTimeoutMutation.error?.message}</span>
            </div>
          )}
        </div>

        {/* 매우 짧은 타임아웃 테스트 */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">매우 짧은 타임아웃 (500ms)</h3>
          <p className="text-sm text-gray-600 mb-4">
            500ms 타임아웃으로 설정된 요청입니다. 1초 지연으로 요청하므로 타임아웃 에러가 발생해야 합니다.
          </p>
          <button
            data-testid="very-short-timeout-btn"
            onClick={handleVeryShortTimeout}
            disabled={veryShortTimeoutMutation.isPending}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
          >
            {veryShortTimeoutMutation.isPending ? "요청 중... (500ms 타임아웃)" : "매우 짧은 타임아웃 테스트"}
          </button>
          
          {veryShortTimeoutMutation.isSuccess && (
            <div data-testid="very-short-success" className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <span className="text-sm text-green-800">✅ 예상과 다르게 성공!</span>
            </div>
          )}
          {veryShortTimeoutMutation.isError && (
            <div data-testid="very-short-error" className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <span className="text-sm text-red-800">❌ 예상된 타임아웃 에러: {veryShortTimeoutMutation.error?.message}</span>
            </div>
          )}
        </div>

        {/* 긴 타임아웃 테스트 */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">긴 타임아웃 (60초)</h3>
          <p className="text-sm text-gray-600 mb-4">
            60초 타임아웃으로 설정된 요청입니다. 일반적인 요청은 모두 성공해야 합니다.
          </p>
          <button
            data-testid="long-timeout-btn"
            onClick={handleLongTimeout}
            disabled={longTimeoutMutation.isPending}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            {longTimeoutMutation.isPending ? "요청 중... (60초 타임아웃)" : "긴 타임아웃 테스트"}
          </button>
          
          {longTimeoutMutation.isSuccess && (
            <div data-testid="long-success" className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <span className="text-sm text-green-800">✅ 긴 타임아웃 성공!</span>
            </div>
          )}
          {longTimeoutMutation.isError && (
            <div data-testid="long-error" className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <span className="text-sm text-red-800">❌ 긴 타임아웃 에러: {longTimeoutMutation.error?.message}</span>
            </div>
          )}
        </div>

        {/* 복합 타임아웃 테스트 */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">복합 타임아웃 (Custom Function)</h3>
          <p className="text-sm text-gray-600 mb-4">
            여러 요청을 순차적으로 실행하는 custom function에서 개별 요청과 전체 mutation에 각각 다른 타임아웃을 설정합니다.
          </p>
          
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="메시지"
              value={customData.message}
              onChange={(e) => setCustomData(prev => ({ ...prev, message: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              placeholder="첫 번째 요청 지연 (ms)"
              value={customData.delay}
              onChange={(e) => setCustomData(prev => ({ 
                ...prev, 
                delay: parseInt(e.target.value) || 0 
              }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <button
            data-testid="custom-timeout-btn"
            onClick={handleCustomTimeout}
            disabled={customTimeoutMutation.isPending}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
          >
            {customTimeoutMutation.isPending ? "요청 중... (복합 타임아웃)" : "복합 타임아웃 테스트"}
          </button>
          
          {customTimeoutMutation.isSuccess && (
            <div data-testid="custom-success" className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <span className="text-sm text-green-800">✅ 복합 타임아웃 성공!</span>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-green-600">응답 데이터 보기</summary>
                <pre className="text-xs bg-white p-2 rounded mt-1">
                  {JSON.stringify(customTimeoutMutation.data, null, 2)}
                </pre>
              </details>
            </div>
          )}
          {customTimeoutMutation.isError && (
            <div data-testid="custom-error" className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <span className="text-sm text-red-800">❌ 복합 타임아웃 에러: {customTimeoutMutation.error?.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* 코드 예제 */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">타임아웃 설정 코드 예제</h3>
        <div className="bg-gray-800 text-white p-4 rounded text-sm overflow-x-auto">
          <pre>{`// 1. 전역 기본 타임아웃 설정
setDefaultQueryClientOptions({
  timeout: 30000, // 30초
  // ... 기타 설정
});

// 2. Factory에서 개별 타임아웃 설정
const mutations = createMutationFactory({
  shortTimeout: {
    url: "/api/slow-mutation",
    method: "POST",
    fetchConfig: {
      timeout: 2000, // 2초
    }
  },
  
  // 3. Custom Function에서 개별 요청 타임아웃
  complexMutation: {
    mutationFn: async (variables, fetcher) => {
      const result = await fetcher.request({
        url: "/api/data",
        method: "POST",
        timeout: 5000, // 이 요청만 5초 타임아웃
      });
      return result.data;
    },
    fetchConfig: {
      timeout: 10000, // 전체 mutation은 10초 타임아웃
    }
  }
});

// 4. useMutation에서 override 설정
const mutation = useMutation(mutations.shortTimeout, {
  fetchConfig: {
    timeout: 1000, // 기존 2초를 1초로 override
  }
});`}</pre>
        </div>
      </div>

      {/* 현재 상태 */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">현재 Mutation 상태</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>기본 (30초):</strong> {defaultTimeoutMutation.isPending ? "⏳" : defaultTimeoutMutation.isSuccess ? "✅" : defaultTimeoutMutation.isError ? "❌" : "⭕"}
          </div>
          <div>
            <strong>짧은 (2초):</strong> {shortTimeoutMutation.isPending ? "⏳" : shortTimeoutMutation.isSuccess ? "✅" : shortTimeoutMutation.isError ? "❌" : "⭕"}
          </div>
          <div>
            <strong>매우 짧은 (500ms):</strong> {veryShortTimeoutMutation.isPending ? "⏳" : veryShortTimeoutMutation.isSuccess ? "✅" : veryShortTimeoutMutation.isError ? "❌" : "⭕"}
          </div>
          <div>
            <strong>긴 (60초):</strong> {longTimeoutMutation.isPending ? "⏳" : longTimeoutMutation.isSuccess ? "✅" : longTimeoutMutation.isError ? "❌" : "⭕"}
          </div>
          <div>
            <strong>복합:</strong> {customTimeoutMutation.isPending ? "⏳" : customTimeoutMutation.isSuccess ? "✅" : customTimeoutMutation.isError ? "❌" : "⭕"}
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          ⏳ 진행중 | ✅ 성공 | ❌ 실패 | ⭕ 대기
        </div>
      </div>
    </div>
  );
}