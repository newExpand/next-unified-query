import type { z, ZodTypeAny } from "zod";

export type QueryConfig<
  Params = any,
  Schema extends ZodTypeAny = ZodTypeAny
> = {
  key: (params: Params) => readonly unknown[];
  url: (params: Params) => string;
  schema?: Schema;
  placeholderData?:
    | z.infer<Schema>
    | any
    | ((prev?: z.infer<Schema>) => z.infer<Schema>);
  fetchConfig?: Record<string, any>;
  select?: (data: z.infer<Schema>) => any;
  enabled?: boolean | ((params: Params) => boolean);
};

export type QueryFactoryInput = Record<string, QueryConfig<any, any>>;

export type ExtractParams<T> = T extends QueryConfig<infer P, any> ? P : never;
export type ExtractData<T> = T extends QueryConfig<any, infer S>
  ? S extends ZodTypeAny
    ? z.infer<S>
    : unknown
  : never;

export function createQueryFactory<T extends QueryFactoryInput>(defs: T): T {
  return defs;
}
