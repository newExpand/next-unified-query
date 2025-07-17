import { NextResponse } from "next/server";

const POSTS_DATA = [
  {
    id: "1",
    title: "Introduction to Next.js",
    content: "Learn the basics of Next.js...",
  },
  { id: "2", title: "SSR vs CSR", content: "Understanding the differences..." },
  {
    id: "3",
    title: "React Query Integration",
    content: "How to integrate React Query...",
  },
  {
    id: "4",
    title: "Performance Optimization",
    content: "Tips for better performance...",
  },
  {
    id: "5",
    title: "TypeScript Best Practices",
    content: "Writing better TypeScript...",
  },
];

export async function GET(_request: Request) {
  return NextResponse.json(POSTS_DATA, {
    headers: {
      "X-Response-Posts-Count": POSTS_DATA.length.toString(),
      "X-Response-Timestamp": Date.now().toString(),
    },
  });
}
