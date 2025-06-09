"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreatePost } from "./create-post";
import { PaginationPrevExample } from "./pagination-prev";
import { PaginationPrevQueryExample } from "./pagination-prev-query";

const queryClient = new QueryClient();

export default function MutationTankstackTest() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaginationPrevExample />
      {/* <PaginationPrevQueryExample /> */}
      {/* <CreatePost /> */}
    </QueryClientProvider>
  );
}
