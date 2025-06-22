import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = parseInt(id);

  const userStats = {
    userId,
    projectCount: Math.floor(Math.random() * 10) + 1,
    taskCount: Math.floor(Math.random() * 50) + 5,
    completedTasks: Math.floor(Math.random() * 30) + 10,
    hoursWorked: Math.floor(Math.random() * 160) + 40,
    efficiency: Math.round((Math.random() * 30 + 70) * 100) / 100,
    lastActivity: new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    achievements: [
      "First Project Completed",
      "Team Player",
      "Fast Learner",
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    performance: {
      quality: Math.round((Math.random() * 20 + 80) * 100) / 100,
      speed: Math.round((Math.random() * 20 + 75) * 100) / 100,
      collaboration: Math.round((Math.random() * 15 + 85) * 100) / 100,
    },
  };

  return NextResponse.json(userStats);
}
