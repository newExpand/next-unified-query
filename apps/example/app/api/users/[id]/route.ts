import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = parseInt(id);

  const users: Record<number, any> = {
    1: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      age: 30,
      departmentId: 5,
      role: "Senior Developer",
      joinDate: "2022-01-15",
    },
    2: {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      age: 28,
      departmentId: 2,
      role: "UI/UX Designer",
      joinDate: "2021-08-20",
    },
    3: {
      id: 3,
      name: "Mike Johnson",
      email: "mike@example.com",
      age: 35,
      departmentId: 3,
      role: "Marketing Manager",
      joinDate: "2020-03-10",
    },
    4: {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah@example.com",
      age: 32,
      departmentId: 4,
      role: "Sales Lead",
      joinDate: "2019-11-05",
    },
    5: {
      id: 5,
      name: "Tom Brown",
      email: "tom@example.com",
      age: 29,
      departmentId: 1,
      role: "Frontend Developer",
      joinDate: "2023-02-14",
    },
  };

  const user = users[userId];

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
