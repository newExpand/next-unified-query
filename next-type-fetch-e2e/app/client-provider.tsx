"use client";

import { QueryClientProvider } from "next-type-fetch/react";
import { setupAllInterceptors } from "./register-interceptors";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider setupInterceptors={setupAllInterceptors}>
      {children}
    </QueryClientProvider>
  );
}
