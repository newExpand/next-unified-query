"use client";

import { QueryClient, QueryClientProvider } from "next-type-fetch";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
