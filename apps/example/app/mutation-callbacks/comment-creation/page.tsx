"use client";

import { useState } from "react";
import { useMutation } from "../../lib/query-client";

interface MutationContext {
  "optimistic-id": string;
  timestamp: number;
  action: string;
}

export default function CommentCreationPage() {
  const [content, setContent] = useState("");
  const [callbackOrder, setCallbackOrder] = useState<string[]>([]);
  const [mutationContext, setMutationContext] =
    useState<MutationContext | null>(null);
  const [successContext, setSuccessContext] = useState<string>("");
  const [settledContext, setSettledContext] = useState<string>("");

  const createCommentMutation = useMutation<MutationContext>({
    url: "/api/comments",
    method: "POST",
    onMutate: (variables) => {
      const context: MutationContext = {
        "optimistic-id": `temp-${Date.now()}`,
        timestamp: Date.now(),
        action: "create-comment",
      };

      setCallbackOrder((prev) => [...prev, "onMutate"]);
      setMutationContext(context);

      console.log("onMutate executed with context:", context);
      return context;
    },
    onSuccess: (data, variables, context) => {
      setCallbackOrder((prev) => [...prev, "onSuccess"]);
      setSuccessContext(JSON.stringify(context, null, 2));

      console.log("onSuccess executed:", { data, variables, context });
    },
    onError: (error, variables, context) => {
      setCallbackOrder((prev) => [...prev, "onError"]);
      console.log("onError executed:", { error, variables, context });
    },
    onSettled: (data, error, variables, context) => {
      setCallbackOrder((prev) => [...prev, "onSettled"]);
      setSettledContext(JSON.stringify(context, null, 2));

      console.log("onSettled executed:", { data, error, variables, context });
    },
  });

  const handleSubmit = () => {
    // 콜백 순서 초기화
    setCallbackOrder([]);
    setMutationContext(null);
    setSuccessContext("");
    setSettledContext("");

    createCommentMutation.mutate({
      content,
      authorId: 1,
    });
  };

  const resetState = () => {
    setContent("");
    setCallbackOrder([]);
    setMutationContext(null);
    setSuccessContext("");
    setSettledContext("");
    createCommentMutation.reset();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Comment Creation - Mutation Callbacks
      </h1>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">테스트 시나리오</h3>
          <ul className="text-sm space-y-1">
            <li>• onMutate에서 context 생성 (optimistic update용)</li>
            <li>• onSuccess, onSettled에서 동일한 context 접근</li>
            <li>• 콜백 실행 순서: onMutate → onSuccess → onSettled</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold">댓글 작성</h3>

            <div>
              <label className="block text-sm font-medium mb-1">
                댓글 내용
              </label>
              <textarea
                data-testid="comment-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="댓글을 입력하세요"
                rows={4}
              />
            </div>

            <div className="space-x-2">
              <button
                data-testid="create-comment-btn"
                onClick={handleSubmit}
                disabled={createCommentMutation.isPending || !content.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {createCommentMutation.isPending ? "작성 중..." : "댓글 작성"}
              </button>

              <button
                onClick={resetState}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                초기화
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* 콜백 실행 순서 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">콜백 실행 순서</h4>
              <div className="space-y-1 text-sm">
                {callbackOrder.map((callback, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="bg-blue-200 px-2 py-1 rounded text-xs">
                      {index + 1}
                    </span>
                    <span>{callback}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* onMutate context */}
            {mutationContext && (
              <div
                data-testid="mutate-context"
                className="bg-yellow-50 p-4 rounded-lg"
              >
                <h4 className="font-semibold mb-2">onMutate Context</h4>
                <div data-testid="context-data" className="text-sm font-mono">
                  {JSON.stringify(mutationContext, null, 2)}
                </div>
              </div>
            )}

            {/* onSuccess context */}
            {successContext && (
              <div
                data-testid="success-context"
                className="bg-green-50 p-4 rounded-lg"
              >
                <h4 className="font-semibold mb-2">onSuccess Context</h4>
                <div
                  data-testid="success-context-data"
                  className="text-sm font-mono"
                >
                  {successContext}
                </div>
              </div>
            )}

            {/* onSettled context */}
            {settledContext && (
              <div
                data-testid="settled-context"
                className="bg-gray-50 p-4 rounded-lg"
              >
                <h4 className="font-semibold mb-2">onSettled Context</h4>
                <div
                  data-testid="settled-context-data"
                  className="text-sm font-mono"
                >
                  {settledContext}
                </div>
              </div>
            )}

            {/* 생성된 댓글 정보 */}
            {createCommentMutation.isSuccess && createCommentMutation.data && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">
                  댓글 생성 완료
                </h4>
                <div className="space-y-1 text-sm">
                  <div>ID: {(createCommentMutation.data as any).id}</div>
                  <div>내용: {(createCommentMutation.data as any).content}</div>
                  <div>
                    작성자: {(createCommentMutation.data as any).authorId}
                  </div>
                  <div>
                    생성일: {(createCommentMutation.data as any).createdAt}
                  </div>
                </div>
              </div>
            )}

            {/* 에러 정보 */}
            {createCommentMutation.isError && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">에러 발생</h4>
                <div className="text-red-700 text-sm">
                  {createCommentMutation.error?.message}
                </div>
              </div>
            )}

            {/* 상태 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Mutation 상태</h4>
              <div>isPending: {createCommentMutation.isPending.toString()}</div>
              <div>isSuccess: {createCommentMutation.isSuccess.toString()}</div>
              <div>isError: {createCommentMutation.isError.toString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
