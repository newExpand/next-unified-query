"use client";

import { HydrationBoundary } from "next-type-fetch/react";

export function NextTypeFetchHydrationBoundary({
  children,
  state,
}: {
  children: React.ReactNode;
  state: any;
}) {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
