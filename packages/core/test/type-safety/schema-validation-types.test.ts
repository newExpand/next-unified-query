/**
 * Schema Validation Type Tests
 * 
 * 이 파일은 Zod 스키마 통합과 타입 추론이 올바르게 동작하는지 검증합니다.
 * 런타임 검증과 컴파일 타임 타입이 일치하는지 확인합니다.
 * 
 * NOTE: 이 파일은 타입 검증만을 위한 것으로 실제로 실행되지 않습니다.
 */

import { z } from 'zod/v4';
import type { InferIfZodSchema } from '../../src/query/factories/mutation-factory';
import { expectType, type Expect, type Equal } from '../type-utils/expect-type';

// Type-only tests - not meant to be executed
namespace SchemaValidationTypeTests {
  // Test: InferIfZodSchema Type Helper
  export namespace InferIfZodSchemaTests {
    // 다양한 Zod 스키마 정의
    const stringSchema = z.string();
    const numberSchema = z.number();
    const booleanSchema = z.boolean();
    
    const objectSchema = z.object({
      id: z.number(),
      name: z.string(),
      active: z.boolean(),
      tags: z.array(z.string()),
      metadata: z.record(z.string(), z.unknown()).optional()
    });

    const arraySchema = z.array(objectSchema);
    
    const unionSchema = z.union([
      z.object({ type: z.literal('success'), data: z.string() }),
      z.object({ type: z.literal('error'), message: z.string() })
    ]);

    const enumSchema = z.enum(['admin', 'user', 'guest'] as const);

    // 타입 추론 검증
    type StringType = InferIfZodSchema<typeof stringSchema, never>;
    type NumberType = InferIfZodSchema<typeof numberSchema, never>;
    type BooleanType = InferIfZodSchema<typeof booleanSchema, never>;
    type ObjectType = InferIfZodSchema<typeof objectSchema, never>;
    type ArrayType = InferIfZodSchema<typeof arraySchema, never>;
    type UnionType = InferIfZodSchema<typeof unionSchema, never>;
    type EnumType = InferIfZodSchema<typeof enumSchema, never>;

    // ✅ 기본 타입 추론
    const _testString: Expect<Equal<StringType, string>> = true;
    const _testNumber: Expect<Equal<NumberType, number>> = true;
    const _testBoolean: Expect<Equal<BooleanType, boolean>> = true;
    
    // ✅ 객체 타입 추론
    const _testObject: Expect<Equal<ObjectType, {
      id: number;
      name: string;
      active: boolean;
      tags: string[];
      metadata?: Record<string, unknown>;
    }>> = true;

    // ✅ 배열 타입 추론
    const _testArray: Expect<Equal<ArrayType, {
      id: number;
      name: string;
      active: boolean;
      tags: string[];
      metadata?: Record<string, unknown>;
    }[]>> = true;

    // ✅ 유니온 타입 추론
    const _testUnion: Expect<Equal<UnionType, 
      | { type: 'success'; data: string }
      | { type: 'error'; message: string }
    >> = true;

    // ✅ Enum 타입 추론
    const _testEnum: Expect<Equal<EnumType, 'admin' | 'user' | 'guest'>> = true;
  }

  // Test: Non-Zod types with fallback
  export namespace FallbackTests {
    // Zod가 아닌 타입들
    type StringType = InferIfZodSchema<string, 'fallback'>;
    type NumberType = InferIfZodSchema<number, 'fallback'>;
    type CustomType = InferIfZodSchema<{ foo: string }, 'fallback'>;
    type NeverType = InferIfZodSchema<never, 'fallback'>;

    // ✅ Zod 스키마가 아니면 Fallback 타입 사용
    const _testString: Expect<Equal<StringType, 'fallback'>> = true;
    const _testNumber: Expect<Equal<NumberType, 'fallback'>> = true;
    const _testCustom: Expect<Equal<CustomType, 'fallback'>> = true;
    const _testNever: Expect<Equal<NeverType, 'fallback'>> = true;
  }

  // Test: Real-world API response schemas
  export namespace RealWorldSchemas {
    // 실제 API 응답 스키마
    const userSchema = z.object({
      id: z.number(),
      email: z.string().email(),
      profile: z.object({
        name: z.string(),
        bio: z.string().optional(),
        avatar: z.string().url().optional()
      }),
      permissions: z.array(z.enum(['read', 'write', 'delete'])),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime()
    });

    type User = z.infer<typeof userSchema>;

