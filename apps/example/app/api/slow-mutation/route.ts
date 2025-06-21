export async function POST(request: Request) {
  // 2초 지연
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return Response.json({
    type: "slow",
    completed: true,
    completedAt: Date.now(),
  });
}
