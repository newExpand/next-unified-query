# next-type-fetch

Next.js App Router 환경에서 사용할 수 있는 타입 안전한 Fetch 클라이언트 라이브러리입니다. Zod를 통한 유효성 검증, 인터셉터, 타임아웃, 자동 재시도, 요청 취소 등 다양한 기능을 제공합니다.

## 특징

- **타입 안전성**: TypeScript와 Zod 스키마를 통한 완벽한 타입 안전성
- **인터셉터**: 요청과 응답에 대한 인터셉터 지원
- **에러 처리**: 일관된 에러 형식과 쉬운 처리 방법 제공
- **요청 설정**: 타임아웃, 헤더, 파라미터 등 다양한 설정 옵션
- **재시도 기능**: 네트워크 오류시 자동 재시도 기능
- **Next.js 친화적**: Next.js App Router와 완벽 호환, Next.js 15 캐싱 전략 지원
- **요청 취소**: 간편한 요청 취소 기능 지원
- **다양한 컨텐츠 타입**: JSON, 폼 데이터, XML, HTML, 텍스트, 바이너리 데이터 등 다양한 컨텐츠 타입 지원
- **응답 타입 지정**: JSON, 텍스트, Blob, ArrayBuffer 등 다양한 응답 타입 지원
- **경량 설계**: 불필요한 의존성 없이 가볍고 빠른 동작

## 설치

```bash
npm install next-type-fetch
```

## 기본 사용법

### 클라이언트 생성

```typescript
import { createFetch } from 'next-type-fetch';

// 기본 설정으로 클라이언트 생성
const api = createFetch({
  baseURL: 'https://api.example.com',
  timeout: 5000, // 5초 타임아웃
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

### 기본 요청

```typescript
// GET 요청
const { data, error, status } = await api.get('/users');

// POST 요청
const { data, error } = await api.post('/users', { name: 'John Doe', email: 'john@example.com' });

// PUT 요청
const { data, error } = await api.put('/users/1', { name: 'Updated Name' });

// DELETE 요청
const { data, error } = await api.delete('/users/1');

// PATCH 요청
const { data, error } = await api.patch('/users/1', { name: 'Patched Name' });
```

### Zod를 통한 응답 검증

```typescript
import { z } from 'zod';

// 응답 스키마 정의
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

// 스키마와 함께 요청 - 자동으로 타입 검증
const { data, error } = await api.get('/users/1', { schema: userSchema });

// 타입 추론이 가능합니다
if (data) {
  console.log(data.name); // 타입: string
  console.log(data.email); // 타입: string
}
```

### 에러 처리

```typescript
const { data, error, status } = await api.get('/users/1');

if (error) {
  console.error(`에러 발생: ${error.message}`);
  console.error(`HTTP 상태코드: ${status}`);
  
  // Zod 검증 에러인 경우
  if (error.validation) {
    console.error('유효성 검증 실패:', error.validation.errors);
  }
  
  // 원본 에러 데이터
  console.error('원본 에러:', error.raw);
} else {
  // 성공적인 응답 처리
  console.log('사용자 데이터:', data);
}
```

### 인터셉터 사용

```typescript
// 요청 인터셉터 - 모든 요청에 적용
api.interceptors.request.use((config) => {
  // 인증 토큰 추가
  config.headers = config.headers || {};
  config.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
  return config;
});

