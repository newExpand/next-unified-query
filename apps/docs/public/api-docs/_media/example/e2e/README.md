# Integration Tests

이 디렉토리는 **next-unified-query** 라이브러리의 통합 테스트를 포함합니다. 단위 테스트로는 검증하기 어려운 실제 브라우저 환경에서의 동작을 테스트합니다.

## 테스트 구조

### 1. `real-world-scenarios.spec.ts`
실제 사용 패턴을 시뮬레이션하는 통합 테스트

**주요 시나리오:**
- 사용자 목록 → 상세 페이지 → 뒤로가기 캐시 재사용
- 동시 여러 탭에서 상태 동기화
- 페이지네이션과 무한 스크롤
- 네트워크 지연 상황에서의 UX
- 오프라인/온라인 전환 시 자동 재시도
- Optimistic updates 동작
- staleTime 실제 동작 검증

**에러 처리:**
- API 에러 후 재시도 성공 시나리오
- 부분적 데이터 로드 실패 처리

### 2. `nextjs-integration.spec.ts`
Next.js 15 App Router 특화 기능 통합 테스트

**App Router SSR & RSC:**
- Server Component에서 prefetch한 데이터의 Client Component hydration
- Server Component + Client Component 혼합 데이터 페칭
- generateStaticParams vs dynamic routes 성능 차이

**Cache Options:**
- `force-cache` 옵션으로 브라우저 캐시 활용
- `no-store` 옵션으로 캐시 방지
- `revalidate` 옵션으로 시간 기반 재검증
- `tags`를 사용한 selective revalidation

**App Router Special Files:**
- `loading.js` UI와 Suspense 경계
- `error.js`와 에러 경계 동작
- `not-found.js` 동작
- `layout.js` 중첩과 상태 유지

**Performance Features:**
- Dynamic Import와 lazy loading
- App Router의 fetch cache와 revalidate 동작

### 3. `memory-performance.spec.ts`
메모리 사용량 및 성능 실측 테스트

**메모리 관리:**
- 대량 쿼리 생성 시 메모리 사용량 제한 (LRU 동작)
- 컴포넌트 마운트/언마운트 반복 시 메모리 누수 검증
- gcTime 동작으로 메모리 자동 정리

**성능 벤치마크:**
- 동시 쿼리 요청 처리 성능
- 캐시 조회 성능 (대량 데이터)
- 렌더링 성능 - 대량 리스트 업데이트
- 메모리 사용량 모니터링

**네트워크 성능:**
- 다양한 네트워크 조건에서 성능 (3G, 2G 등)

- 캐시 효율성 측정

### 4. `cross-component-state.spec.ts`
컴포넌트 간 상태 공유 테스트

**상태 동기화:**
- 같은 쿼리키를 사용하는 여러 컴포넌트 간 상태 동기화
- Mutation 후 관련 쿼리들의 자동 invalidation
- Optimistic update와 rollback 시나리오
- 서로 다른 페이지의 컴포넌트 간 상태 공유

**컴포넌트 계층:**
- 부모-자식 컴포넌트 간 쿼리 상태 전파
- 조건부 렌더링 컴포넌트의 쿼리 상태 관리

**실시간 업데이트:**
- WebSocket과 쿼리 상태 연동
- Server-Sent Events와 자동 쿼리 갱신
- Background refetch와 사용자 경험

**에러 상태 전파:**
- 한 컴포넌트의 에러가 다른 컴포넌트에 전파
- 부분 에러와 전체 에러 상태 관리

## 테스트 실행

### 기본 실행
```bash
cd apps/example
pnpm test:e2e
```

### 특정 테스트 파일 실행
```bash
pnpm test:e2e real-world-scenarios.spec.ts
pnpm test:e2e nextjs-integration.spec.ts
pnpm test:e2e memory-performance.spec.ts
pnpm test:e2e cross-component-state.spec.ts
```

### 헤드리스 모드로 실행
```bash
pnpm test:e2e --headed
```

### 디버그 모드
```bash
pnpm test:e2e --debug
```

## 테스트 환경 요구사항

### 브라우저 설정
- Chrome/Chromium (메모리 측정 API 필요)
- JavaScript heap 정보 액세스를 위한 `--enable-precise-memory-info` 플래그
- 가비지 컬렉션 테스트를 위한 `--expose-gc` 플래그

### 테스트 데이터
각 테스트는 독립적으로 실행되도록 설계되었으며, `beforeEach`에서 캐시를 초기화합니다.

### Mock 서버
실제 네트워크 조건을 시뮬레이션하기 위해 Playwright의 route interception을 사용합니다.

## Playwright MCP 통합

이 프로젝트는 Playwright MCP (Model Context Protocol) 통합을 지원합니다. Claude desktop에서 Playwright MCP가 설정되어 있다면 다음과 같은 고급 기능을 사용할 수 있습니다:

### 인터랙티브 테스트 개발
- 실시간 브라우저 조작 및 테스트 시나리오 개발
- 테스트 실패 시 즉시 디버깅 및 수정

