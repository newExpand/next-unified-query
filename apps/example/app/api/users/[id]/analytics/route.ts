import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = parseInt(id);

  const analytics = {
    userId,
    totalViews: Math.floor(Math.random() * 2000) + 500,
    totalLikes: Math.floor(Math.random() * 200) + 50,
    engagement: Math.round((Math.random() * 10 + 5) * 100) / 100,
    topPosts: [
      {
        id: 1,
        title: "React Best Practices",
        views: 450,
        likes: 25,
        comments: 8,
      },
      {
        id: 2,
        title: "TypeScript Advanced Tips",
        views: 380,
        likes: 20,
        comments: 12,
      },
      {
        id: 3,
        title: "Next.js Performance Optimization",
        views: 320,
        likes: 18,
        comments: 6,
      },
    ],
    monthlyGrowth: {
      views: Math.round((Math.random() * 20 + 5) * 100) / 100,
      likes: Math.round((Math.random() * 15 + 3) * 100) / 100,
      followers: Math.round((Math.random() * 12 + 2) * 100) / 100,
    },
    demographics: {
      countries: [
        { name: "South Korea", percentage: 45 },
        { name: "United States", percentage: 25 },
        { name: "Japan", percentage: 15 },
        { name: "Others", percentage: 15 },
      ],
      devices: [
        { name: "Mobile", percentage: 60 },
        { name: "Desktop", percentage: 35 },
        { name: "Tablet", percentage: 5 },
      ],
    },
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(analytics);
}
