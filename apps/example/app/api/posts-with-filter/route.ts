export async function GET() {
  return Response.json({
    posts: [
      { id: 1, title: "JavaScript Tips", category: "tech", likes: 15 },
      { id: 2, title: "React Patterns", category: "tech", likes: 23 },
      { id: 3, title: "Life Update", category: "personal", likes: 8 },
      { id: 4, title: "Travel Blog", category: "personal", likes: 12 },
    ],
  });
}
