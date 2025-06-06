"use client";

import { useState } from "react";
import { useQuery, useMutation } from "next-type-fetch/react";
import { postQueries, postMutations, PostList } from "../factory";
import { FetchError } from "next-type-fetch";

export function CreatePost() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const userId = 1;

  const {
    data: posts,
    isLoading: isPostsLoading,
    error: postsError,
  } = useQuery<PostList, FetchError>(postQueries.list, {
    params: { userId },
  });

  const { mutate: createPost, isLoading: isCreating } = useMutation(
    postMutations.createPost,
    {
      onSuccess: () => {
        setTitle("");
        setBody("");
      },
    }
  );

  const { mutate: deletePost } = useMutation(postMutations.deletePost);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    createPost({ userId: String(userId), title, body });
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px" }}>
      <h1>Mutation Test</h1>
      <form
        onSubmit={handleCreatePost}
        style={{
          marginBottom: "20px",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h2>Create Post</h2>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            disabled={isCreating}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Body"
            disabled={isCreating}
            style={{
              width: "100%",
              padding: "8px",
              minHeight: "80px",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isCreating}
          style={{ padding: "10px 15px" }}
        >
          {isCreating ? "Creating..." : "Create Post"}
        </button>
      </form>

      <h2>Posts for User {userId}</h2>
      {isPostsLoading && <p>Loading posts...</p>}
      {postsError && (
        <p style={{ color: "red" }}>
          Error loading posts: {postsError.message}
        </p>
      )}
      {posts && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {posts.map((post) => (
            <li
              key={post.id}
              style={{
                border: "1px solid #eee",
                padding: "15px",
                marginBottom: "10px",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{post.title}</h3>
              <p>{post.body}</p>
              {post.id === "placeholder" && (
                <p style={{ color: "red" }}>플레이스홀더 표시됨</p>
              )}
              <button onClick={() => deletePost({ id: post.id })}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
