import { NextResponse } from 'next/server';

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', website: 'johndoe.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321', website: 'janesmith.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '555-555-5555', website: 'bobjohnson.com' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', phone: '111-222-3333', website: 'alicebrown.com' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', phone: '444-555-6666', website: 'charliewilson.com' },
];

export async function GET(request: Request) {
  // 약간의 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const { searchParams } = new URL(request.url);
  const errorParam = searchParams.get('error');
  
  // 에러 테스트를 위한 처리
  if (errorParam === '404') {
    return NextResponse.json(
      { message: 'Users not found' }, 
      { status: 404 }
    );
  }
  
  if (errorParam === '500') {
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    );
  }
  
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  // Mutation 에러 테스트를 위한 처리
  const body = await request.json().catch(() => ({}));
  
  if (body.error === 'mutation') {
    return NextResponse.json(
      { message: 'Mutation failed' }, 
      { status: 500 }
    );
  }
  
  // 정상적인 POST 처리
  const newUser = {
    id: users.length + 1,
    name: body.name || 'New User',
    email: body.email || 'new@example.com',
    phone: body.phone || '000-000-0000',
    website: body.website || 'example.com'
  };
  
  users.push(newUser);
  return NextResponse.json(newUser, { status: 201 });
}