### 시각적 디버깅
- 캐시 상태 변화의 실시간 관찰
- 컴포넌트 상태 동기화 과정 시각화
- 메모리 사용량 그래프 및 성능 메트릭 실시간 모니터링

### 성능 분석
- 실제 브라우저 메트릭을 통한 성능 측정
- 네트워크 조건 변경을 통한 성능 테스트
- 사용자 경험 시뮬레이션

## 테스트 철학

### 단위 테스트와의 차별화
이 통합 테스트들은 이미 잘 작성된 단위 테스트(7,800+ 줄)를 보완합니다:

- **단위 테스트**: 개별 함수/컴포넌트의 로직 검증
- **통합 테스트**: 실제 브라우저 환경에서의 전체 시스템 동작 검증

### 실제 사용 환경 중심
- 모킹을 최소화하고 실제 브라우저 환경에서 테스트
- 실제 네트워크 지연, 메모리 제약, 사용자 상호작용 시뮬레이션
- 프로덕션에서 발생할 수 있는 엣지 케이스 검증

### 성능 및 UX 중심
- 사용자가 체감하는 성능과 경험에 집중
- 메모리 누수, 렌더링 성능, 캐시 효율성 등 실측 가능한 메트릭 검증

## 기여 가이드

새로운 통합 테스트를 추가할 때는 다음을 고려하세요:

1. **단위 테스트로 검증 불가능한 시나리오**인지 확인
2. **실제 사용 패턴**을 반영하는지 검증
3. **성능 및 메모리** 영향을 측정할 수 있는지 확인
4. **여러 컴포넌트 간의 상호작용**을 검증하는지 확인

테스트는 가능한 한 독립적이고 재현 가능해야 하며, 실패 시 명확한 원인을 파악할 수 있어야 합니다.

---

## 🚨 테스트 중복 방지 가이드라인

### 테스트 파일별 역할 분담

#### 🏭 `factory-options.spec.ts`
**목적**: Query/Mutation Factory의 고급 옵션 테스트
- Factory 패턴 기반 스키마 검증 (Factory 정의와 API 응답 일치성)
- Select 함수 데이터 변환 및 메모이제이션
- Enabled 조건부 쿼리 활성화/비활성화 
- QueryFn/MutationFn 커스텀 함수 (복잡한 API 조합, 재시도 로직)
- FetchConfig 커스텀 설정 (헤더, timeout, 재시도)
- 콜백 체인 및 동적 무효화

#### 📋 `schema-validation.spec.ts`
**목적**: 범용 스키마 검증 기능 테스트
- API 응답 스키마 검증 (성공/실패/부분적 오류)
- 중첩 객체 및 배열 스키마 검증
- 조건부 필드 및 유니온 타입 검증
- 환경별 에러 처리 (개발/프로덕션)
- 타입 안전성 및 런타임 보장 (타입 변환, coercion)
- 스키마 검증 성능 및 최적화 (대용량 데이터, 캐싱)
- 스키마 진화 및 호환성 (하위 호환성, 마이그레이션)

#### 🚀 `memory-performance.spec.ts`
**목적**: 메모리 사용량 및 성능 벤치마크
- 메모리 관리 (LRU 캐시, GC 동작)
- 동시 쿼리 처리 성능
- 캐시 조회 성능 (대량 데이터)
- 네트워크 성능 테스트 (다양한 조건)

### ❌ 중복 방지 규칙

1. **기능별 차별화 (동일 페이지, 다른 목적)**
   - 기존 안정적인 페이지들을 재사용하되 테스트 목적과 데이터로 차별화
   - Factory 특화 API 응답으로 Factory 패턴 검증
   - 범용 스키마 검증과 Factory 패턴 검증의 관점 차이

2. **API 데이터 차별화**
   - schema-validation.spec.ts: 표준 API 응답 구조
   - factory-options.spec.ts: Factory 특화 확장 필드 포함
   - memory-performance.spec.ts: 성능 측정 특화 구조

3. **기능별 책임 분담**
   - 기본 스키마 검증 → schema-validation.spec.ts
   - Factory 관련 스키마 → factory-options.spec.ts
   - 성능/메모리 관련 → memory-performance.spec.ts

### ✅ 새로운 테스트 추가 체크리스트

- [ ] 유사한 테스트가 다른 파일에 있는지 확인
- [ ] 적절한 테스트 파일에 배치 (목적에 따라)
- [ ] API 응답 데이터를 차별화하여 중복 방지
- [ ] 테스트 검증 관점을 명확히 구분
- [ ] 파일 상단 문서 업데이트

### 🔧 중복 해결 사례

**문제**: `factory-options.spec.ts`와 `schema-validation.spec.ts`에서 동일한 스키마 검증 테스트

**해결 방법**:
- 동일한 페이지를 사용하되 API 응답 데이터를 차별화
- factory-options: Factory 패턴 특화 필드 (role, isActive 등) 포함
- schema-validation: 표준 스키마 검증에 집중
- 검증 관점 차별화: Factory 일관성 vs 범용 스키마 검증

이 가이드라인을 통해 테스트 중복을 방지하고 유지보수성을 향상시킬 수 있습니다.