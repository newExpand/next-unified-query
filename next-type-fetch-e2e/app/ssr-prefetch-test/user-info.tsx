"use client";
import { useQuery } from "next-type-fetch/react";
import { userQueries } from "../factory";

export function UserInfo() {
  // useQuery는 Providers(Context)에서 QueryClient를 받아 사용
  const { data, isLoading, error } = useQuery(userQueries.detail, { id: 1 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {String(error)}</div>;

  return (
    <div>
      <h2>User Info</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
