"use client";

import { FetchError } from "next-type-fetch";
import { useQuery } from "next-type-fetch/react";

interface TestData {
  id: number;
  title: string;
}

export default function TestInterceptorsPage() {
  const { data, error, isLoading } = useQuery<TestData, Error>({
    key: ["test-interceptors"],
    url: "/api/test",
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">인터셉터 테스트</h1>

      <div className="mb-4">
        <p className="mb-2">
          이 페이지는 클라이언트사이드에서 useQuery를 사용할 때 인터셉터가
          제대로 적용되는지 테스트합니다.
        </p>
        <p className="text-sm text-gray-600">
          개발자 도구의 Network 탭과 Console을 확인하여 X-Test-Header와
          X-Custom-Header가 추가되는지 확인하세요.
        </p>
      </div>

      {isLoading && <div>로딩 중...</div>}
      {error && <div className="text-red-500">에러: {error.message}</div>}
      {data && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">응답 데이터:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
