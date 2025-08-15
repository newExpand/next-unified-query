import { NextResponse } from 'next/server';

const todos = [
  { id: 1, title: 'Complete project documentation', completed: false, userId: 1 },
  { id: 2, title: 'Review pull requests', completed: true, userId: 1 },
  { id: 3, title: 'Update dependencies', completed: false, userId: 1 },
  { id: 4, title: 'Write unit tests', completed: false, userId: 2 },
  { id: 5, title: 'Deploy to production', completed: false, userId: 2 },
  { id: 6, title: 'Fix bug in login', completed: true, userId: 3 },
  { id: 7, title: 'Optimize database queries', completed: false, userId: 3 },
  { id: 8, title: 'Setup CI/CD pipeline', completed: true, userId: 4 },
  { id: 9, title: 'Code review', completed: false, userId: 4 },
  { id: 10, title: 'Update README', completed: true, userId: 5 },
  { id: 11, title: 'Implement new feature', completed: false, userId: 5 },
  { id: 12, title: 'Performance testing', completed: false, userId: 1 },
];

export async function GET() {
  await new Promise(resolve => setTimeout(resolve, 100));
  return NextResponse.json(todos);
}