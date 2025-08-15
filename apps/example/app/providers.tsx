"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "next-unified-query/react";
import { queryConfig } from "./query-config";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider config={queryConfig}>{children}</QueryClientProvider>
  );
}
