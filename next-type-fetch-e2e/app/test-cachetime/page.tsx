"use client";

import React, { useState } from "react";
import { useQuery } from "next-type-fetch/react";
import { userQueries } from "../factory";
import Link from "next/link";

function UserQuery() {
  // createQueryFactory 기반 사용
  const { data, isLoading, isFetching } = useQuery(userQueries.detail, {
    id: 1,
  });
  return (
    <div data-testid="query-result">
      <div>isLoading: {String(isLoading)}</div>
      <div>isFetching: {String(isFetching)}</div>
      <div>name: {data?.name}</div>
      <div>upperName: {data?.upperName}</div>
      <div>timestamp: {data?.timestamp}</div>
    </div>
  );
}

export default function TestCacheTimePage() {
  const [show, setShow] = useState(true);

  return (
    <div>
      <h1>CacheTime 테스트</h1>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setShow((v) => !v)} data-testid="toggle-query">
          {show ? "쿼리 언마운트" : "쿼리 마운트"}
        </button>
        <Link href="/">홈으로 이동</Link>
      </div>
      {show && <UserQuery />}
    </div>
  );
}
