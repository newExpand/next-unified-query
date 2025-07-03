import { NextRequest, NextResponse } from "next/server";

// Factory 테스트를 위한 사용자 데이터 저장소
const users: Record<number, any> = {
  1: {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    createdAt: "2024-01-01T00:00:00Z",
  },
  2: {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    age: 28,
    createdAt: "2024-01-02T00:00:00Z",
  },
  3: {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    age: 35,
    createdAt: "2024-01-03T00:00:00Z",
  },
  4: {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah@example.com",
    age: 32,
    createdAt: "2024-01-04T00:00:00Z",
  },
  5: {
    id: 5,
    name: "Tom Brown",
    email: "tom@example.com",
    age: 29,
    createdAt: "2024-01-05T00:00:00Z",
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = parseInt(id);

  const user = users[userId];

  if (!user) {
    return NextResponse.json(
      { 
        error: "User not found", 
        message: `User with id ${userId} does not exist`,
        details: `Available user IDs: ${Object.keys(users).join(", ")}` 
      }, 
      { status: 404 }
    );
  }

  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 200));

  return NextResponse.json(user);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();

    if (!users[userId]) {
      return NextResponse.json(
        { 
          error: "User not found", 
          message: `User with id ${userId} does not exist`,
          details: `Available user IDs: ${Object.keys(users).join(", ")}` 
        }, 
        { status: 404 }
      );
    }

    // 스키마 검증 시뮬레이션
    if (body.name !== undefined && (!body.name || body.name.trim() === "")) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          message: "Name cannot be empty",
          details: [{ path: "name", message: "Name must not be empty" }]
        }, 
        { status: 400 }
      );
    }
    
    if (body.email !== undefined && (!body.email || !body.email.includes("@"))) {
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

    // 사용자 업데이트
    const updatedUser = {
      ...users[userId],
      ...body,
      id: userId, // ID는 변경되지 않음
    };

    users[userId] = updatedUser;

    // 네트워크 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (!users[userId]) {
      return NextResponse.json(
        { 
          error: "User not found", 
          message: `User with id ${userId} does not exist`,
          details: `Available user IDs: ${Object.keys(users).join(", ")}` 
        }, 
        { status: 404 }
      );
    }

    const deletedUser = users[userId];
    delete users[userId];

    // 네트워크 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 200));

    return NextResponse.json({ 
      success: true, 
      message: `User ${userId} deleted successfully`,
      deletedUser 
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}
