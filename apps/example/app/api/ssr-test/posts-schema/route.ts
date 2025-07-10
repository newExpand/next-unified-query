import { NextRequest, NextResponse } from "next/server";

const POSTS_WITH_SCHEMA = [
  {
    id: "1",
    title: "Introduction to Next.js Framework",
    content:
      "Learn the basics of Next.js and how it revolutionizes React development...",
    authorId: "1",
    tags: ["nextjs", "react", "javascript", "web-development"],
  },
  {
    id: "2",
    title: "SSR vs CSR: A Comprehensive Guide",
    content:
      "Understanding the differences between server-side and client-side rendering...",
    authorId: "2",
    tags: ["ssr", "csr", "performance", "seo"],
  },
  {
    id: "3",
    title: "React Query Integration Best Practices",
    content: "How to integrate React Query for efficient state management...",
    authorId: "1",
    tags: ["react-query", "state-management", "react"],
  },
  {
    id: "4",
    title: "Performance Optimization Techniques",
    content: "Tips and tricks for optimizing your React applications...",
    authorId: "2",
    tags: ["performance", "optimization", "react", "javascript"],
  },
];

export async function GET(_request: NextRequest) {
  return NextResponse.json(POSTS_WITH_SCHEMA, {
    headers: {
      "X-Response-Posts-Schema": "true",
      "X-Response-Count": POSTS_WITH_SCHEMA.length.toString(),
      "X-Response-Timestamp": Date.now().toString(),
    },
  });
}

export async function POST(_request: Request) {
  // This function is not used in the provided code, so it's left empty.
  // If it were to be implemented, it would handle creating new posts.
}
