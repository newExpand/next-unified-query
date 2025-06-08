"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreatePost } from "./create-post";

const queryClient = new QueryClient();

export default function MutationTankstackTest() {
  return (
    <QueryClientProvider client={queryClient}>
      <CreatePost />
    </QueryClientProvider>
  );
}
