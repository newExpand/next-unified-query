import { NextResponse } from "next/server";

const mockUsers = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com" },
  { id: "2", name: "Bob Smith", email: "bob@example.com" },
  { id: "3", name: "Charlie Brown", email: "charlie@example.com" },
  { id: "4", name: "Diana Prince", email: "diana@example.com" },
  { id: "5", name: "Eve Wilson", email: "eve@example.com" },
];

export async function GET() {
  // 실제 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json(mockUsers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newUser = {
    id: String(mockUsers.length + 1),
    name: body.name,
    email: body.email,
  };
  
  mockUsers.push(newUser);
  
  return NextResponse.json(newUser, { status: 201 });
}