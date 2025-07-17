export async function POST(request: Request) {
  const body = await request.json();

  return Response.json(
    {
      id: 1,
      message: "Created successfully",
      data: body.data,
      timestamp: Date.now(),
    },
    { status: 201 }
  );
}
