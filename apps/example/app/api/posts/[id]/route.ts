import { NextResponse } from 'next/server';

let posts = [
  { id: 1, title: 'First Post', body: 'This is my first post', userId: 1 },
  { id: 2, title: 'Second Post', body: 'This is my second post', userId: 1 },
  { id: 3, title: 'Another Post', body: 'Another interesting post', userId: 1 },
  { id: 4, title: 'Jane\'s Post', body: 'Hello from Jane', userId: 2 },
  { id: 5, title: 'Bob\'s Thoughts', body: 'Random thoughts', userId: 3 },
];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramId } = await params;
  const id = parseInt(paramId);
  const body = await request.json();
  
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  
  posts[index] = { ...posts[index], ...body };
  
  return NextResponse.json(posts[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramId } = await params;
  const id = parseInt(paramId);
  
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  
  posts.splice(index, 1);
  
  return NextResponse.json({ success: true });
}