import { CreatePost } from "./create-post";
import { PaginationPrevExample } from "./pagination-prev";
import { PaginationPrevQueryExample } from "./pagination-prev-query";

export default function MutationTestPage() {
  return (
    <>
      <CreatePost />
      <PaginationPrevExample />
      <PaginationPrevQueryExample />
    </>
  );
}
