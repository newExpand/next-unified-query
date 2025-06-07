"use client";

import { userQueries } from "../factory";
import { useQuery } from "next-type-fetch/react";

export function UserInfo() {
  const { data, isLoading, error } = useQuery(userQueries.detail, {
    params: { userId: 1 },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {String(error)}</div>;

  return (
    <>
      <h2>Client Interceptor Test</h2>
      <div>
        <strong>user id:</strong> {data?.id}
      </div>
      <div>
        <strong>name:</strong> {data?.name}
      </div>
      <div>
        <strong>timestamp:</strong> {data?.timestamp}
      </div>
      <div>
        <strong>X-Test-Header (from server):</strong>{" "}
        {data?.testHeader ?? <span style={{ color: "red" }}>없음</span>}
      </div>
      <div>
        <strong>X-Custom-Header (from server):</strong>{" "}
        {data?.customHeader ?? <span style={{ color: "red" }}>없음</span>}
      </div>
    </>
  );
}
