import { ClientProvider } from "../client-provider";
import { PaginationPrevExample } from "./pagination-prev";
import { PaginationPrevQueryExample } from "./pagination-prev-query";
import { CreatePost } from "./create-post";

export default function MutationTestPage() {
  return (
    <ClientProvider>
      <PaginationPrevExample />
      <PaginationPrevQueryExample />
      <CreatePost />
    </ClientProvider>
  );
}
