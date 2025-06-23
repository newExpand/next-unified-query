"use client";

import { QueryClientProvider } from "./lib/query-client";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider>{children}</QueryClientProvider>;
}
