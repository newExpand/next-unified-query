import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const departmentId = parseInt(id);

  const departments: Record<number, any> = {
    1: {
      id: 1,
      name: "Development",
      location: "Seoul",
      manager: "김개발",
      employees: 15,
      budget: 500000000,
    },
    2: {
      id: 2,
      name: "Design",
      location: "Busan",
      manager: "박디자인",
      employees: 8,
      budget: 200000000,
    },
    3: {
      id: 3,
      name: "Marketing",
      location: "Incheon",
      manager: "이마케팅",
      employees: 12,
      budget: 300000000,
    },
    4: {
      id: 4,
      name: "Sales",
      location: "Daegu",
      manager: "정세일즈",
      employees: 20,
      budget: 450000000,
    },
    5: {
      id: 5,
      name: "Engineering",
      location: "Seoul",
      manager: "최엔지니어",
      employees: 25,
      budget: 800000000,
    },
  };

  const department = departments[departmentId];

  if (!department) {
    return NextResponse.json(
      { error: "Department not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(department);
}
