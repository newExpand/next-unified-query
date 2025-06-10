import { ClientProvider } from "../client-provider";
import { queryClient } from "../lib/api";
import { UserInfo } from "./user-info";
import { ssrPrefetch } from "next-type-fetch";
import { userQueries } from "../factory";
import PostList from "./post-list";

export default async function ClientInterceptorTestPage() {
  await ssrPrefetch(queryClient, [[userQueries.detail, { userId: 1 }]]);
  const state = queryClient.dehydrate();

  return (
    <ClientProvider state={state}>
      <UserInfo />
      <PostList />
    </ClientProvider>
  );
}
