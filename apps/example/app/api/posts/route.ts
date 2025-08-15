import { NextResponse } from 'next/server';

let posts = [
  { id: 1, title: 'First Post', body: 'This is my first post', userId: 1 },
  { id: 2, title: 'Second Post', body: 'This is my second post', userId: 1 },
  { id: 3, title: 'Another Post', body: 'Another interesting post', userId: 1 },
  { id: 4, title: 'Jane\'s Post', body: 'Hello from Jane', userId: 2 },
  { id: 5, title: 'Bob\'s Thoughts', body: 'Random thoughts', userId: 3 },
  { id: 6, title: 'Tech News', body: 'Latest in technology', userId: 1 },
  { id: 7, title: 'Travel Blog', body: 'My recent travels', userId: 2 },
  { id: 8, title: 'Food Review', body: 'Best restaurants in town', userId: 3 },
  { id: 9, title: 'Book Review', body: 'Must-read books this year', userId: 4 },
  { id: 10, title: 'Movie Night', body: 'Top movies to watch', userId: 5 },
];

let nextId = 11;

export async function GET() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newPost = {
    id: nextId++,
    title: body.title,
    body: body.body,
    userId: body.userId || 1,
  };
  
  posts.push(newPost);
  
  return NextResponse.json(newPost, { status: 201 });
}