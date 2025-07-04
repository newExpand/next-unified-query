"use client";

import { useMutation } from "../../lib/query-client";
import { useState } from "react";

interface CreatePostRequest {
  title: string;
  content: string;
  tags: string[];
}

interface CreatePostResponse {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export default function PostCreationPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [callbackLogs, setCallbackLogs] = useState<string[]>([]);

  const mutation = useMutation<CreatePostResponse, any, CreatePostRequest>({
    mutationFn: async (data: CreatePostRequest) => {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      return response.json();
    },
    onMutate: (variables) => {
      const log = `🚀 onMutate: 게시물 생성 시작 - 제목: "${variables.title}"`;
      setCallbackLogs((prev) => [...prev, log]);
      console.log(log);

      // Optimistic update (낙관적 업데이트)를 여기서 할 수 있음
      return { submittedAt: new Date().toISOString() };
    },
    onSuccess: (data: CreatePostResponse, variables, context) => {
      const log = `✅ onSuccess: 게시물 생성 성공 - ID: ${data.id}`;
      setCallbackLogs((prev) => [...prev, log]);
      console.log(log, { data, variables, context });

      // 성공 시 추가 로직 (캐시 무효화, 토스트 알림 등)
      setTimeout(() => {
        const successLog = `🎉 후속 처리: 캐시 갱신 및 알림 발송 완료`;
        setCallbackLogs((prev) => [...prev, successLog]);
      }, 1000);
    },
    onError: (error, variables, context) => {
      const log = `❌ onError: 게시물 생성 실패 - ${error.message}`;
      setCallbackLogs((prev) => [...prev, log]);
      console.error(log, { error, variables, context });

      // 에러 시 롤백 로직
      setTimeout(() => {
        const rollbackLog = `🔄 롤백: 낙관적 업데이트 되돌림`;
        setCallbackLogs((prev) => [...prev, rollbackLog]);
      }, 500);
    },
    onSettled: (data, error, variables, context) => {
      const log = `🏁 onSettled: 요청 완료 (성공/실패 관계없이 실행)`;
      setCallbackLogs((prev) => [...prev, log]);
      console.log(log, { data, error, variables, context });

      // 로딩 상태 정리, 폼 리셋 등
      if (data) {
        setTitle("");
        setContent("");
        setTags("");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCallbackLogs([]); // 로그 초기화

    const postData: CreatePostRequest = {
      title,
      content,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    mutation.mutate(postData);
  };

  const clearLogs = () => {
    setCallbackLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Mutation 콜백 체인 테스트
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 게시물 생성 폼 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">📝 게시물 생성 폼</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    제목 *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="게시물 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    내용 *
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="게시물 내용을 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: React, TypeScript, Next.js"
                  />
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  data-testid="create-post-btn"
                >
                  {mutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      생성 중...
                    </>
                  ) : (
                    "게시물 생성"
                  )}
                </button>
              </form>

              {/* 상태 표시 */}
              <div className="mt-6 space-y-3">
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div
                    className={`p-2 rounded text-center ${
                      mutation.isPending
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {mutation.isPending ? "⏳ 진행중" : "⭕ 대기중"}
                  </div>
                  <div
                    className={`p-2 rounded text-center ${
                      mutation.isSuccess
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {mutation.isSuccess ? "✅ 성공" : "⭕ 대기중"}
                  </div>
                  <div
                    className={`p-2 rounded text-center ${
                      mutation.isError
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {mutation.isError ? "❌ 실패" : "⭕ 대기중"}
                  </div>
                  <div
                    className={`p-2 rounded text-center ${
                      mutation.isSuccess || mutation.isError
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {mutation.isSuccess || mutation.isError
                      ? "🏁 완료"
                      : "⭕ 대기중"}
                  </div>
                </div>
              </div>

              {/* 결과 표시 */}
              {mutation.isSuccess && mutation.data && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">
                    ✅ 생성된 게시물
                  </h4>
                  <div
                    className="text-sm text-green-700"
                    data-testid="created-post"
                  >
                    <p>
                      <strong>ID:</strong> {mutation.data.id}
                    </p>
                    <p>
                      <strong>제목:</strong> {mutation.data.title}
                    </p>
                    <p>
                      <strong>생성일:</strong>{" "}
                      {new Date(mutation.data.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {mutation.isError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">
                    ❌ 오류 발생
                  </h4>
                  <p className="text-sm text-red-700">
                    {mutation.error?.message}
                  </p>
                </div>
              )}
            </div>

            {/* 콜백 로그 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">📊 콜백 체인 로그</h2>
                <button
                  onClick={clearLogs}
                  className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                >
                  로그 지우기
                </button>
              </div>

              <div
                className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto"
                data-testid="callback-logs"
              >
                {callbackLogs.length === 0 ? (
                  <p className="text-gray-500">
                    콜백 로그가 여기에 표시됩니다...
                  </p>
                ) : (
                  <div className="space-y-2">
                    {callbackLogs.map((log, index) => (
                      <div
                        key={index}
                        className="border-l-2 border-green-500 pl-3"
                      >
                        <span className="text-gray-400">
                          [{new Date().toLocaleTimeString()}]
                        </span>
                        <br />
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 콜백 체인 설명 */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              🔄 콜백 체인 실행 순서
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                <h4 className="font-medium text-yellow-800 mb-2">
                  1. onMutate
                </h4>
                <p className="text-sm text-yellow-700">
                  요청 시작 시 실행
                  <br />
                  낙관적 업데이트 수행
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded">
                <h4 className="font-medium text-green-800 mb-2">
                  2. onSuccess
                </h4>
                <p className="text-sm text-green-700">
                  성공 시에만 실행
                  <br />
                  캐시 갱신, 알림 등
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded">
                <h4 className="font-medium text-red-800 mb-2">3. onError</h4>
                <p className="text-sm text-red-700">
                  실패 시에만 실행
                  <br />
                  롤백, 에러 처리
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <h4 className="font-medium text-blue-800 mb-2">4. onSettled</h4>
                <p className="text-sm text-blue-700">
                  성공/실패 관계없이 실행
                  <br />
                  정리 작업
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
