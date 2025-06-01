"use client";

import React from "react";
import { QueryClientProvider } from "next-type-fetch/react";
import { QueryClient } from "next-type-fetch";

export function Providers({
  children,
  client,
  dehydratedState,
}: {
  children: React.ReactNode;
  client: any;
  dehydratedState: any;
}) {
  return (
    <QueryClientProvider client={client} dehydratedState={dehydratedState}>
      {children}
    </QueryClientProvider>
  );
}
