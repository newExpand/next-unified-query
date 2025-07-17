export async function GET() {
  return Response.json({
    data: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random() * 1000,
    })),
  });
}
