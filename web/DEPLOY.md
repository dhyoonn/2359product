# 배포 가이드

## Vercel 배포 (권장)

### 1단계 — 사전 준비
1. [Vercel 가입](https://vercel.com) (GitHub 계정으로 로그인)
2. GitHub에 이 프로젝트 레포지토리 생성 후 push
   - `.env.local` 은 `.gitignore`에 포함됨 → **절대 커밋 안 됨**

### 2단계 — Vercel 프로젝트 생성
1. Vercel 대시보드 → "Add New Project"
2. GitHub 레포지토리 연결
3. **Framework Preset**: Next.js 자동 감지됨
4. **Root Directory**: `web` (루트가 아닌 web 폴더!)
5. Deploy 클릭

### 3단계 — 환경변수 설정 (중요!)
Vercel 대시보드 → Settings → Environment Variables 에서 아래 변수 추가:

| 변수명 | 값 | 필수 |
|--------|-----|------|
| `ANTHROPIC_API_KEY` | sk-ant-api03-... | ✅ |
| `APP_PASSWORD` | (팀 공용 비밀번호) | ✅ |
| `PROPOSAL_PASSWORD` | (제안서 전용 비밀번호) | ✅ |
| `NOTION_TOKEN` | ntn_... | Phase 3만 |
| `NOTION_DATABASE_ID` | ... | Phase 3만 |

### 4단계 — 파일 용량 제한 주의
Vercel 무료 플랜: 요청 바디 **4.5MB 제한**
→ 파일 업로드 기능 사용 시 유료 플랜(Pro, $20/월) 필요하거나
→ 또는 다른 서버(Railway, Render 등) 사용

**유료 플랜 없이 쓰려면**: 파일 첨부 없이 텍스트 입력만 사용

---

## Railway 배포 (파일 업로드 제한 없음, 권장)

파일 업로드 기능을 제한 없이 쓰려면 Railway 추천:

1. [Railway 가입](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. 레포지토리 선택 → Root Directory: `web`
4. Variables 탭에서 환경변수 추가 (위 표 참고)
5. Settings → Networking → Generate Domain

---

## 유지보수 가이드

### AI 모델 변경
`web/lib/constants.ts` 파일에서:
```typescript
export const MODEL_STANDARD = 'claude-sonnet-4-5'  // 가벼운 기능용
export const MODEL_LARGE    = 'claude-sonnet-4-6'  // 무거운 기능용
```
이 두 줄만 바꾸면 모든 기능에 자동 반영됨.

### 비용 모니터링
서버 로그에서 자동으로 출력:
```
[proposal] input: 3,200 | output: 8,100 | 비용: $0.0144 (≈ ₩20원)
```

### 프롬프트 수정
모든 AI 프롬프트는 `web/lib/prompts/` 폴더에 기능별로 분리:
- `dev-request.ts` — 개발의뢰서
- `product-spec.ts` — 제품 사양서
- `final-plan.ts` — 최종 기획안
- `page-flow.ts` — 상세 페이지
- `proposal*.ts` — 제안서 (3단계)

### Rate Limit 조정
`web/lib/rate-limit.ts`:
```typescript
checkRateLimit(ip, 30)   // 기본: IP당 분당 30회
checkRateLimit(ip, 15)   // 제안서: IP당 분당 15회
```
사용자가 많아지면 숫자를 늘리면 됨.

---

## 배포 체크리스트

- [ ] `.env.local` git에 없는지 확인 (`git status`로 체크)
- [ ] Vercel/Railway 환경변수 전부 입력했는지 확인
- [ ] 배포 후 각 기능 한 번씩 테스트
- [ ] Vercel 무료 플랜이면 파일 업로드 제한(4.5MB) 인지
