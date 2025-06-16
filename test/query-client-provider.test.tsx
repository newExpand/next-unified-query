import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { QueryClient } from "../src/query/client/query-client";
import {
  QueryClientProvider,
  useQueryClient,
} from "../src/query/client/query-client-provider";

function ShowClientId() {
  const client = useQueryClient();
  // QueryClient 인스턴스인지 확인
  return <div>client: {client instanceof QueryClient ? "ok" : "fail"}</div>;
}

function ShowBaseUrl() {
  const client = useQueryClient();
  return <div>baseURL: {client.getFetcher().defaults.baseURL}</div>;
}

describe("QueryClientProvider & useQueryClient", () => {
  it("Provider로 감싸지 않으면 에러 발생", () => {
    // 콘솔 에러 출력 억제
    const originalError = console.error;
    console.error = () => {};

    try {
      // 에러가 발생해야 함
      expect(() => {
        render(<ShowClientId />);
      }).toThrowError(/You must wrap/);
    } finally {
      // 콘솔 에러 복원
      console.error = originalError;
    }
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

describe("QueryClientProvider 중첩 및 fetcher 분기", () => {
  it("Provider별로 fetcher 옵션이 다르게 적용된다", () => {
    const client1 = new QueryClient({ baseURL: "https://api.main.com" });
    const client2 = new QueryClient({ baseURL: "https://api.sub.com" });

    render(
      <QueryClientProvider client={client1}>
        <div>
          <ShowBaseUrl />
          <QueryClientProvider client={client2}>
            <ShowBaseUrl />
          </QueryClientProvider>
        </div>
      </QueryClientProvider>
    );

    expect(screen.getAllByText(/baseURL:/)[0]).toHaveTextContent(
      "https://api.main.com"
    );
    expect(screen.getAllByText(/baseURL:/)[1]).toHaveTextContent(
      "https://api.sub.com"
    );
  });
});
