'use client';

import { useQuery } from 'next-unified-query/react';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function ClientComponent() {
  // 이미 서버에서 prefetch된 데이터를 사용
  const { data: todos, isLoading: todosLoading } = useQuery<Todo[]>({
    cacheKey: ['todos'],
    url: '/todos',
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    cacheKey: ['users'],
    url: '/users',
  });

  // SSR로 인해 초기 로딩 상태가 없음
  if (todosLoading || usersLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-2">
      <div>
        <h2>Todos (SSR Prefetched)</h2>
        <div className="space-y-2">
          {todos?.map((todo) => (
            <div key={todo.id} className="card">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  readOnly
                />
                <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                  {todo.title}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2>Users (SSR Prefetched)</h2>
        <div className="space-y-2">
          {users?.map((user) => (
            <div key={user.id} className="card">
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-gray">{user.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}