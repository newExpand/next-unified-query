import { createQueryFactory } from "next-type-fetch";
import { z } from "zod";

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

export const userQueries = createQueryFactory({
  detail: {
    key: (params: { id: number }) => ["user", String(params.id)],
    url: (params: { id: number }) => `/api/user/${params.id}`,
    schema: userSchema,
    placeholderData: { name: "로딩", timestamp: 0 },
    select: (data) => ({ ...data, upperName: data.name.toUpperCase() }),
    fetchConfig: { timeout: 1000 },
    enabled: (params) => params.id > 0,
  },
});

export const postQueries = createQueryFactory({
  list: {
    key: (params: { userId: number }) => ["posts", String(params.userId)],
    url: (params: { userId: number }) => `/api/posts?userId=${params.userId}`,
    schema: z.array(postSchema),
  },
});
