 # next-type-fetch

Next.js에서 fetch와 axios의 장점을 결합한 타입 안전 HTTP 클라이언트입니다.

## 특징

- TypeScript로 작성된 완전한 타입 안전성
- Next.js App Router와 완벽하게 호환
- Axios와 유사한 친숙한 API
- 인터셉터 지원 (요청, 응답, 에러)
- Zod를 이용한 응답 데이터 유효성 검증
- 요청 취소 기능
- 자동 재시도 기능
- 다양한 응답 타입 지원 (JSON, Text, Blob, ArrayBuffer, Raw)
- 타임아웃 설정
- 기본 URL 설정

## 설치

```bash
npm install next-type-fetch
# 또는
yarn add next-type-fetch
# 또는
pnpm add next-type-fetch
```

## 기본 사용법

```typescript
import { createFetch } from 'next-type-fetch';

// fetch 인스턴스 생성
const fetch = createFetch({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// GET 요청
const getUsers = async () => {
  const response = await fetch.get('/users');
  return response.data; // 타입 안전한 응답 데이터
};

// POST 요청
const createUser = async (userData) => {
  const response = await fetch.post('/users', userData);
  return response.data;
};

// 인터셉터 사용
fetch.interceptors.request.use((config) => {
  // 요청 전에 설정 수정
  config.headers = {
    ...config.headers,
    'Authorization': `Bearer ${getToken()}`
  };
  return config;
});

fetch.interceptors.response.use((response) => {
  // 응답 데이터 처리
  return response;
});

fetch.interceptors.error.use((error) => {
  // 에러 처리
  console.error('API 에러:', error);
  return Promise.reject(error);
});
```

## Zod를 이용한 데이터 유효성 검증

```typescript
import { z } from 'zod';
import { createFetch } from 'next-type-fetch';

const fetch = createFetch();

// 사용자 스키마 정의
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

// 스키마를 이용한 요청
const getUser = async (id: number) => {
  const response = await fetch.get(`/users/${id}`, {
    schema: UserSchema
  });
  
  // response.data는 자동으로 UserSchema 타입으로 추론
  return response.data;
};
```

## Next.js App Router와의 통합

```typescript
// app/users/page.tsx
import { createFetch } from 'next-type-fetch';

const fetch = createFetch({
  baseURL: 'https://api.example.com'
});

export default async function UsersPage() {
  // Next.js의 자동 캐싱, 재검증 활용
  const response = await fetch.get('/users', {
    next: {
      revalidate: 60, // 60초마다 재검증
      tags: ['users'] // 태그 기반 재검증
    }
  });
  
  const users = response.data;
  
  return (
    <div>
      <h1>사용자 목록</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 요청 취소하기

```typescript
import { createFetch } from 'next-type-fetch';

const fetch = createFetch();

const fetchData = async () => {
  // 취소 가능한 프로미스 반환
  const promise = fetch.get('/data');
  
  // 취소 메서드 사용
  setTimeout(() => {
    if (someCondition) {
      promise.cancel();
    }
  }, 1000);
  
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    if (error.code === 'CANCELED') {
      console.log('요청이 취소되었습니다');
    }
    throw error;
  }
};
```

## API 참조

### createFetch(config)

fetch 클라이언트 인스턴스를 생성합니다.

```typescript
const fetch = createFetch({
  baseURL: string,          // 기본 URL
  timeout: number,          // 요청 타임아웃(ms)
  headers: object,          // 기본 헤더
  params: object,           // 기본 쿼리 파라미터
  retry: number | object,   // 자동 재시도 설정
  responseType: enum,       // 응답 타입 (json, text, blob 등)
  contentType: enum,        // 요청 컨텐츠 타입
  schema: z.ZodType,        // 응답 데이터 검증 스키마
  next: object              // Next.js 설정 (revalidate, tags 등)
});
```

### 요청 메서드

- `fetch.request(config)`: 기본 요청 메서드
- `fetch.get(url, config)`: GET 요청
- `fetch.post(url, data, config)`: POST 요청
- `fetch.put(url, data, config)`: PUT 요청
- `fetch.patch(url, data, config)`: PATCH 요청
- `fetch.delete(url, config)`: DELETE 요청
- `fetch.head(url, config)`: HEAD 요청
- `fetch.options(url, config)`: OPTIONS 요청

### 인터셉터

- `fetch.interceptors.request.use(interceptor)`: 요청 인터셉터 추가
- `fetch.interceptors.response.use(interceptor)`: 응답 인터셉터 추가
- `fetch.interceptors.error.use(interceptor)`: 에러 인터셉터 추가

## 라이선스

MIT