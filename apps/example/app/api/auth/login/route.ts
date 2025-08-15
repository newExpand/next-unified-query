import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  
  // 간단한 가짜 인증
  if (body.email === 'user@example.com' && body.password === 'password123') {
    return NextResponse.json({
      token: 'fake-jwt-token-' + Date.now(),
      user: {
        id: 1,
        name: 'John Doe',
        email: 'user@example.com',
      },
    });
  }
  
  return NextResponse.json(
    { error: 'Invalid credentials' },
    { status: 401 }
  );
}