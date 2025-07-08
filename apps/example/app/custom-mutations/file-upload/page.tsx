"use client";

import { useMutation } from "../../lib/query-client";
import { useState } from "react";

interface FileUploadResponse {
  success: boolean;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

export default function FileUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mutation = useMutation<FileUploadResponse, any, FormData>({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("File uploaded successfully:", data);
      // 업로드 성공 후 처리 로직
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error) => {
      console.error("File upload error:", error);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // 이미지 파일인 경우 미리보기 생성
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("description", "Test file upload");
    formData.append("category", "document");

    mutation.mutate(formData);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            커스텀 파일 업로드 Mutation
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 업로드 폼 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">📁 파일 업로드</h2>

              <div className="space-y-4">
                {/* 파일 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    파일 선택
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    지원 파일: 이미지, PDF, Word 문서, 텍스트 파일
                  </p>
                </div>

                {/* 선택된 파일 정보 */}
                {selectedFile && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      선택된 파일
                    </h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>
                        <strong>파일명:</strong> {selectedFile.name}
                      </p>
                      <p>
                        <strong>크기:</strong>{" "}
                        {formatFileSize(selectedFile.size)}
                      </p>
                      <p>
                        <strong>타입:</strong> {selectedFile.type}
                      </p>
                      <p>
                        <strong>최종 수정:</strong>{" "}
                        {new Date(selectedFile.lastModified).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* 이미지 미리보기 */}
                {previewUrl && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      미리보기
                    </h4>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-48 object-contain rounded"
                    />
                  </div>
                )}

                {/* 업로드 버튼 */}
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || mutation.isPending}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  data-testid="upload-btn"
                >
                  {mutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      업로드 중...
                    </>
                  ) : (
                    "📤 파일 업로드"
                  )}
                </button>

                {/* 상태 표시 */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div
                    className={`p-2 rounded text-center ${
                      mutation.isPending
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {mutation.isPending ? "⏳ 업로드 중" : "⭕ 대기"}
                  </div>
                  <div
                    className={`p-2 rounded text-center ${
                      mutation.isSuccess
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {mutation.isSuccess ? "✅ 성공" : "⭕ 대기"}
                  </div>
                  <div
                    className={`p-2 rounded text-center ${
                      mutation.isError
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {mutation.isError ? "❌ 실패" : "⭕ 대기"}
                  </div>
                </div>
              </div>
            </div>

            {/* 업로드 결과 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">📊 업로드 결과</h2>

              {mutation.isSuccess && mutation.data && (
                <div
                  className="bg-green-50 border border-green-200 p-6 rounded-lg"
                  data-testid="upload-success"
                >
                  <h3 className="font-semibold text-green-800 mb-4">
                    ✅ 업로드 성공!
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded">
                        <p className="font-medium text-green-800">파일명</p>
                        <p className="text-green-700">
                          {mutation.data.filename}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-medium text-green-800">크기</p>
                        <p className="text-green-700">
                          {formatFileSize(mutation.data.size)}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-medium text-green-800">MIME 타입</p>
                        <p className="text-green-700">
                          {mutation.data.mimetype}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-medium text-green-800">
                          업로드 시간
                        </p>
                        <p className="text-green-700">
                          {new Date(mutation.data.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <p className="font-medium text-green-800 mb-2">
                        파일 URL
                      </p>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 p-1 rounded flex-1">
                          {mutation.data.url}
                        </code>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              mutation.data?.url || ""
                            )
                          }
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          복사
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mutation.isError && (
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">
                    ❌ 업로드 실패
                  </h3>
                  <p className="text-sm text-red-700">
                    {mutation.error?.message}
                  </p>

                  <div className="mt-4 text-xs text-red-600">
                    <h4 className="font-medium mb-2">가능한 원인:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>파일 크기가 너무 큼 (최대 10MB)</li>
                      <li>지원하지 않는 파일 형식</li>
                      <li>네트워크 연결 문제</li>
                      <li>서버 저장 공간 부족</li>
                    </ul>
                  </div>
                </div>
              )}

              {!mutation.isSuccess &&
                !mutation.isError &&
                !mutation.isPending && (
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center">
                    <div className="text-4xl mb-4">📁</div>
                    <p className="text-gray-600">
                      파일을 선택하고 업로드해주세요
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* 기능 설명 */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              💡 커스텀 Mutation 기능
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <h4 className="font-medium text-blue-800 mb-2">
                  FormData 처리
                </h4>
                <p className="text-sm text-blue-700">
                  multipart/form-data 형식으로 파일과 메타데이터를 함께 전송
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded">
                <h4 className="font-medium text-green-800 mb-2">파일 검증</h4>
                <p className="text-sm text-green-700">
                  클라이언트와 서버 양쪽에서 파일 타입과 크기 검증
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded">
                <h4 className="font-medium text-purple-800 mb-2">
                  진행률 표시
                </h4>
                <p className="text-sm text-purple-700">
                  업로드 상태를 실시간으로 사용자에게 피드백
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
