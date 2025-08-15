import { NextResponse } from 'next/server';

export async function POST() {
  // 로그아웃 처리 (실제로는 서버 세션 정리 등)
  return NextResponse.json({ success: true });
}