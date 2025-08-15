'use client';

import { useQuery } from 'next-unified-query/react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  website: string;
}

export default function BasicQueryPage() {
  // 기본 쿼리 사용법
  const { data, isLoading, error } = useQuery<User[]>({
    cacheKey: ['users'],
    url: '/users',
  });

  // 단일 사용자 조회
  const { data: singleUser } = useQuery<User>({
    cacheKey: ['user', 1],
    url: '/users/1',
  });

  if (isLoading) {
    return <div className="container loading">Loading users...</div>;
  }

  if (error) {
    return <div className="container error">Error: {error.message}</div>;
  }

  return (
    <div className="container">
      <h1>Basic Query Example</h1>
      
      <div className="mb-8">
        <h2>Single User</h2>
        {singleUser && (
          <div className="card">
            <p>Name: {singleUser.name}</p>
            <p>Email: {singleUser.email}</p>
            <p>Website: {singleUser.website}</p>
          </div>
        )}
      </div>

      <div>
        <h2>All Users</h2>
        <div className="grid space-y-4">
          {data?.map((user) => (
            <div key={user.id} className="card">
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-sm text-gray">{user.email}</p>
              <p className="text-sm text-gray">{user.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}