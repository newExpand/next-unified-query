import { NextRequest, NextResponse } from "next/server";

// Mock user data storage
const mockUsers: Record<string, any> = {};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testHeader = req.headers.get("x-test-header") || null;
  const customHeader = req.headers.get("x-custom-header") || null;

  // Return existing user data if available, or create new
  const user = mockUsers[id] || {
    id,
    name: `User ${id}`,
    timestamp: Date.now(),
    testHeader,
    customHeader,
  };

  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Simulate network delay for testing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Update user data
  const updatedUser = {
    id,
    name: body.name || `User ${id}`,
    timestamp: Date.now(),
    testHeader: req.headers.get("x-test-header") || null,
    customHeader: req.headers.get("x-custom-header") || null,
  };

  mockUsers[id] = updatedUser;

  return NextResponse.json(updatedUser);
}
