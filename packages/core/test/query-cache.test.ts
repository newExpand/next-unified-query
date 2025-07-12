import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryCache, QueryState, serializeQueryKey } from "../src/query/cache/query-cache";

describe("QueryCache", () => {
	let queryCache: QueryCache;

	beforeEach(() => {
		queryCache = new QueryCache();
		vi.clearAllMocks();
	});

	describe("기본 캐시 동작", () => {
		it("set/get/has/delete/clear 동작", () => {
			const key = ["user", 1];
			const state: QueryState = {
				data: { id: 1, name: "홍길동" },
				isLoading: false,
				isFetching: false,
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
				isFetching: false,
				updatedAt: Date.now(),
			};

			queryCache.set(key, state);
			expect(queryCache.get(key)).toEqual(state);
		});

		it("없는 키에 대해 get/delete/has 호출 시 안전하게 동작", () => {
			const key = ["none", 999];
			expect(queryCache.get(key)).toBeUndefined();
			expect(queryCache.has(key)).toBe(false);
			expect(() => queryCache.delete(key)).not.toThrow();
		});

		it("getAll이 전체 캐시 반환", () => {
			const keyA = ["a"];
			const keyB = ["b"];
			const stateA: QueryState = {
				data: 1,
				isLoading: false,
				isFetching: false,
				updatedAt: 1,
			};
			const stateB: QueryState = {
				data: 2,
				isLoading: false,
				isFetching: false,
				updatedAt: 2,
			};

			queryCache.set(keyA, stateA);
			queryCache.set(keyB, stateB);

			expect(queryCache.getAll()).toEqual({
				[JSON.stringify(keyA)]: stateA,
				[JSON.stringify(keyB)]: stateB,
			});
		});
	});

	describe("메모리 보호 (maxQueries)", () => {
		it("maxQueries 제한으로 LRU 동작", () => {
			const smallCache = new QueryCache({ maxQueries: 2 });
			const state: QueryState = {
				data: "test",
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};

			// 2개까지는 정상 저장
			smallCache.set(["key1"], state);
			smallCache.set(["key2"], state);
			expect(smallCache.size).toBe(2);
			expect(smallCache.has(["key1"])).toBe(true);
			expect(smallCache.has(["key2"])).toBe(true);

			// key1을 access 하여 최근 사용으로 만듦
			smallCache.get(["key1"]);

			// 3번째 추가 시 가장 오래된 것(key2) 제거 (LRU)
			smallCache.set(["key3"], state);
			expect(smallCache.size).toBe(2);
			expect(smallCache.has(["key1"])).toBe(true); // 최근 access됨
			expect(smallCache.has(["key2"])).toBe(false); // 제거됨
			expect(smallCache.has(["key3"])).toBe(true);
		});

		it("size와 maxSize 속성 동작", () => {
			const customCache = new QueryCache({ maxQueries: 100 });
			expect(customCache.size).toBe(0);
			expect(customCache.maxSize).toBe(100);

			const state: QueryState = {
				data: "test",
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};
			customCache.set(["test"], state);
			expect(customCache.size).toBe(1);
		});

		it("onEviction 콜백이 메타데이터를 올바르게 정리함", () => {
			const smallCache = new QueryCache({ maxQueries: 2 });
			const state: QueryState = {
				data: "test",
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};

			// 캐시 추가 및 구독자/리스너 등록
			smallCache.set(["key1"], state);
			smallCache.set(["key2"], state);
			smallCache.subscribe(["key1"]);
			smallCache.subscribe(["key2"]);
			const unsubscribe1 = smallCache.subscribeListener(["key1"], () => {});
			const unsubscribe2 = smallCache.subscribeListener(["key2"], () => {});

			// 초기 통계 확인
			let stats = smallCache.getStats();
			expect(stats.cacheSize).toBe(2);
			expect(stats.subscribersCount).toBe(2);
			expect(stats.listenersCount).toBe(2);

			// key1을 access하여 최근 사용으로 만듦
			smallCache.get(["key1"]);

			// key3 추가로 key2가 LRU에 의해 제거됨 (key1은 최근 access됨)
			smallCache.set(["key3"], state);

			// key2가 제거되었는지 확인
			expect(smallCache.has(["key1"])).toBe(true);
			expect(smallCache.has(["key2"])).toBe(false); // 제거됨
			expect(smallCache.has(["key3"])).toBe(true);

			// key2의 메타데이터가 자동으로 정리되었는지 확인
			stats = smallCache.getStats();
			expect(stats.cacheSize).toBe(2);
			expect(stats.subscribersCount).toBe(1); // key2의 구독자 정보 제거됨
			expect(stats.listenersCount).toBe(1); // key2의 리스너 정보 제거됨

			// 정리
			unsubscribe1();
			unsubscribe2();
		});
	});

	describe("구독자 관리 (생명주기)", () => {
		it("subscribe/unsubscribe 동작", () => {
			const key = ["sub", 1];
			const state: QueryState = {
				data: 123,
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};

			queryCache.set(key, state);

			// 구독
			queryCache.subscribe(key);
			expect(queryCache.has(key)).toBe(true);

			// 구독 해제 후 gcTime 지나면 자동 삭제
			vi.useFakeTimers();
			queryCache.unsubscribe(key, 50);
			expect(queryCache.has(key)).toBe(true); // 아직 있음

			vi.advanceTimersByTime(51);
			expect(queryCache.has(key)).toBe(false); // 삭제됨
			vi.useRealTimers();
		});

		it("구독자가 있으면 gcTime 타이머가 해제됨", () => {
			const key = ["timer", 3];
			const state: QueryState = {
				data: 456,
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};

			queryCache.set(key, state);
			queryCache.subscribe(key);

			vi.useFakeTimers();
			queryCache.unsubscribe(key, 50);
			queryCache.subscribe(key); // 다시 구독 → 타이머 해제

			vi.advanceTimersByTime(51);
			expect(queryCache.has(key)).toBe(true); // 타이머가 해제되어 삭제되지 않음
			vi.useRealTimers();
		});

		it("여러 구독자가 있을 때 모든 구독자가 해제될 때까지 삭제되지 않음", () => {
			const key = ["multi", 1];
			const state: QueryState = {
				data: "multi",
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};

			queryCache.set(key, state);

			// 3명 구독
			queryCache.subscribe(key);
			queryCache.subscribe(key);
			queryCache.subscribe(key);

			vi.useFakeTimers();

			// 2명 구독 해제 → 아직 1명 남음
			queryCache.unsubscribe(key, 10);
			queryCache.unsubscribe(key, 10);
			vi.advanceTimersByTime(15);
			expect(queryCache.has(key)).toBe(true);

			// 마지막 구독자 해제 → 타이머 시작
			queryCache.unsubscribe(key, 10);
			vi.advanceTimersByTime(15);
			expect(queryCache.has(key)).toBe(false);

			vi.useRealTimers();
		});
	});

	describe("리스너 관리", () => {
		it("subscribeListener와 notifyListeners 동작", async () => {
			const key = ["listener", 1];
			const listenerSpy = vi.fn();

			// 리스너 등록
			const unsubscribe = queryCache.subscribeListener(key, listenerSpy);

			// set 호출 시 자동으로 notifyListeners 호출됨
			const state: QueryState = {
				data: "test",
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};
			queryCache.set(key, state);

			// notifyListeners는 비동기이므로 대기
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(listenerSpy).toHaveBeenCalledTimes(1);

			// 리스너 해제 후에는 호출되지 않음
			unsubscribe();
			queryCache.set(key, { ...state, data: "updated" });
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(listenerSpy).toHaveBeenCalledTimes(1); // 여전히 1번만
		});

		it("여러 리스너 등록 및 개별 해제", async () => {
			const key = ["multi-listener", 1];
			const listener1 = vi.fn();
			const listener2 = vi.fn();

			const unsubscribe1 = queryCache.subscribeListener(key, listener1);
			const unsubscribe2 = queryCache.subscribeListener(key, listener2);

			const state: QueryState = {
				data: "test",
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};
			queryCache.set(key, state);

			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(listener1).toHaveBeenCalledTimes(1);
			expect(listener2).toHaveBeenCalledTimes(1);

			// listener1만 해제
			unsubscribe1();
			queryCache.set(key, { ...state, data: "updated" });
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(listener1).toHaveBeenCalledTimes(1); // 더 이상 호출되지 않음
			expect(listener2).toHaveBeenCalledTimes(2); // 계속 호출됨

			unsubscribe2();
		});

		it("빈 리스너 Set이 자동으로 제거됨", () => {
			const key = ["cleanup-test"];
			const listener = vi.fn();

			// 리스너 등록
			const unsubscribe = queryCache.subscribeListener(key, listener);

			// 리스너가 등록되었는지 확인
			let stats = queryCache.getStats();
			expect(stats.listenersCount).toBe(1);

			// 리스너 해제
			unsubscribe();

			// 빈 Set이 제거되어 listenersCount가 0이 되었는지 확인
			stats = queryCache.getStats();
			expect(stats.listenersCount).toBe(0);
		});
	});

	describe("직렬화/역직렬화", () => {
		it("serialize/deserialize로 캐시 백업/복원", () => {
			const keyA = ["user", 1];
			const keyB = ["user", 2];
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

			queryCache.set(keyA, stateA);
			queryCache.set(keyB, stateB);

			// 직렬화
			const serialized = queryCache.serialize();
			expect(serialized).toEqual({
				[JSON.stringify(keyA)]: stateA,
				[JSON.stringify(keyB)]: stateB,
			});

			// 캐시 초기화 후 역직렬화
			queryCache.clear();
			expect(queryCache.getAll()).toEqual({});

			queryCache.deserialize(serialized);
			expect(queryCache.get(keyA)).toEqual(stateA);
			expect(queryCache.get(keyB)).toEqual(stateB);
		});

		it("deserialize는 메타데이터를 복원하지 않음 (캐시 데이터만 복원)", () => {
			const key = ["hydration-test"];
			const state: QueryState = {
				data: "test",
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};

			// 원본 캐시에 데이터와 메타데이터 설정
			queryCache.set(key, state);
			queryCache.subscribe(key);
			queryCache.subscribeListener(key, () => {});

			// 직렬화
			const serialized = queryCache.serialize();

			// 새로운 캐시에 역직렬화
			const newCache = new QueryCache();
			newCache.deserialize(serialized);

			// 캐시 데이터는 복원되지만 메타데이터는 복원되지 않음
			expect(newCache.get(key)).toEqual(state);
			const stats = newCache.getStats();
			expect(stats.cacheSize).toBe(1);
			expect(stats.subscribersCount).toBe(0); // 메타데이터는 복원되지 않음
			expect(stats.listenersCount).toBe(0); // 메타데이터는 복원되지 않음
		});
	});

	describe("통계 및 모니터링", () => {
		it("getStats가 올바른 통계 반환", () => {
			const key1 = ["stats", 1];
			const key2 = ["stats", 2];
			const state: QueryState = {
				data: "test",
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};

			// 초기 상태
			const initialStats = queryCache.getStats();
			expect(initialStats.cacheSize).toBe(0);
			expect(initialStats.subscribersCount).toBe(0);
			expect(initialStats.listenersCount).toBe(0);
			expect(initialStats.activeGcTimersCount).toBe(0);

			// 캐시 추가
			queryCache.set(key1, state);
			queryCache.set(key2, state);

			// 구독자 추가
			queryCache.subscribe(key1);
			queryCache.subscribe(key2);

			// 리스너 추가
			const unsubscribe1 = queryCache.subscribeListener(key1, () => {});
			const unsubscribe2 = queryCache.subscribeListener(key2, () => {});

			const activeStats = queryCache.getStats();
			expect(activeStats.cacheSize).toBe(2);
			expect(activeStats.subscribersCount).toBe(2);
			expect(activeStats.listenersCount).toBe(2);
			expect(activeStats.activeGcTimersCount).toBe(0); // 아직 타이머 없음

			// 구독 해제하여 GC 타이머 생성
			vi.useFakeTimers();
			queryCache.unsubscribe(key1, 100);

			const timerStats = queryCache.getStats();
			expect(timerStats.activeGcTimersCount).toBe(1); // GC 타이머 1개 생성됨

			// 정리
			unsubscribe1();
			unsubscribe2();
			vi.useRealTimers();
		});

		it("subscribersCount와 listenersCount는 키의 개수를 반환함 (총 구독자/리스너 수가 아님)", () => {
			const key1 = ["count-test", 1];
			const key2 = ["count-test", 2];
			const state: QueryState = {
				data: "test",
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};

			queryCache.set(key1, state);
			queryCache.set(key2, state);

			// key1에 3명의 구독자
			queryCache.subscribe(key1);
			queryCache.subscribe(key1);
			queryCache.subscribe(key1);

			// key2에 2명의 구독자
			queryCache.subscribe(key2);
			queryCache.subscribe(key2);

			// key1에 2개의 리스너
			const unsubscribe1a = queryCache.subscribeListener(key1, () => {});
			const unsubscribe1b = queryCache.subscribeListener(key1, () => {});

			// key2에 1개의 리스너
			const unsubscribe2 = queryCache.subscribeListener(key2, () => {});

			const stats = queryCache.getStats();

			// subscribersCount는 구독자가 있는 키의 개수 (총 구독자 수가 아님)
			expect(stats.subscribersCount).toBe(2); // key1, key2 두 개의 키

			// listenersCount는 리스너가 있는 키의 개수 (총 리스너 수가 아님)
			expect(stats.listenersCount).toBe(2); // key1, key2 두 개의 키

			// 정리
			unsubscribe1a();
			unsubscribe1b();
			unsubscribe2();
		});
	});

	describe("serializeQueryKey 유틸리티", () => {
		it("배열 키를 JSON 문자열로 변환", () => {
			expect(serializeQueryKey(["user", 1, "profile"])).toBe(JSON.stringify(["user", 1, "profile"]));
		});

		it("문자열 키는 그대로 반환", () => {
			expect(serializeQueryKey("simple-key")).toBe("simple-key");
		});

		it("복잡한 객체 포함 배열 키 처리", () => {
			const complexKey = ["user", { id: 1, type: "admin" }, "data"];
			expect(serializeQueryKey(complexKey)).toBe(JSON.stringify(complexKey));
		});

		it("원시 타입이 배열에 포함된 경우 처리", () => {
			expect(serializeQueryKey(["users", null])).toBe(JSON.stringify(["users", null]));
			expect(serializeQueryKey(["posts", undefined])).toBe(JSON.stringify(["posts", undefined]));
			expect(serializeQueryKey(["items", 123])).toBe(JSON.stringify(["items", 123]));
			expect(serializeQueryKey(["settings", true])).toBe(JSON.stringify(["settings", true]));
		});
	});

	describe("엣지 케이스 및 에러 처리", () => {
		it("동일한 키에 대한 중복 subscribe/unsubscribe 처리", () => {
			const key = ["edge-case"];
			const state: QueryState = {
				data: "test",
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};

			queryCache.set(key, state);

			// 여러 번 구독
			queryCache.subscribe(key);
			queryCache.subscribe(key);
			queryCache.subscribe(key);

			let stats = queryCache.getStats();
			expect(stats.subscribersCount).toBe(1); // 키 하나

			vi.useFakeTimers();

			// 구독자 수보다 많이 unsubscribe 호출
			queryCache.unsubscribe(key, 10);
			queryCache.unsubscribe(key, 10);
			queryCache.unsubscribe(key, 10);
			queryCache.unsubscribe(key, 10); // 추가 호출

			// 마지막 unsubscribe에서 타이머가 시작되어야 함
			vi.advanceTimersByTime(15);
			expect(queryCache.has(key)).toBe(false);

			vi.useRealTimers();
		});

		it("존재하지 않는 키에 대한 subscribe/unsubscribe 안전 처리", () => {
			const nonExistentKey = ["non-existent"];

			// 존재하지 않는 키에 대한 구독/해제가 에러를 발생시키지 않아야 함
			expect(() => {
				queryCache.subscribe(nonExistentKey);
				queryCache.unsubscribe(nonExistentKey, 100);
			}).not.toThrow();

			// 리스너도 마찬가지
			expect(() => {
				const unsubscribe = queryCache.subscribeListener(nonExistentKey, () => {});
				unsubscribe();
			}).not.toThrow();
		});

		it("clear 호출 시 모든 타이머가 정리됨", () => {
			const key1 = ["timer1"];
			const key2 = ["timer2"];
			const state: QueryState = {
				data: "test",
				isLoading: false,
				isFetching: false,
				updatedAt: Date.now(),
			};

			queryCache.set(key1, state);
			queryCache.set(key2, state);
			queryCache.subscribe(key1);
			queryCache.subscribe(key2);

			vi.useFakeTimers();

			// 두 키 모두 unsubscribe하여 타이머 생성
			queryCache.unsubscribe(key1, 1000);
			queryCache.unsubscribe(key2, 1000);

			let stats = queryCache.getStats();
			expect(stats.activeGcTimersCount).toBe(2);

			// clear 호출
			queryCache.clear();

			// 모든 타이머가 정리되었는지 확인
			stats = queryCache.getStats();
			expect(stats.activeGcTimersCount).toBe(0);
			expect(stats.cacheSize).toBe(0);
			expect(stats.subscribersCount).toBe(0);
			expect(stats.listenersCount).toBe(0);

			vi.useRealTimers();
		});
	});
});