// 응답 인터셉터 - 모든 응답에 적용
api.interceptors.response.use(
  // 응답 성공 처리
  (response) => {
    // 모든 응답에서 data 필드만 추출
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    return response;
  },
  // 응답 에러 처리
  (error) => {
    // 로그아웃이 필요한 에러 발생 시 처리
    if (error?.status === 401) {
      // 로그아웃 처리
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 인터셉터 제거
const interceptorId = api.interceptors.request.use(/*...*/);
api.interceptors.request.eject(interceptorId);
```

### 자동 재시도

네트워크 문제 등으로 요청 실패 시 자동으로 재시도합니다.

```typescript
// 최대 3번 재시도하는 요청
const { data, error } = await api.get('/unstable-endpoint', { 
  retry: 3 
});
```

### 요청 취소

요청을 취소하는 두 가지 방법을 제공합니다:

```typescript
// 1. 직접 cancel 메서드 사용
const request = api.get('/data');
request.cancel(); // 요청 취소

// 취소 여부 확인
if (request.isCanceled()) {
  console.log('요청이 취소되었습니다');
}

// 취소된 요청의 결과 처리
const { data, error } = await request;
if (error) {
  console.log('취소 에러:', error.message); // "Request was canceled" 출력
}

// 2. AbortController 사용
const controller = new AbortController();
const request = api.get('/data', { signal: controller.signal });

// 나중에 요청 취소
controller.abort();

// 여러 요청에 동일한 controller 사용 가능
const requests = [
  api.get('/data1', { signal: controller.signal }),
  api.get('/data2', { signal: controller.signal }),
  api.get('/data3', { signal: controller.signal })
];

// 모든 요청 한 번에 취소
controller.abort();
```

## 고급 사용법

### 다양한 컨텐츠 타입

다양한 컨텐츠 타입으로 요청을 보낼 수 있습니다:

```typescript
import { ContentType } from 'next-type-fetch';

// JSON 데이터 전송 (기본값)
await api.post('/users', { name: 'John', age: 30 }, {
  contentType: ContentType.JSON
});

// URL 인코딩된 폼 데이터
await api.post('/login', { username: 'john', password: 'pass123' }, {
  contentType: ContentType.FORM
});

// 일반 텍스트
await api.post('/text-endpoint', 'Hello, World!', {
  contentType: ContentType.TEXT
});

// XML 문서
const xmlData = '<user><name>John</name><age>30</age></user>';
await api.post('/xml-api', xmlData, {
  contentType: ContentType.XML
});

// HTML 문서
const htmlData = '<div>Hello, World!</div>';
await api.post('/html-endpoint', htmlData, {
  contentType: ContentType.HTML
});

// 멀티파트 폼 데이터 (파일 업로드)
const formData = new FormData();
formData.append('username', 'john');
formData.append('avatar', fileBlob, 'avatar.png');
await api.post('/upload', formData, {
  contentType: ContentType.MULTIPART
});

// 바이너리 데이터
await api.post('/binary-endpoint', binaryData, {
  contentType: ContentType.BLOB
});
```

### 응답 타입 지정

다양한 응답 타입을 처리할 수 있습니다:

```typescript
import { ResponseType } from 'next-type-fetch';

// JSON 응답 (기본값)
const { data } = await api.get('/users/1', {
  responseType: ResponseType.JSON
});
// data는 파싱된 JavaScript 객체

// 텍스트 응답
const { data } = await api.get('/text-endpoint', {
  responseType: ResponseType.TEXT
});
// data는 문자열

// Blob 응답 (이미지, 파일 등)
const { data } = await api.get('/image.jpg', {
  responseType: ResponseType.BLOB
});
// data는 Blob 객체
// 예: URL.createObjectURL(data)로 이미지 표시 가능

// ArrayBuffer 응답 (바이너리 데이터)
const { data } = await api.get('/binary-data', {
  responseType: ResponseType.ARRAY_BUFFER
});
// data는 ArrayBuffer 객체

// 원시 Response 객체
const { data } = await api.get('/raw-response', {
  responseType: ResponseType.RAW
});
// data는 Response 객체
// 예: 직접 처리 가능: await data.json(), await data.text() 등
```

### Next.js 15 캐싱 전략 활용

Next.js 15부터 변경된 캐싱 전략을 활용한 요청 예시:

```typescript
// 요청 캐시하기 (안정적인 데이터)
const { data } = await api.get('/users', { 
  cache: 'force-cache' // 요청을 캐시합니다
});

// 시간 기반 재검증 사용
const { data } = await api.get('/data', { 
  next: { 
    revalidate: 60 // 60초마다 재검증
  }
});

// 태그 기반 재검증 사용
const { data } = await api.get('/products', { 
  next: { 
    tags: ['products'] 
  }
});

// 캐시하지 않음 (최신 데이터가 필요한 경우)
const { data } = await api.get('/latest-data', { 
  cache: 'no-store'
});
```

### 직접 request 메서드 사용

더 복잡한 요청이 필요할 때 직접 `request` 메서드를 사용할 수 있습니다:

```typescript
const { data, error } = await api.request({
  url: '/custom-endpoint',
  method: 'POST',
  data: { custom: 'data' },
  headers: { 'X-Custom-Header': 'value' },
  timeout: 10000,
  retry: 2,
  next: { revalidate: 60 },
  schema: mySchema
});
```

### Next.js 서버 컴포넌트에서 사용

서버 컴포넌트에서도 손쉽게 사용할 수 있습니다:

```typescript
// app/users/page.tsx
import { createFetch } from 'next-type-fetch';
import { z } from 'zod';

const userListSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  })
);

