import type { z, ZodType } from "zod/v4";
import { FetchConfig } from "../types";

export type QueryConfig<Params = void, Schema extends ZodType = ZodType> = {
  key: (params?: Params) => readonly unknown[];
  url: (params?: Params) => string;
  schema?: Schema;
  placeholderData?:
    | z.infer<Schema>
    | any
    | ((prev?: z.infer<Schema>) => z.infer<Schema>);
  fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data">;
  select?: (data: z.infer<Schema>) => any;
  enabled?: boolean | ((params?: Params) => boolean);
};

export type QueryFactoryInput = Record<string, QueryConfig<any, any>>;

export type ExtractParams<T> = T extends QueryConfig<infer P, any> ? P : never;
export type ExtractData<T> = T extends QueryConfig<any, infer S>
  ? S extends ZodType
    ? z.infer<S>
    : unknown
  : unknown;

export function createQueryFactory<T extends QueryFactoryInput>(defs: T): T {
  return defs;
}
