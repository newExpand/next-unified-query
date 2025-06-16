import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient } from "../src/query/client/query-client";
import { type QueryState } from "../src/query/cache/query-cache";

describe("QueryClient", () => {
  const client = new QueryClient();
  const keyA = ["user", 1];
  const keyB = ["user", 2];
  const keyC = ["post", 1];
  const stateA: QueryState = {
    data: { id: 1 },
    isLoading: false,
    isFetching: false,
    updatedAt: 1,
  };
  const stateB: QueryState = {
    data: { id: 2 },
    isLoading: false,
    isFetching: false,
    updatedAt: 2,
  };
  const stateC: QueryState = {
    data: { id: 3 },
    isLoading: false,
    isFetching: false,
    updatedAt: 3,
  };

  beforeEach(() => {
    client.clear();
  });

  it("set/get/delete/clear/getAll 동작", () => {
    client.set(keyA, stateA);
    expect(client.get(keyA)).toEqual(stateA);
    expect(client.getAll()).toHaveProperty(JSON.stringify(keyA));
    client.delete(keyA);
    expect(client.get(keyA)).toBeUndefined();
    client.set(keyA, stateA);
    client.set(keyB, stateB);
    client.clear();
    expect(client.get(keyA)).toBeUndefined();
    expect(client.get(keyB)).toBeUndefined();
  });

  it("invalidateQueries: prefix로 시작하는 모든 캐시 updatedAt이 0으로 변경됨", () => {
    client.set(keyA, stateA);
    client.set(keyB, stateB);
    client.set(keyC, stateC);
    client.invalidateQueries(["user"]);
    expect(client.get(keyA)?.updatedAt).toBe(0);
    expect(client.get(keyB)?.updatedAt).toBe(0);
    expect(client.get(keyC)).toEqual(stateC);
  });

  it("invalidateQueries: string prefix로 시작하는 모든 캐시 updatedAt이 0으로 변경됨", () => {
    client.set("user:1", stateA);
    client.set("user:2", stateB);
    client.set("post:1", stateC);
    client.invalidateQueries("user:");
    expect(client.get("user:1")?.updatedAt).toBe(0);
    expect(client.get("user:2")?.updatedAt).toBe(0);
    expect(client.get("post:1")).toEqual(stateC);
  });
});

describe("QueryClient fetcher 옵션", () => {
  it("생성자에 baseURL 옵션을 넘기면 fetcher에 반영된다", () => {
    const client = new QueryClient({ baseURL: "https://api.test.com" });
    expect(client.getFetcher().defaults.baseURL).toBe("https://api.test.com");
  });
});

describe("QueryClient SSR/prefetch", () => {
  it("prefetchQuery로 미리 패치 후 dehydrate/clear/hydrate로 복원하면 캐시가 유지된다", async () => {
    const client = new QueryClient();
    const key = ["ssr", 1];
    const data = { id: 123, name: "SSR" };
    await client.prefetchQuery(key, async () => data);
    // 직렬화
    const dehydrated = client.dehydrate();
    expect(dehydrated[JSON.stringify(key)]).toMatchObject({ data });
    // 클리어 후 복원
    client.clear();
    expect(client.get(key)).toBeUndefined();
    client.hydrate(dehydrated);
    expect(client.get(key)?.data).toEqual(data);
  });
});
