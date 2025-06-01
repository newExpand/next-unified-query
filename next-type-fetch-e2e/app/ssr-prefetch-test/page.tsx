import { QueryClient } from "next-type-fetch";
import { userQueries } from "../factory";
import { UserInfo } from "./user-info";
import { Providers } from "../providers";

const client = new QueryClient();
const dehydratedState = client.dehydrate();

export default async function SSRPrefetchTestPage() {
  // id=1로 미리 패칭
  await client.prefetchQuery(userQueries.detail.key({ id: 1 }), async () => {
    // fetcher는 내부적으로 결합되어 있으므로 url만 넘기면 됨
    const res = await fetch(`http://localhost:3000/api/user/1`);
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  });

  // Providers는 layout.tsx에서 이미 감싸고 있다고 가정
  return (
    <>
      <Providers client={client} dehydratedState={dehydratedState}>
        <h1>SSR Prefetch Test (user 1)</h1>
        <UserInfo />
      </Providers>
    </>
  );
}