export default async function UsersPage() {
  const api = createFetch({
    baseURL: process.env.API_URL,
  });
  
  const { data, error } = await api.get('/users', { 
    schema: userListSchema,
    // Next.js에 적합한 캐시 설정
    cache: 'no-store', // 또는 'force-cache'
  });
  
  if (error) {
    return <div>Error loading users: {error.message}</div>;
  }
  
  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name} ({user.email})</li>
      ))}
    </ul>
  );
}
```

### 클라이언트 컴포넌트에서 요청 취소 활용

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createFetch } from 'next-type-fetch';

export default function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const api = createFetch({ baseURL: '/api' });
  
  useEffect(() => {
    // 이전 요청이 완료되기 전에 새 검색어가 입력되면
    // 이전 요청을 취소하기 위한 AbortController
    const controller = new AbortController();
    
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        return;
      }
      
      try {
        const { data } = await api.get('/search', {
          params: { q: query },
          signal: controller.signal
        });
        
        setResults(data);
      } catch (error) {
        // 취소된 요청은 무시
        if (error.message !== 'Request was canceled') {
          console.error('검색 오류:', error);
        }
      }
    };
    
    fetchResults();
    
    // 컴포넌트가 언마운트되거나 query가 변경될 때 요청 취소
    return () => controller.abort();
  }, [query]);
  
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="검색어 입력..."
      />
      <ul>
        {results.map((result) => (
          <li key={result.id}>{result.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## API 레퍼런스

### 주요 타입

```typescript
// 기본 설정 인터페이스
interface FetchConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  retry?: number;
  schema?: z.ZodType<unknown>;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  signal?: AbortSignal;
  contentType?: ContentType | string;
  responseType?: ResponseType;
}

// 응답 형식
type ZodResponse<T> =
  | {
      data: T;
      error: null;
      status: number;
      headers: Headers;
    }
  | {
      data: null;
      error: {
        message: string;
        status?: number;
        validation?: z.ZodError;
        raw?: unknown;
      };
      status?: number;
      headers?: Headers;
    };

// 컨텐츠 타입 옵션
enum ContentType {
  JSON = "application/json",
  FORM = "application/x-www-form-urlencoded",
  TEXT = "text/plain",
  BLOB = "application/octet-stream",
  MULTIPART = "multipart/form-data",
  XML = "application/xml",
  HTML = "text/html"
}

// 응답 타입 옵션
enum ResponseType {
  JSON = "json",
  TEXT = "text",
  BLOB = "blob",
  ARRAY_BUFFER = "arraybuffer",
  RAW = "raw"
}
```

### 메서드

```typescript
// 인스턴스 생성
createFetch(config?: FetchConfig): NextTypeFetch

// 요청 메서드
get<T>(url: string, config?: FetchConfig): CancelableRequest<T>
post<T>(url: string, data?: unknown, config?: FetchConfig): CancelableRequest<T>
put<T>(url: string, data?: unknown, config?: FetchConfig): CancelableRequest<T>
delete<T>(url: string, config?: FetchConfig): CancelableRequest<T>
patch<T>(url: string, data?: unknown, config?: FetchConfig): CancelableRequest<T>
request<T>(config: RequestConfig): CancelableRequest<T>
```

### 인터셉터

```typescript
// 요청 인터셉터
interceptors.request.use(
  (config: RequestConfig) => Promise<RequestConfig> | RequestConfig
): number

// 응답 인터셉터
interceptors.response.use(
  onFulfilled?: (response: unknown) => Promise<unknown> | unknown,
  onRejected?: (error: unknown) => Promise<unknown> | unknown
): number

// 인터셉터 제거
interceptors.request.eject(id: number): void
interceptors.response.eject(id: number): void
```

## 주요 기능 상세 설명

### 요청 취소 기능

```typescript
// CancelableRequest는 Promise를 확장한 인터페이스입니다
interface CancelableRequest<T> extends Promise<ZodResponse<T>> {
  cancel: () => void;       // 요청 취소 메서드
  isCanceled: () => boolean; // 취소 여부 확인
}

// 직접 취소
const request = api.get('/users');
request.cancel();

// 외부 AbortController로 취소
const controller = new AbortController();
const request = api.get('/users', { signal: controller.signal });
controller.abort(); // 요청 취소
```

### 타임아웃 설정

요청이 지정된 시간 내에 완료되지 않으면 자동으로 취소됩니다.

```typescript
// 3초 타임아웃 설정
const { data, error } = await api.get('/slow-endpoint', { 
  timeout: 3000 
});

// 타임아웃 에러 처리
if (error && error.message === 'Request timed out') {
  console.error('요청 시간 초과');
}
```

### 재시도 기능

네트워크 오류 발생 시 자동으로 요청을 재시도합니다. 지수 백오프 방식으로 재시도 간격이 점점 증가합니다.

```typescript
// 최대 3번까지 재시도
const { data, error } = await api.get('/unstable-endpoint', { 
  retry: 3 
});
```

## 라이선스

MIT
