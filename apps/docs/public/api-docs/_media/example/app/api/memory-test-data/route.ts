export async function GET() {
  return Response.json({
    data: "Memory test data",
    timestamp: Date.now(),
  });
}
