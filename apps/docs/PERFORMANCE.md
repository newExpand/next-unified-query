# Performance Monitoring Guide

## 개요

이 문서는 next-unified-query 문서 사이트의 성능을 모니터링하고 최적화하는 방법을 설명합니다.

## 성능 목표

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5초
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Lighthouse 점수
- **Performance**: 95+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 95+

## 성능 테스트 도구

### 1. Lighthouse 감사

로컬에서 Lighthouse 감사를 실행합니다:

```bash
pnpm test:lighthouse
```

이 명령은:
- 프로덕션 빌드를 서버로 시작
- 모든 주요 페이지에 대해 Lighthouse 감사 실행
- 상세한 보고서를 `lighthouse-reports/` 디렉토리에 저장
- Core Web Vitals 요약 제공

### 2. 번들 분석

번들 크기를 분석하려면:

```bash
pnpm build:analyze
```

이 명령은:
- Webpack Bundle Analyzer 실행
- `.next/analyze/` 디렉토리에 HTML 보고서 생성
- client, server, edge 번들 분석 제공

### 3. 보안 헤더 테스트

보안 헤더가 올바르게 구성되었는지 확인:

```bash
# 개발 환경
pnpm test:security

# 프로덕션 환경
pnpm test:security:prod
```

## 성능 최적화 전략

### 1. 코드 분할 및 지연 로딩

```typescript
// 동적 임포트 사용
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false // 클라이언트 전용 컴포넌트의 경우
});
```

### 2. 이미지 최적화

```typescript
// Next.js Image 컴포넌트 사용
import Image from 'next/image';

<Image
  src="/image.png"
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>
```

### 3. 폰트 최적화

```typescript
// next/font 사용
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});
```

### 4. 캐싱 전략

Next.js 설정에서 캐싱 헤더 구성:

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/:all*(svg|jpg|png)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

## 모니터링 체크리스트

### 배포 전
- [ ] `pnpm test:lighthouse` 실행 및 모든 점수 확인
- [ ] `pnpm build:analyze` 실행 및 번들 크기 검토
- [ ] `pnpm test:security` 실행 및 보안 헤더 확인
- [ ] Core Web Vitals 목표 달성 여부 확인

### 배포 후
- [ ] 실제 사용자 메트릭스 모니터링 (Vercel Analytics)
- [ ] PageSpeed Insights에서 실제 성능 확인
- [ ] 사용자 피드백 수집 및 분석

## 문제 해결

### LCP가 높은 경우
1. 가장 큰 콘텐츠 요소 식별
2. 해당 요소의 로딩 우선순위 높이기
3. 이미지 최적화 및 사전 로드
4. 중요한 CSS 인라인화

### 번들 크기가 큰 경우
1. Bundle Analyzer로 큰 의존성 식별
2. 트리 셰이킹 확인
3. 동적 임포트로 코드 분할
4. 불필요한 의존성 제거

### 접근성 점수가 낮은 경우
1. 색상 대비 확인
2. ARIA 레이블 추가
3. 키보드 탐색 개선
4. 스크린 리더 호환성 테스트

## 자동화된 성능 모니터링

GitHub Actions를 통한 자동 성능 검사:

```yaml
# .github/workflows/performance.yml
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    configPath: ./.lighthouserc.js
    uploadArtifacts: true
```

## 참고 자료

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing/performance)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/overview/)