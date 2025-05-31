"use client";

import React from "react";
import { QueryClientProvider } from "next-type-fetch/react";
import { QueryClient } from "next-type-fetch";

const client = new QueryClient();
const dehydratedState = client.dehydrate();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={client} dehydratedState={dehydratedState}>
      {children}
    </QueryClientProvider>
  );
}
