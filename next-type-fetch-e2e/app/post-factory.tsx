import { createQueryFactory, createMutationFactory } from "next-type-fetch";
import { z } from "zod/v4";

const postSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  body: z.string(),
});

const postListSchema = z.array(postSchema);

export type PostList = z.infer<typeof postListSchema>;

export const postQueries = createQueryFactory({
  list: {
    cacheKey: (params: { userId: number }) => ["posts", String(params.userId)],
    url: (params: { userId: number }) => `/api/posts?userId=${params.userId}`,
    // schema: postListSchema,
  },
});

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
      // console.log("invalidateQueries", data);
      return [postQueries.list.cacheKey({ userId: Number(data.userId) })];
    },
  },
  deletePost: {
    method: "DELETE",
    url: (params: { id: string }) => `/api/posts/${params.id}`,
    responseSchema: postSchema,
    invalidateQueries: (data) => [
      postQueries.list.cacheKey({ userId: Number(data.userId) }),
    ],
  },
});
