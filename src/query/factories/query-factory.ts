import type { z, ZodType } from "zod/v4";
import { FetchConfig } from "../../types";

export type QueryConfig<Params = void, Schema extends ZodType = ZodType> = {
  cacheKey: (params?: Params) => readonly unknown[];
  url: (params?: Params) => string;
  schema?: Schema;
  placeholderData?:
    | any
    | ((
        prev?: any,
        prevQuery?: import("../cache/query-cache").QueryState<any>
      ) => any);
  fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data">;
  select?: (data: any) => any;
  enabled?: boolean | ((params?: Params) => boolean);
};

export type QueryFactoryInput = Record<string, QueryConfig<any, any>>;

export type ExtractParams<T> = T extends QueryConfig<infer P, any> ? P : never;

export function createQueryFactory<T extends QueryFactoryInput>(defs: T): T {
  return defs;
}
