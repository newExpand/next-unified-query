"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "next-type-fetch/react";
import { postQueries, postMutations, PostList } from "../factory";
import { FetchError } from "next-type-fetch";

export function CreatePost() {
  const [counter, setCounter] = useState(0);
  const counterAtMutate = useRef(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const userId = 1;

  useEffect(() => {
    counterAtMutate.current = counter;
  }, [counter]);

  const {
    data: posts,
    isLoading: isPostsLoading,
    isFetching,
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
        console.log("counter 1 (클로저):", counter);
        console.log("counter 1 (ref):", counterAtMutate.current);
      },
    }
  );

  useEffect(() => {
    console.log("counter 3: ", counter);
  }, [counter]);

  const { mutate: deletePost } = useMutation(postMutations.deletePost);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    setCounter((prev) => ++prev);
    counterAtMutate.current = counter;
    createPost(
      { userId: String(userId), title, body },
      {
        onSuccess: () => {
          console.log("counter 2 (클로저):", counter);
          console.log("counter 2 (ref):", counterAtMutate.current);
          setCounter((prev) => ++prev);
        },
      }
    );
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
      {Array.isArray(posts) && posts.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {posts.map((post, idx) =>
            typeof post === "object" && post !== null && "id" in post ? (
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
            ) : (
              <li key={idx}>{post}</li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
