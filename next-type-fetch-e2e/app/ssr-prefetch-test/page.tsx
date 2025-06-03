import { userQueries, postQueries } from "../factory";
import { Providers } from "../providers";
import { UserInfo } from "./user-info";
import { UserPosts } from "./user-posts";
import { ssrPrefetch } from "next-type-fetch";

export default async function SSRPrefetchTestPage() {
  const userDehydrated = await ssrPrefetch(
    userQueries.detail,
    { id: 1 },
    {
      baseURL: "http://localhost:3000",
    }
  );
  const postsDehydrated = await ssrPrefetch(
    postQueries.list,
    { userId: 1 },
    {
      baseURL: "http://localhost:3000",
    }
  );

  return (
    <Providers
      userDehydrated={userDehydrated}
      postsDehydrated={postsDehydrated}
    >
      <h1>SSR Prefetch Test (user 1)</h1>
      <UserInfo />
      <UserPosts />
    </Providers>
  );
}
