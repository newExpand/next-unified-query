'use client';

import { useQuery, useMutation } from 'next-unified-query/react';
import { createQueryFactory, createMutationFactory, z } from 'next-unified-query';

// Zod 스키마 정의
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  website: z.string().optional(),
});

const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  userId: z.number(),
});

const createPostSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  userId: z.number(),
});

const updatePostSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  body: z.string().min(1),
  userId: z.number(),
});

// Query Factory 생성
const userQueries = createQueryFactory({
  list: {
    cacheKey: () => ['users'] as const,
    url: () => '/users',
    schema: z.array(userSchema),
  },
  get: {
    cacheKey: (id: number) => ['user', id] as const,
    url: (id: number) => `/users/${id}`,
    schema: userSchema,
  },
  posts: {
    cacheKey: (userId: number) => ['user', userId, 'posts'] as const,
    url: (userId: number) => `/users/${userId}/posts`,
    schema: z.array(postSchema),
  },
});

// Mutation Factory 생성
const postMutations = createMutationFactory({
  create: {
    url: () => '/posts',
    method: 'POST',
    requestSchema: createPostSchema,
    responseSchema: postSchema,
  },
  update: {
    url: (data: { id: number; title: string; body: string; userId: number }) => `/posts/${data.id}`,
    method: 'PUT',
    requestSchema: updatePostSchema,
    responseSchema: postSchema,
  },
  delete: {
    url: (id: number) => `/posts/${id}`,
    method: 'DELETE',
  },
});

export default function FactoryPage() {
  // Type-safe queries with automatic inference
  const { data: users } = useQuery(userQueries.list, {});
  const { data: user } = useQuery(userQueries.get, { params: 1 });
  const { data: userPosts } = useQuery(userQueries.posts, { params: 1 });

  // Type-safe mutations
  const createPost = useMutation(postMutations.create);
  const updatePost = useMutation(postMutations.update);
  const deletePost = useMutation(postMutations.delete);

  const handleCreatePost = () => {
    createPost.mutate({
      title: 'New Post from Factory',
      body: 'This post was created using the factory pattern',
      userId: 1,
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Factory Pattern Example</h1>
      <p className="mb-4 text-gray-600">
        This example demonstrates type-safe API definitions using factory patterns with Zod validation.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Users (Type-safe)</h2>
          <div className="space-y-2">
            {users?.slice(0, 5).map((u) => (
              <div key={u.id} className="bg-gray-100 p-3 rounded">
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-gray-600">{u.email}</p>
                {u.phone && <p className="text-sm text-gray-500">📞 {u.phone}</p>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Single User Detail</h2>
          {user && (
            <div className="bg-blue-50 p-4 rounded mb-4">
              <h3 className="font-bold">{user.name}</h3>
              <p className="text-sm">{user.email}</p>
              {user.website && (
                <a href={`https://${user.website}`} className="text-blue-500 text-sm">
                  🌐 {user.website}
                </a>
              )}
            </div>
          )}

          <h3 className="font-semibold mb-2">User Posts</h3>
          <div className="space-y-2">
            {userPosts?.slice(0, 3).map((post) => (
              <div key={post.id} className="bg-gray-100 p-2 rounded">
                <p className="font-medium text-sm">{post.title}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleCreatePost}
            disabled={createPost.isPending}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {createPost.isPending ? 'Creating...' : 'Create Post (Type-safe)'}
          </button>
        </div>
      </div>
    </div>
  );
}