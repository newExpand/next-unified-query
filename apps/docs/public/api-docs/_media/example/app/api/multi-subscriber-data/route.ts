export async function GET() {
  return Response.json({
    data: "Multi subscriber data",
    timestamp: Date.now(),
  });
}
