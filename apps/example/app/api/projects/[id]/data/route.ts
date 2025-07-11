import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const projectId = parseInt((await params).id);
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "overview";

  if (isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  }

  // Mock 프로젝트 데이터
  const projectData = {
    projectId,
    view,
    data: `${view} data for project ${projectId}`,
    timestamp: Date.now(),
  };

  return NextResponse.json(projectData);
}
