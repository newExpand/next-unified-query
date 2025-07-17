export async function POST(_request: Request) {
  // 0.5초 지연
  await new Promise((resolve) => setTimeout(resolve, 500));

  return Response.json({
    type: "fast",
    completed: true,
    completedAt: Date.now(),
  });
}
