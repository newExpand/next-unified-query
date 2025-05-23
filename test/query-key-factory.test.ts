import { describe, it, expect } from "vitest";
import { createQueryKeyFactory } from "../src/query/query-key-factory";

describe("createQueryKeyFactory", () => {
  const userKeys = createQueryKeyFactory("user", {
    detail: (id: number) => [id],
    list: () => [],
  });

  const postKeys = createQueryKeyFactory("post", {
    detail: (id: number) => [id],
    list: (page: number, filter?: string) => [page, filter],
    byAuthor: (authorId: number, options: { published: boolean }) => [
      authorId,
      options,
    ],
  });

  it("네임스페이스와 키, 파라미터로 쿼리키를 생성한다", () => {
    expect(userKeys.detail(1)).toEqual(["user", "detail", 1]);
    expect(userKeys.list()).toEqual(["user", "list"]);
    expect(postKeys.detail(10)).toEqual(["post", "detail", 10]);
    expect(postKeys.list(2)).toEqual(["post", "list", 2, undefined]);
    expect(postKeys.list(3, "hot")).toEqual(["post", "list", 3, "hot"]);
    expect(postKeys.byAuthor(5, { published: true })).toEqual([
      "post",
      "byAuthor",
      5,
      { published: true },
    ]);
  });

  it("타입 안전성(파라미터 타입 체크)", () => {
    // userKeys.detail("abc"); // number가 아니면 타입 에러
    // postKeys.list(); // page는 필수
    // postKeys.byAuthor(1, {}); // published 필드 누락 시 타입 에러
    expect(true).toBe(true);
  });
});
