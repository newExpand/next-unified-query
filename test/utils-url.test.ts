import { describe, expect, it } from "vitest";
import { appendQueryParams, combineURLs } from "../src/utils/url";

describe("next-type-fetch: URL 유틸리티", () => {
	describe("appendQueryParams 함수", () => {
		it("쿼리 파라미터가 없으면 원래 URL을 반환", () => {
			const url = "https://api.example.com/users";
			expect(appendQueryParams(url)).toBe(url);
		});

		it("쿼리 파라미터가 있으면 URL에 추가", () => {
			const url = "https://api.example.com/users";
			const params = { page: 1, limit: 10 };
			expect(appendQueryParams(url, params)).toBe("https://api.example.com/users?page=1&limit=10");
		});

		it("undefined나 null 값은 쿼리에서 제외", () => {
			const url = "https://api.example.com/users";
			const params = { page: 1, filter: undefined, sort: null, limit: 10 };
			expect(appendQueryParams(url, params)).toBe("https://api.example.com/users?page=1&limit=10");
		});

		it("불리언 값도 처리", () => {
			const url = "https://api.example.com/users";
			const params = { active: true, deleted: false };
			expect(appendQueryParams(url, params)).toBe("https://api.example.com/users?active=true&deleted=false");
		});

		it("이미 쿼리 파라미터가 있는 URL에 추가", () => {
			const url = "https://api.example.com/users?active=true";
			const params = { page: 1, limit: 10 };
			expect(appendQueryParams(url, params)).toBe("https://api.example.com/users?active=true&page=1&limit=10");
		});

		it("상대 경로 URL도 처리", () => {
			const url = "/api/users";
			const params = { page: 1, limit: 10 };
			expect(appendQueryParams(url, params)).toBe("/api/users?page=1&limit=10");
		});
	});

	describe("combineURLs 함수", () => {
		it("기본 URL이 없으면 상대 경로만 반환", () => {
			expect(combineURLs(undefined, "/users")).toBe("/users");
		});

		it("상대 경로가 없으면 기본 URL만 반환", () => {
			expect(combineURLs("https://api.example.com", undefined)).toBe("https://api.example.com");
		});

		it("둘 다 없으면 빈 문자열 반환", () => {
			expect(combineURLs(undefined, undefined)).toBe("");
		});

		it("기본 URL과 상대 경로가 모두 슬래시를 가지면 하나 제거", () => {
			expect(combineURLs("https://api.example.com/", "/users")).toBe("https://api.example.com/users");
		});

		it("기본 URL과 상대 경로 모두 슬래시가 없으면 추가", () => {
			expect(combineURLs("https://api.example.com", "users")).toBe("https://api.example.com/users");
		});

		it("기본 URL만 슬래시를 가지면 그대로 연결", () => {
			expect(combineURLs("https://api.example.com/", "users")).toBe("https://api.example.com/users");
		});

		it("상대 경로만 슬래시를 가지면 그대로 연결", () => {
			expect(combineURLs("https://api.example.com", "/users")).toBe("https://api.example.com/users");
		});
	});
});
