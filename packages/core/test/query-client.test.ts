import { describe, it, expect, beforeEach } from "vitest";
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

	describe("setQueryData", () => {
		it("데이터만 업데이트하고 기존 상태는 유지", () => {
			const originalState: QueryState = {
				data: { id: 1, name: "John" },
				error: new Error("previous error"),
				isLoading: true,
				isFetching: false,
				updatedAt: 12345,
			};

			client.set(keyA, originalState);

			// 데이터만 업데이트
			client.setQueryData(keyA, { id: 1, name: "Jane" });

			const result = client.get(keyA);
			expect(result).toMatchObject({
				data: { id: 1, name: "Jane" },
				error: new Error("previous error"), // 기존 에러 유지
				isLoading: true, // 기존 로딩 상태 유지
				isFetching: false, // 기존 페칭 상태 유지
			});
			expect(result?.updatedAt).toBeGreaterThan(12345); // updatedAt은 새로 갱신
		});

		it("함수형 업데이터로 데이터 변경", () => {
			const originalData = [{ id: 1, title: "Todo 1" }];
			client.set(keyA, {
				data: originalData,
				error: undefined,
				isLoading: false,
				isFetching: false,
				updatedAt: 12345,
			});

			// 함수형 업데이터 사용
			client.setQueryData(keyA, (oldData: any[] | undefined) => [...(oldData || []), { id: 2, title: "Todo 2" }]);

			const result = client.get(keyA);
			expect(result?.data).toEqual([
				{ id: 1, title: "Todo 1" },
				{ id: 2, title: "Todo 2" },
			]);
		});

		it("존재하지 않는 키에 대해 새로운 상태 생성", () => {
			client.setQueryData(keyA, { id: 1, name: "New User" });

			const result = client.get(keyA);
			expect(result).toMatchObject({
				data: { id: 1, name: "New User" },
				error: undefined,
				isLoading: false,
				isFetching: false,
			});
			expect(result?.updatedAt).toBeGreaterThan(0);
		});

		it("함수형 업데이터에서 undefined 반환 시 올바르게 처리", () => {
			client.setQueryData(keyA, (oldData) => {
				expect(oldData).toBeUndefined();
				return undefined;
			});

			const result = client.get(keyA);
			expect(result?.data).toBeUndefined();
		});

		it("타입 안전성 검증", () => {
			interface User {
				id: number;
				name: string;
			}

			client.setQueryData<User>(keyA, { id: 1, name: "John" });

			client.setQueryData<User>(keyA, (oldUser) => {
				expect(oldUser).toEqual({ id: 1, name: "John" });
				return { ...oldUser!, name: "Jane" };
			});

			const result = client.get<User>(keyA);
			expect(result?.data).toEqual({ id: 1, name: "Jane" });
		});
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
