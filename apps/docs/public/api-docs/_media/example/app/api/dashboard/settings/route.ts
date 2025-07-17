import { NextResponse } from "next/server";

export async function GET() {
  // Mock settings 데이터
  const settingsData = {
    preferences: { 
      theme: "dark", 
      notifications: true 
    },
    profile: { 
      name: "Admin User" 
    }
  };

  return NextResponse.json(settingsData);
}