export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    // 빈 body 또는 잘못된 JSON인 경우 기본값 사용
    body = {};
  }

  // 처리 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (body.shouldFail) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  return Response.json({
    success: true,
    data: "Mutation successful",
  });
}
