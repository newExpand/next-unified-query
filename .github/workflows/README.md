# GitHub Actions CI/CD Pipeline

이 프로젝트는 포괄적인 CI/CD 파이프라인을 구현하여 코드 품질, 성능, 보안을 자동으로 검증합니다.

## 워크플로우 개요

### 1. CI (Continuous Integration) - `ci.yml`
- **트리거**: PR 및 main/develop 브랜치 push
- **주요 작업**:
  - 코드 품질 검사 (lint, format, typecheck)
  - 단위 테스트 (Node.js 18, 20, 22)
  - E2E 테스트 (Playwright)
  - 빌드 테스트
  - 보안 테스트
  - 접근성 테스트
  - 패키지 설치 테스트

### 2. 배포 (Deployment) - `deploy.yml`
- **트리거**: main 브랜치 push 또는 수동
- **환경**: production, preview
- **주요 작업**:
  - Vercel 배포
  - 배포 후 성능 테스트
  - 배포 후 보안 검증
  - 배포 상태 알림

### 3. 의존성 업데이트 - `dependency-update.yml`
- **트리거**: 매주 월요일 또는 수동
- **주요 작업**:
  - 패치/마이너 버전 자동 업데이트
  - 보안 취약점 스캔
  - 라이선스 준수 확인
  - 자동 PR 생성

### 4. 릴리스 및 배포 - `release.yml`
- **트리거**: 버전 태그 또는 수동
- **주요 작업**:
  - npm 패키지 배포
  - GitHub Release 생성
  - 문서 자동 업데이트
  - 변경 로그 생성

### 5. 성능 모니터링 - `performance.yml`
- **트리거**: PR, main 브랜치 push, 매일
- **주요 작업**:
  - 번들 크기 분석
  - 런타임 성능 벤치마크
  - 메모리 프로파일링
  - Lighthouse CI

## 필수 설정

### GitHub Secrets
다음 시크릿을 GitHub 저장소에 설정해야 합니다:

- `VERCEL_TOKEN`: Vercel 배포용 토큰
- `NPM_TOKEN`: npm 패키지 배포용 토큰
- `CODECOV_TOKEN`: 코드 커버리지 리포트용 토큰 (선택사항)

### Vercel 프로젝트 연결
```bash
vercel link
```

### 환경 설정
- Production: `main` 브랜치 자동 배포
- Preview: PR 자동 배포

## 로컬 테스트

### CI 검증
```bash
# 전체 검증 실행
pnpm validate

# 개별 검사
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### 보안 테스트
```bash
# 보안 헤더 테스트
cd apps/docs && pnpm test:security

# 의존성 취약점 검사
pnpm audit
```

### 성능 테스트
```bash
# 번들 크기 확인
npx size-limit

# Lighthouse 테스트
npx lighthouse http://localhost:3000
```

## 트러블슈팅

### 일반적인 문제

1. **E2E 테스트 실패**
   ```bash
   # Playwright 브라우저 설치
   pnpm exec playwright install
   ```

2. **보안 테스트 실패**
   - CSP 헤더 확인
   - 프로덕션 URL 업데이트 필요 (Task #38)

3. **성능 테스트 실패**
   - 번들 크기 최적화 필요
   - 이미지 최적화 확인

### 디버깅

워크플로우 디버깅을 위해:
1. GitHub Actions 탭에서 실패한 워크플로우 확인
2. 로그 상세 내용 검토
3. 로컬에서 동일한 명령어 실행하여 재현

## 모범 사례

1. **커밋 전 로컬 검증**
   ```bash
   pnpm validate
   ```

2. **PR 템플릿 활용**
   - 체크리스트 완료 확인
   - 관련 이슈 연결

3. **의미 있는 커밋 메시지**
   - 컨벤션 따르기: `type: description`
   - 한국어 사용 가능

4. **보안 우선**
   - 민감한 정보는 시크릿 사용
   - 정기적인 의존성 업데이트

## 참고 자료

- [GitHub Actions 문서](https://docs.github.com/actions)
- [Vercel CLI 문서](https://vercel.com/docs/cli)
- [Lighthouse CI 문서](https://github.com/GoogleChrome/lighthouse-ci)
- [pa11y 접근성 테스트](https://pa11y.org/)