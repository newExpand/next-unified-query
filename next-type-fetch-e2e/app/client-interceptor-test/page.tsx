import { ClientProvider } from "../client-provider";
import { UserInfo } from "./user-info";
import { QueryClient, ssrPrefetch } from "next-type-fetch";
import { userQueries } from "../factory";
import {
  registerInterceptors,
  registerInterceptors2,
} from "../register-interceptors";
import PostList from "./post-list";

export default async function ClientInterceptorTestPage() {
  const queryClient = new QueryClient({
    baseURL: "http://localhost:3001",
  });

  registerInterceptors(queryClient);
  registerInterceptors2(queryClient);

  await ssrPrefetch(queryClient, [[userQueries.detail, { id: 1 }]]);
  const state = queryClient.dehydrate();

  return (
    <ClientProvider state={state}>
      <UserInfo />
      <PostList />
    </ClientProvider>
  );
}
