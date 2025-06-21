export async function GET() {
  return Response.json({
    data: "Garbage collection test data",
    timestamp: Date.now(),
  });
}
