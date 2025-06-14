import { ssrPrefetch } from "next-type-fetch";
import { userQueries } from "../factory";
import PostList from "./post-list";
import { HydrationBoundary } from "next-type-fetch/react";

export default async function ClientInterceptorTestPage() {
  const state = await ssrPrefetch([[userQueries.detail, { userId: 1 }]]);

  // 인터셉터가 제대로 동작했는지 확인하려면 API 응답 데이터를 확인해야 합니다
  // Next.js headers()는 클라이언트→서버 헤더를 읽고, 인터셉터는 서버→API 헤더를 설정합니다
  // const cachedData = Object.values(state)[0]?.data;
  // console.log("🔍 서버사이드 인터셉터 테스트 결과:", {
  //   testHeader: cachedData?.testHeader,
  //   customHeader: cachedData?.customHeader,
  //   interceptorWorking: !!(cachedData?.testHeader && cachedData?.customHeader),
  // });

  return (
    <>
      <HydrationBoundary state={state}>
        <PostList />
      </HydrationBoundary>
    </>
  );
}
