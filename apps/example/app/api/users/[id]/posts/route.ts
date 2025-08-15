import { NextResponse } from 'next/server';

const posts = [
  { id: 1, title: 'First Post', body: 'This is my first post', userId: 1 },
  { id: 2, title: 'Second Post', body: 'This is my second post', userId: 1 },
  { id: 3, title: 'Another Post', body: 'Another interesting post', userId: 1 },
  { id: 4, title: 'Jane\'s Post', body: 'Hello from Jane', userId: 2 },
  { id: 5, title: 'Bob\'s Thoughts', body: 'Random thoughts', userId: 3 },
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = parseInt(params.id);
  const userPosts = posts.filter(p => p.userId === userId);
  
  return NextResponse.json(userPosts);
}