import { ClientProvider } from "../client-provider";
import { UserInfo } from "./user-info";
import { QueryClient, ssrPrefetch } from "next-type-fetch";
import { userQueries } from "../factory";
import { registerInterceptors } from "../register-interceptors";
import PostList from "./post-list";

export default async function ClientInterceptorTestPage() {
  const queryClient = new QueryClient();

  registerInterceptors(queryClient);

  await ssrPrefetch(queryClient, [[userQueries.detail, { id: 1 }]]);
  const state = queryClient.dehydrate();

  return (
    <ClientProvider state={state}>
      <UserInfo />
      <PostList />
    </ClientProvider>
  );
}
