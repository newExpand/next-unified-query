import { NextResponse } from 'next/server';

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', website: 'johndoe.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321', website: 'janesmith.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '555-555-5555', website: 'bobjohnson.com' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', phone: '111-222-3333', website: 'alicebrown.com' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', phone: '444-555-6666', website: 'charliewilson.com' },
];

export async function GET() {
  // 약간의 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return NextResponse.json(users);
}