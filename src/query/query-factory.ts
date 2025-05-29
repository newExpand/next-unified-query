import type { z, ZodType } from "zod";

export type QueryConfig<
  Params,
  Schema extends ZodType<any, any, any> | undefined = undefined
> = {
  key: (params: Params) => readonly unknown[];
  url: (params: Params) => string;
  schema?: Schema;
  placeholderData?: Schema extends ZodType<any, any, any>
    ? z.infer<Schema>
    :
        | any
        | ((
            prev?: Schema extends ZodType<any, any, any> ? z.infer<Schema> : any
          ) => Schema extends ZodType<any, any, any> ? z.infer<Schema> : any);
  fetchConfig?: Record<string, any>;
  select?: (
    data: Schema extends ZodType<any, any, any> ? z.infer<Schema> : any
  ) => any;
  enabled?: boolean | ((params: Params) => boolean);
};

export type QueryFactoryInput = Record<
  string,
  QueryConfig<any, ZodType<any, any, any> | undefined>
>;

export type ExtractParams<T> = T extends QueryConfig<infer P, any> ? P : never;
export type ExtractData<T> = T extends QueryConfig<any, infer S>
  ? S extends ZodType<any, any, any>
    ? z.infer<S>
    : unknown
  : never;

export function createQueryFactory<T extends QueryFactoryInput>(defs: T): T {
  return defs;
}
