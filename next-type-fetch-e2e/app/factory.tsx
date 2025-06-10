import { createQueryFactory, createMutationFactory } from "next-type-fetch";
import { z } from "zod/v4";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  timestamp: z.number(),
});

const postSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  body: z.string(),
});

const postListSchema = z.array(postSchema);

export type PostList = z.infer<typeof postListSchema>;

export const userQueries = createQueryFactory({
  detail: {
    key: (params: { userId: number }) => ["user", String(params.userId)],
    url: (params: { userId: number }) => `/api/user/${params.userId}`,

    // fetchConfig: {
    //   baseURL: "http://localhost:3001",
    // },

    // schema: userSchema,
    // placeholderData: { name: "로딩", timestamp: 0 },
    // select: (data) => ({ ...data, upperName: data.name.toUpperCase() }),
    // fetchConfig: { timeout: 1000 },
    // enabled: (params) => params.id > 0,
  },
});

export const postQueries = createQueryFactory({
  list: {
    key: (params: { userId: number }) => ["posts", String(params.userId)],
    url: (params: { userId: number }) => `/api/posts?userId=${params.userId}`,
    schema: postListSchema,

    // placeholderData: (prev) => {
    //   if (Array.isArray(prev)) {
    //     return prev.map((post) => (
    //       <div key={post.id} style={{ backgroundColor: "red" }}>
    //         {post.title}
    //       </div>
    //     ));
    //   }
    //   return [];
    // },
    // fetchConfig: {
    //   baseURL: "http://localhost:3001",
    // },
    // schema: z.array(postSchema),
  },
} as const);

export const postMutations = createMutationFactory({
  createPost: {
    method: "POST",
    url: "/api/posts",
    requestSchema: z.object({
      userId: z.string(),
      title: z.string(),
      body: z.string(),
    }),
    responseSchema: postSchema,
    invalidateQueries: (data) => {
      console.log("invalidateQueries", data);
      return [postQueries.list.key({ userId: Number(data.userId) })];
    },
  },
  deletePost: {
    method: "DELETE",
    url: (params: { id: string }) => `/api/posts/${params.id}`,
    responseSchema: postSchema,
    invalidateQueries: (data) => [
      postQueries.list.key({ userId: Number(data.userId) }),
    ],
  },
});
