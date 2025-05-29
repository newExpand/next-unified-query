import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient } from "../src/query/query-client";
import { queryCache, type QueryState } from "../src/query/query-cache";

describe("QueryClient", () => {
  const client = new QueryClient();
  const keyA = ["user", 1];
  const keyB = ["user", 2];
  const keyC = ["post", 1];
  const stateA: QueryState = {
    data: { id: 1 },
    isLoading: false,
    updatedAt: 1,
  };
  const stateB: QueryState = {
    data: { id: 2 },
    isLoading: false,
    updatedAt: 2,
  };
  const stateC: QueryState = {
    data: { id: 3 },
    isLoading: false,
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

  it("invalidateQueries: prefix로 시작하는 모든 캐시 삭제", () => {
    client.set(keyA, stateA);
    client.set(keyB, stateB);
    client.set(keyC, stateC);
    client.invalidateQueries(["user"]);
    expect(client.get(keyA)).toBeUndefined();
    expect(client.get(keyB)).toBeUndefined();
    expect(client.get(keyC)).toEqual(stateC);
  });

  it("invalidateQueries: string prefix로 시작하는 모든 캐시 삭제", () => {
    client.set("user:1", stateA);
    client.set("user:2", stateB);
    client.set("post:1", stateC);
    client.invalidateQueries("user:");
    expect(client.get("user:1")).toBeUndefined();
    expect(client.get("user:2")).toBeUndefined();
    expect(client.get("post:1")).toEqual(stateC);
  });

  it("subscribe/unsubscribe가 queryCache에 위임되어 정상 동작", () => {
    const spySub = vi.spyOn(queryCache, "subscribe");
    const spyUnsub = vi.spyOn(queryCache, "unsubscribe");
    client.subscribe(keyA);
    expect(spySub).toHaveBeenCalledWith(keyA);
    client.unsubscribe(keyA, 1000);
    expect(spyUnsub).toHaveBeenCalledWith(keyA, 1000);
    spySub.mockRestore();
    spyUnsub.mockRestore();
  });
});

describe("QueryClient fetcher 옵션", () => {
  it("생성자에 baseURL 옵션을 넘기면 fetcher에 반영된다", () => {
    const client = new QueryClient({ baseURL: "https://api.test.com" });
    expect(client.getFetcher().defaults.baseURL).toBe("https://api.test.com");
  });
});
