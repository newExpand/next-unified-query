"use client";

import { QueryClientProvider } from "./lib/query-client";
import { setupAllInterceptors } from "./register-interceptors";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider setupInterceptors={setupAllInterceptors}>
      {children}
    </QueryClientProvider>
  );
}
