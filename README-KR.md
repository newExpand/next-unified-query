# next-type-fetch

Next.js에서 fetch와 axios의 장점을 결합한 타입 안전 HTTP 클라이언트입니다.

[English Documentation](https://github.com/newExpand/next-type-fetch/blob/main/README.md)

[변경 이력 (CHANGELOG)](https://github.com/newExpand/next-type-fetch/blob/main/CHANGELOG-KR.md)

## 특징

- TypeScript로 작성된 완전한 타입 안전성
- Next.js App Router와 완벽하게 호환
- Axios와 유사한 친숙한 API
- 인터셉터 지원 (요청, 응답, 에러)
- Zod를 이용한 응답 데이터 유효성 검증
- 요청 취소 기능
- 자동 재시도 기능
- 401 인증 오류 자동 재시도(authRetry 옵션)
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
  
  // 예시 1: 타임아웃 기반 취소
  const timeoutId = setTimeout(() => {
    console.log('요청 시간이 너무 오래 걸려 취소합니다');
    promise.cancel();
  }, 5000); // 5초 후 취소
  
  try {
    const response = await promise;
    // 성공 시 타임아웃 취소
    clearTimeout(timeoutId);
    return response.data;
  } catch (error) {
    if (error.code === 'CANCELED') {
      console.log('요청이 취소되었습니다');
      // 취소 처리 로직
      return { canceled: true };
    }
    throw error;
  }
};

// 예시 2: 사용자 인터랙션에 의한 취소
const searchUsers = async (searchTerm) => {
  // 이전 요청이 있다면 취소
  if (previousRequest) {
    previousRequest.cancel();
  }
  
  // 새 요청 저장
  const request = fetch.get(`/users/search?q=${searchTerm}`);
  previousRequest = request;
  
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    if (error.code === 'CANCELED') {
      // 취소된 요청은 무시
      return null;
    }
    throw error;
  }
};

// 예시 3: AbortController 사용
const fetchWithExternalCancel = async () => {
  const controller = new AbortController();
  
  // 외부 취소 버튼에 이벤트 리스너 연결
  document.getElementById('cancelButton').addEventListener('click', () => {
    controller.abort();
  });
  
  try {
    const response = await fetch.get('/long-operation', {
      signal: controller.signal
    });
    return response.data;
  } catch (error) {
    if (error.code === 'CANCELED') {
      console.log('사용자가 요청을 취소했습니다');
    }
    throw error;
  }
};
```

## 401 인증 오류 자동 재시도 (authRetry 옵션)

실제 서비스에서는 access token이 만료되면 refresh token을 이용해 access token을 재발급받는 방식이 일반적입니다. 아래 예시는 refresh token 기반 인증 플로우를 반영합니다.

```typescript
import { createFetch } from 'next-type-fetch';

let accessToken = '만료된-access-token';
let refreshToken = '유효한-refresh-token';

const fetch = createFetch({
  baseURL: 'https://api.example.com',
  authRetry: {
    limit: 2, // 최대 재시도 횟수 (기본값: 1)
    // statusCodes: [401, 419, 440], // (선택) 커스텀 상태코드도 재시도 가능
    // shouldRetry: (error, config) => true, // (선택) 커스텀 재시도 조건
    handler: async (error, config) => {
      // refresh token으로 access token 재발급 시도
      const newToken = await tryRefreshToken(refreshToken);
      if (newToken) {
        accessToken = newToken;
        return true; // 재시도 허용
      }
      // refresh token도 만료된 경우
      return false; // 재시도 중단
    },
  },
});

fetch.interceptors.request.use((config) => ({
  ...config,
  headers: {
    ...config.headers,
    'Authorization': `Bearer ${accessToken}`,
  },
}));
```
- access token이 만료되어 401 발생 시 handler가 호출되고,
  refresh token으로 access token을 재발급받아 성공하면 재시도,
  refresh token도 만료되면 재시도 없이 실패합니다.
- `statusCodes` 옵션을 사용하면 재시도할 HTTP 상태코드를 직접 지정할 수 있습니다(예: `[401, 419, 440]`).
- `shouldRetry` 옵션을 사용하면 커스텀 조건(예: 에러 메시지에 'Token expired' 포함 시만 재시도)도 가능합니다.

### 고급 authRetry 예시

```typescript
const fetch = createFetch({
  baseURL: 'https://api.example.com',
  authRetry: {
    limit: 2,
    statusCodes: [401, 401004, 419], // 여러 개 또는 커스텀 상태코드 재시도
    shouldRetry: (error, config) => {
      // 에러 메시지에 'Token expired'가 포함된 경우만 재시도
      return error.message.includes('Token expired');
    },
    handler: async (error, config) => {
      // 커스텀 토큰 갱신 로직
      // ...
      return true;
    },
  },
});
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
  next: object,             // Next.js 설정 (revalidate, tags 등)
  authRetry: {             // 401 인증 오류 자동 재시도 옵션
    limit?: number;        // 최대 재시도 횟수 (기본값: 1)
    handler: (error, config) => Promise<boolean>; // 토큰 갱신 로직
  }
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

## 기본 인스턴스 사용법

인스턴스를 생성하지 않고 Axios처럼 바로 사용할 수 있습니다.

```typescript
// 기본 인스턴스 사용
import { get, post, put, patch, del, head, options, request } from 'next-type-fetch';

// GET 요청
const getUsers = async () => {
  const response = await get('/users');
  return response.data;
};

// POST 요청
const createUser = async (userData) => {
  const response = await post('/users', userData);
  return response.data;
};

// 기본 설정 변경
import { ntFetch } from 'next-type-fetch';

ntFetch.baseURL = 'https://api.example.com';
ntFetch.timeout = 5000;
ntFetch.headers = {
  'Content-Type': 'application/json',
};

// 전역 인터셉터 설정
import { interceptors } from 'next-type-fetch';

interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    'Authorization': `Bearer ${getToken()}`
  };
  return config;
});

// 기본 인스턴스 자체 사용 (모든 메서드 접근 가능)
import fetch from 'next-type-fetch';

const response = await fetch.get('/users');
```

## 라이선스

MIT