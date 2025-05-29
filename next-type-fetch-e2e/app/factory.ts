import { createQueryFactory } from "next-type-fetch";
import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  timestamp: z.number(),
});

export const userQueries = createQueryFactory({
  detail: {
    key: (params: { id: number }) => ["user", params.id],
    url: (params: { id: number }) => `/api/user/${params.id}`,
    schema: userSchema,
    placeholderData: { name: "로딩", timestamp: 0 },
    select: (data) => ({ ...data, upperName: data.name.toUpperCase() }),
    fetchConfig: { timeout: 1000 },
    enabled: (params) => params.id > 0,
  },
});
