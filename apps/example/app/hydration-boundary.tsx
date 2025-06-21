"use client";

import { HydrationBoundary } from "./lib/query-client";

export function NextTypeFetchHydrationBoundary({
  children,
  state,
}: {
  children: React.ReactNode;
  state: any;
}) {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
