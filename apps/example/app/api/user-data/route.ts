export async function GET() {
  return Response.json({
    user: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      profile: {
        bio: "Software Developer",
        skills: ["JavaScript", "TypeScript", "React"],
      },
    },
    metadata: {
      lastLogin: "2023-01-01T00:00:00Z",
      preferences: { theme: "dark", language: "en" },
    },
  });
}
