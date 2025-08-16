'use client';

import { useQuery, useMutation } from 'next-unified-query/react';
import { useState } from 'react';
import { getQueryClient, FetchError } from 'next-unified-query';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

export default function BasicMutationPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const queryClient = getQueryClient();

  const { data: posts, isLoading } = useQuery<Post[]>({
    cacheKey: ['posts'],
    url: '/posts',
  });

  const createPost = useMutation<Post, Partial<Post>>({
    url: '/posts',
    method: 'POST',
    onSuccess: (newPost) => {
      // Optimistic update
      queryClient.setQueryData(['posts'], (old: Post[] | undefined) => {
        if (!old) return [newPost];
        return [...old, newPost];
      });
      
      // Reset form
      setTitle('');
      setBody('');
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
    },
  });

  const updatePost = useMutation({
    url: (data: Partial<Post> & { id: number }) => `/posts/${data.id}`,
    method: 'PUT',
    onSuccess: (updatedPost: Post) => {
      queryClient.setQueryData(['posts'], (old: Post[] | undefined) => {
        if (!old) return [updatedPost];
        return old.map(post => 
          post.id === updatedPost.id ? updatedPost : post
        );
      });
    },
  });

  const deletePost = useMutation<void, { id: number }>({
    url: (data) => `/posts/${data.id}`,
    method: 'DELETE',
    onSuccess: (_, variables) => {
      queryClient.setQueryData(['posts'], (old: Post[] | undefined) => {
        if (!old) return [];
        return old.filter(post => post.id !== variables.id);
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost.mutate({
      title,
      body,
      userId: 1,
    });
  };

  if (isLoading) {
    return <div className="container loading">Loading posts...</div>;
  }

  return (
    <div className="container">
      <h1>Basic Mutation Example</h1>

      <div className="mb-8">
        <h2>Create New Post</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <textarea
              placeholder="Body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="textarea"
              rows={4}
              required
            />
          </div>
          <button
            type="submit"
            disabled={createPost.isPending}
            className="btn"
          >
            {createPost.isPending ? 'Creating...' : 'Create Post'}
          </button>
        </form>
      </div>

      <div>
        <h2>Posts ({posts?.length || 0})</h2>
        <div className="grid space-y-4">
          {posts?.map((post) => (
            <div key={post.id} className="card">
              <h3 className="font-semibold">{post.title}</h3>
              <p className="text-sm text-gray mb-2">{post.body}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => updatePost.mutate({
                    id: post.id,
                    title: post.title + ' (Updated)',
                    body: post.body,
                    userId: post.userId,
                  })}
                  disabled={updatePost.isPending}
                  className="btn btn-green"
                >
                  Update
                </button>
                <button
                  onClick={() => deletePost.mutate({ id: post.id })}
                  disabled={deletePost.isPending}
                  className="btn btn-red"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}