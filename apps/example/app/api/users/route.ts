import { NextResponse } from "next/server";

// createMutationFactory 테스트를 위한 확장된 사용자 데이터
const mockUsers = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", age: 28, createdAt: "2024-01-01T00:00:00Z" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", age: 35, createdAt: "2024-01-02T00:00:00Z" },
  { id: 3, name: "Charlie Brown", email: "charlie@example.com", age: 22, createdAt: "2024-01-03T00:00:00Z" },
  { id: 4, name: "Diana Prince", email: "diana@example.com", age: 30, createdAt: "2024-01-04T00:00:00Z" },
  { id: 5, name: "Eve Wilson", email: "eve@example.com", age: 25, createdAt: "2024-01-05T00:00:00Z" },
];

export async function GET() {
  // 실제 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json(mockUsers);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 스키마 검증 시뮬레이션
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          message: "Name is required",
          details: [{ path: "name", message: "Name must not be empty" }]
        }, 
        { status: 400 }
      );
    }
    
    if (!body.email || !body.email.includes("@")) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          message: "Invalid email format",
          details: [{ path: "email", message: "Email must be a valid email address" }]
        }, 
        { status: 400 }
      );
    }
    
    if (body.age !== undefined && body.age < 0) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          message: "Age must be non-negative",
          details: [{ path: "age", message: "Age must be 0 or greater" }]
        }, 
        { status: 400 }
      );
    }
    
    const newUser = {
      id: Math.max(...mockUsers.map(u => u.id)) + 1,
      name: body.name,
      email: body.email,
      age: body.age || undefined,
      createdAt: new Date().toISOString(),
    };
    
    mockUsers.push(newUser);
    
    // 네트워크 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}