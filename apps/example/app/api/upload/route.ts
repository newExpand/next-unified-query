import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 파일 업로드 시뮬레이션 (실제로는 formData 처리)
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 업로드 진행률 시뮬레이션을 위한 지연
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const uploadResult = {
      fileId: `uploaded-file-${Date.now()}`,
      filename: file.name,
      size: file.size,
      url: `/uploads/${file.name}`,
      uploadedAt: new Date().toISOString(),
      contentType: file.type,
    };

    return NextResponse.json(uploadResult);
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
