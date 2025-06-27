import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import TanStackTest2Client from "./tanstack-test-2-client";

// Server Component에서 데이터 prefetch
export default async function TanStackTest2Page() {
  const queryClient = new QueryClient();

  // SSR에서 test data prefetch (같은 queryKey 사용)
  await queryClient.prefetchQuery({
    queryKey: ["tanstack-test-data"],
    queryFn: async () => {
      const response = await fetch("http://localhost:3001/api/test-data");
      if (!response.ok) {
        throw new Error("Failed to fetch test data");
      }
      return response.json();
    },
    staleTime: 300000, // 5분
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TanStackTest2Client />
    </HydrationBoundary>
  );
}
