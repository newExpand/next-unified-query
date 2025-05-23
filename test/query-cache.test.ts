import { describe, it, expect } from "vitest";
import {
  queryCache,
  QueryState,
  serializeQueryKey,
} from "../src/query/query-cache";

describe("QueryCache", () => {
  it("set/get/has/delete/clear 동작", () => {
    const key = ["user", 1];
    const state: QueryState = {
      data: { id: 1, name: "홍길동" },
      isLoading: false,
      updatedAt: Date.now(),
    };

    queryCache.set(key, state);
    expect(queryCache.has(key)).toBe(true);
    expect(queryCache.get(key)).toEqual(state);

    queryCache.delete(key);
    expect(queryCache.has(key)).toBe(false);

    queryCache.set(key, state);
    queryCache.clear();
    expect(queryCache.has(key)).toBe(false);
  });

  it("문자열 쿼리키도 정상 동작", () => {
    const key = "user:2";
    const state: QueryState = {
      data: { id: 2, name: "임꺽정" },
      isLoading: false,
      updatedAt: Date.now(),
    };

    queryCache.set(key, state);
    expect(queryCache.get(key)).toEqual(state);
    queryCache.clear();
  });

  it("serializeQueryKey 함수 동작", () => {
    expect(serializeQueryKey(["a", 1])).toBe(JSON.stringify(["a", 1]));
    expect(serializeQueryKey("abc")).toBe("abc");
  });
});
