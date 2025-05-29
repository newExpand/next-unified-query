import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { QueryClient } from "../src/query/query-client";
import {
  QueryClientProvider,
  useQueryClient,
} from "../src/query/query-client-provider";

function ShowClientId() {
  const client = useQueryClient();
  // QueryClient 인스턴스인지 확인
  return <div>client: {client instanceof QueryClient ? "ok" : "fail"}</div>;
}

describe("QueryClientProvider & useQueryClient", () => {
  it("Provider로 감싸지 않으면 에러 발생", () => {
    // 에러가 발생해야 함
    expect(() => {
      render(<ShowClientId />);
    }).toThrowError(/You must wrap/);
  });

  it("Provider로 감싸면 useQueryClient가 정상 동작", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <ShowClientId />
      </QueryClientProvider>
    );

    expect(screen.getByText("client: ok")).toBeInTheDocument();
  });

  it("children이 정상적으로 렌더링됨", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <div>hello</div>
      </QueryClientProvider>
    );

    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
