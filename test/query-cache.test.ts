import { describe, it, expect, beforeEach } from "vitest";
import {
  QueryCache,
  QueryState,
  serializeQueryKey,
} from "../src/query/query-cache";
import { vi } from "vitest";

let queryCache: QueryCache;
beforeEach(() => {
  queryCache = new QueryCache();
});

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

  describe("QueryCache 추가 동작", () => {
    it("subscribe/unsubscribe 카운트 동작", () => {
      const key = ["sub", 1];
      queryCache.clear();
      queryCache.subscribe(key);
      // @ts-expect-error private 접근 우회
      expect(queryCache.subscribers.get(JSON.stringify(key))).toBe(1);
      queryCache.subscribe(key);
      // @ts-expect-error private 접근 우회
      expect(queryCache.subscribers.get(JSON.stringify(key))).toBe(2);
      queryCache.unsubscribe(key, 1000);
      // @ts-expect-error private 접근 우회
      expect(queryCache.subscribers.get(JSON.stringify(key))).toBe(1);
      queryCache.unsubscribe(key, 1000);
      // @ts-expect-error private 접근 우회
      expect(queryCache.subscribers.get(JSON.stringify(key))).toBe(0);
    });

    it("unsubscribe 후 cacheTime 지나면 캐시 자동 삭제", async () => {
      const key = ["auto", 2];
      const state: QueryState = {
        data: 123,
        isLoading: false,
        updatedAt: Date.now(),
      };
      queryCache.set(key, state);
      queryCache.subscribe(key);
      vi.useFakeTimers();
      queryCache.unsubscribe(key, 50);
      expect(queryCache.has(key)).toBe(true);
      vi.advanceTimersByTime(51);
      expect(queryCache.has(key)).toBe(false);
      vi.useRealTimers();
    });

    it("unsubscribe 후 subscribe 시 타이머 해제되어 캐시가 삭제되지 않음", async () => {
      const key = ["timer", 3];
      const state: QueryState = {
        data: 456,
        isLoading: false,
        updatedAt: Date.now(),
      };
      queryCache.set(key, state);
      queryCache.subscribe(key);
      vi.useFakeTimers();
      queryCache.unsubscribe(key, 50);
      queryCache.subscribe(key); // 타이머 해제
      vi.advanceTimersByTime(51);
      expect(queryCache.has(key)).toBe(true);
      vi.useRealTimers();
    });

    it("getAll이 전체 캐시 반환", () => {
      queryCache.clear();
      const keyA = ["a"];
      const keyB = ["b"];
      const stateA: QueryState = { data: 1, isLoading: false, updatedAt: 1 };
      const stateB: QueryState = { data: 2, isLoading: false, updatedAt: 2 };
      queryCache.set(keyA, stateA);
      queryCache.set(keyB, stateB);
      expect(queryCache.getAll()).toEqual({
        [JSON.stringify(keyA)]: stateA,
        [JSON.stringify(keyB)]: stateB,
      });
      queryCache.clear();
    });

    it("없는 키에 대해 get/delete/has 호출 시 에러 없이 동작", () => {
      const key = ["none", 999];
      expect(queryCache.get(key)).toBeUndefined();
      expect(queryCache.has(key)).toBe(false);
      expect(() => queryCache.delete(key)).not.toThrow();
    });

    it("sub/unsub 반복해도 subscribers 카운트가 음수가 되지 않음", () => {
      const key = ["repeat", 1];
      queryCache.clear();
      for (let i = 0; i < 3; i++) queryCache.subscribe(key);
      for (let i = 0; i < 5; i++) queryCache.unsubscribe(key, 10);
      // @ts-expect-error private 접근 우회
      expect(queryCache.subscribers.get(JSON.stringify(key))).toBe(0);
    });

    it("serialize/deserialize로 전체 캐시 직렬화/복원", () => {
      queryCache.clear();
      const keyA = ["user", 1];
      const keyB = ["user", 2];
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
      queryCache.set(keyA, stateA);
      queryCache.set(keyB, stateB);
      const serialized = queryCache.serialize();
      expect(serialized).toEqual({
        [JSON.stringify(keyA)]: stateA,
        [JSON.stringify(keyB)]: stateB,
      });
      queryCache.clear();
      expect(queryCache.getAll()).toEqual({});
      queryCache.deserialize(serialized);
      expect(queryCache.get(keyA)).toEqual(stateA);
      expect(queryCache.get(keyB)).toEqual(stateB);
    });
  });
});