    // ✅ 올바른 데이터
    const validUser: User = {
      id: 1,
      email: 'user@example.com',
      profile: {
        name: 'John Doe',
        bio: 'Software Developer'
      },
      permissions: ['read', 'write'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    // ❌ 타입 에러들
    const invalidEmail: User = {
      ...validUser,
      // @ts-expect-error - email must be string
      email: 123
    };

    const invalidPermissions: User = {
      ...validUser,
      // @ts-expect-error - 'admin' is not a valid permission
      permissions: ['read', 'admin']
    };

    const missingName: User = {
      ...validUser,
      // @ts-expect-error - profile.name is required
      profile: {
        bio: 'Developer'
      }
    };
  }

  // Test: Nested and complex schemas
  export namespace ComplexSchemas {
    // 페이지네이션 응답 스키마
    const paginationSchema = <T extends z.ZodType>(itemSchema: T) => 
      z.object({
        items: z.array(itemSchema),
        meta: z.object({
          total: z.number(),
          page: z.number(),
          pageSize: z.number(),
          totalPages: z.number()
        }),
        links: z.object({
          first: z.string().url().optional(),
          prev: z.string().url().optional(),
          next: z.string().url().optional(),
          last: z.string().url().optional()
        })
      });

    // 제품 스키마
    const productSchema = z.object({
      id: z.string().uuid(),
      name: z.string(),
      price: z.number().positive(),
      inStock: z.boolean()
    });

    // 페이지네이션된 제품 응답
    const paginatedProductSchema = paginationSchema(productSchema);
    type PaginatedProducts = z.infer<typeof paginatedProductSchema>;

    // 타입이 올바르게 추론됨
    const response: PaginatedProducts = {
      items: [
        { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Product 1', price: 99.99, inStock: true }
      ],
      meta: {
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10
      },
      links: {
        next: 'https://api.example.com/products?page=2'
      }
    };

    // 중첩된 타입도 올바르게 체크됨
    expectType<string>(response.items[0].id);
    expectType<number>(response.meta.total);
    expectType<string | undefined>(response.links.prev);
  }

  // Test: Transform and refine operations
  export namespace TransformRefineTests {
    // Transform을 사용한 스키마
    const dateSchema = z.string().transform(str => new Date(str));
    const upperCaseSchema = z.string().transform(str => str.toUpperCase());
    
    // Refine을 사용한 스키마
    const positiveNumberSchema = z.number().refine(n => n > 0, {
      message: "Number must be positive"
    });

    const passwordSchema = z.string()
      .min(8)
      .refine(password => /[A-Z]/.test(password), {
        message: "Password must contain at least one uppercase letter"
      })
      .refine(password => /[0-9]/.test(password), {
        message: "Password must contain at least one number"
      });

    // Transform 후 타입이 변경됨
    type DateType = z.infer<typeof dateSchema>;
    type UpperCaseType = z.infer<typeof upperCaseSchema>;
    
    // ✅ Transform 결과 타입
    const _testDate: Expect<Equal<DateType, Date>> = true;
    const _testUpperCase: Expect<Equal<UpperCaseType, string>> = true;

    // Refine은 타입을 변경하지 않음
    type PositiveNumberType = z.infer<typeof positiveNumberSchema>;
    type PasswordType = z.infer<typeof passwordSchema>;
    
    // ✅ Refine은 원본 타입 유지
    const _testPositiveNumber: Expect<Equal<PositiveNumberType, number>> = true;
    const _testPassword: Expect<Equal<PasswordType, string>> = true;
  }

  // Test: Request/Response validation integration
  export namespace RequestResponseValidation {
    // 요청 스키마
    const createPostSchema = z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(10),
      tags: z.array(z.string()).optional(),
      published: z.boolean().default(false)
    });

    // 응답 스키마
    const postResponseSchema = createPostSchema.extend({
      id: z.string().uuid(),
      author: z.object({
        id: z.string(),
        name: z.string()
      }),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      viewCount: z.number().default(0)
    });

    type CreatePostData = z.infer<typeof createPostSchema>;
    type PostResponse = z.infer<typeof postResponseSchema>;

    // 요청 데이터 타입 체크
    const requestData: CreatePostData = {
      title: 'My Post',
      content: 'This is a great post about TypeScript',
      tags: ['typescript', 'type-safety'],
      published: true
    };

    // 응답 데이터는 추가 필드를 포함
    const responseData: PostResponse = {
      ...requestData,
      id: '123e4567-e89b-12d3-a456-426614174000',
      author: {
        id: 'user123',
        name: 'John Doe'
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      viewCount: 0
    };

    // 타입이 올바르게 확장됨
    expectType<string>(responseData.title);
    expectType<string>(responseData.id);
    expectType<{ id: string; name: string }>(responseData.author);
  }

  // Test: Optional and nullable types
  export namespace OptionalNullableTypes {
    const schemaWithOptionals = z.object({
      required: z.string(),
      optional: z.string().optional(),
      nullable: z.string().nullable(),
      optionalNullable: z.string().optional().nullable(),
      withDefault: z.string().default('default value')
    });

    type SchemaType = z.infer<typeof schemaWithOptionals>;

    // 타입 검증
    type RequiredType = SchemaType['required'];
    type OptionalType = SchemaType['optional'];
    type NullableType = SchemaType['nullable'];
    type OptionalNullableType = SchemaType['optionalNullable'];
    type WithDefaultType = SchemaType['withDefault'];

    // ✅ 올바른 타입 추론
    const _testRequired: Expect<Equal<RequiredType, string>> = true;
    const _testOptional: Expect<Equal<OptionalType, string | undefined>> = true;
    const _testNullable: Expect<Equal<NullableType, string | null>> = true;
    const _testOptionalNullable: Expect<Equal<OptionalNullableType, string | null | undefined>> = true;
    const _testWithDefault: Expect<Equal<WithDefaultType, string>> = true;
  }

  // Test: Recursive schemas
  export namespace RecursiveSchemas {
    // 재귀적 스키마 (트리 구조)
    type TreeNode = {
      id: string;
      value: string;
      children?: TreeNode[];
    };

    const treeNodeSchema: z.ZodType<TreeNode> = z.object({
      id: z.string(),
      value: z.string(),
      children: z.lazy(() => z.array(treeNodeSchema).optional())
    });

    type InferredTreeNode = z.infer<typeof treeNodeSchema>;

    // 재귀적 타입이 올바르게 추론됨
    const tree: InferredTreeNode = {
      id: '1',
      value: 'root',
      children: [
        {
          id: '2',
          value: 'child1',
          children: [
            { id: '3', value: 'grandchild' }
          ]
        }
      ]
    };

    expectType<string>(tree.id);
    expectType<InferredTreeNode[] | undefined>(tree.children);
    expectType<string>(tree.children?.[0]?.children?.[0]?.value!);
  }
}