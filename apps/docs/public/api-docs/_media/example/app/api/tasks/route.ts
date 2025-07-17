export async function POST(request: Request) {
  const body = await request.json();

  // 처리 지연 시뮬레이션 (1.5초)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return Response.json(
    {
      id: Date.now(),
      title: body.title || "New Task",
      completed: false,
      createdAt: new Date().toISOString(),
    },
    { status: 201 }
  );
}
