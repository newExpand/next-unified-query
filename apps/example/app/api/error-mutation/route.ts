export async function POST(request: Request) {
  // 1초 지연
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return Response.json({ error: "Mutation failed" }, { status: 500 });
}
