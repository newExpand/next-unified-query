import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Authorization 헤더 확인
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const token = authHeader.split(' ')[1];
  
  // 간단한 토큰 검증 (실제로는 JWT 검증 등)
  if (!token.startsWith('fake-jwt-token-')) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
  
  return NextResponse.json({
    message: 'This is protected data!',
    timestamp: Date.now(),
    userId: 1,
  });
}