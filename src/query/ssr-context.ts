// SSR Prefetch Context (서버 전용)
const ssrPrefetchContext: Map<string, any> = new Map();

export function addSSRPrefetch(key: string, state: any) {
  ssrPrefetchContext.set(key, state);
}

export function getSSRPrefetchStates() {
  return Array.from(ssrPrefetchContext.values());
}

export function clearSSRPrefetch() {
  ssrPrefetchContext.clear();
}
