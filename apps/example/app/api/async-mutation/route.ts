export async function POST(request: Request) {
  const body = await request.json();

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
