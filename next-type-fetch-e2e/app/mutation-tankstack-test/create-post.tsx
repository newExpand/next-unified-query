"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

const fetchPosts = async (userId: number) => {
  const res = await fetch(`/api/posts?userId=${userId}`);
  return res.json();
};

const createPostApi = async (data: {
  userId: string;
  title: string;
  body: string;
}) => {
  const res = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
};

export function CreatePost() {
  const [counter, setCounter] = useState(0);
  const counterAtMutate = useRef(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const userId = 1; // 숫자로 통일
  const queryClient = useQueryClient();

  // 항상 최신 counter 값을 ref에 동기화
  useEffect(() => {
    counterAtMutate.current = counter;
  }, [counter]);

  const {
    data: posts,
    isLoading,
    isPlaceholderData,
  } = useQuery({
    queryKey: ["posts", userId],
    queryFn: () => fetchPosts(userId),
    placeholderData: [
      {
        id: "placeholder",
        title: "플레이스홀더 포스트",
        body: "이것은 플레이스홀더 데이터입니다.",
        userId: String(userId),
      },
    ],
  });

  console.log("isTanStackPlaceholderData", isPlaceholderData);

  const mutation = useMutation({
    mutationFn: createPostApi,
    onSuccess: () => {
      setTitle("");
      setBody("");
      // 최신 렌더링 시점의 값
      console.log("counter 1 (클로저):", counter);
      // ref로 최신값
      console.log("counter 1 (ref):", counterAtMutate.current);
      queryClient.invalidateQueries({ queryKey: ["posts", userId] });
    },
  });

  useEffect(() => {
    console.log("counter 3:", counter);
  }, [counter]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    setCounter((prev) => prev + 1);
    counterAtMutate.current = counter; // mutate 호출 직전 값 저장
    mutation.mutate(
      { userId: String(userId), title, body },
      {
        onSuccess: () => {
          // mutate 옵션 onSuccess (클로저)
          // ref로 최신값
          console.log("counter 2 (클로저):", counter);
          console.log("counter 2 (ref):", counterAtMutate.current);
          setCounter((prev) => prev + 1);
        },
      }
    );
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px" }}>
      <h1>TanStack Mutation Test</h1>
      <Link href="/mutation-placeholder-test">
        mutation-placeholder-test 페이지로 이동
      </Link>
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
            disabled={mutation.isPending}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Body"
            disabled={mutation.isPending}
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
          disabled={mutation.isPending}
          style={{ padding: "10px 15px" }}
        >
          {mutation.isPending ? "Creating..." : "Create Post"}
        </button>
      </form>

      <h2>Posts for User {userId}</h2>
      {isLoading && <p>Loading posts...</p>}
      {Array.isArray(posts) && posts.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {posts.map((post: any) => (
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
              <button onClick={() => console.log("Delete", post.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
