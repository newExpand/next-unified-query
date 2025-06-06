import { ClientProvider } from "../client-provider";
import { CreatePost } from "./create-post";

export default function MutationTestPage() {
  return (
    <ClientProvider>
      <CreatePost />
    </ClientProvider>
  );
}
