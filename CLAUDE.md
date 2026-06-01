# 기획팀 문서 자동화 웹 프로젝트

## 프로젝트 개요

커머스 기업 상품기획팀의 문서 작업을 자동화하는 웹 서비스.
비개발자가 Claude Code와 함께 직접 개발하는 프로젝트.

---

## 핵심 기능 (개발 우선순위 순)

### Phase 1 — 문서 자동화

| 문서 | 입력 | 출력 | 상태 |
|------|------|------|------|
| 개발의뢰서 | 기획안 텍스트 / 파일 첨부 | 제품 유형별 개발의뢰서 (HTML) | ✅ 완료 |
| 제품 사양서 | 최종 SPEC HTML 파일 | 제품 사양서 기본 양식 기입 (xlsx) | ✅ 완료 |
| 최종 기획안 | 초기 기획안 + 최종 SPEC | 최종 기획안 문서 (HTML) | ✅ 완료 |
| 상세 페이지 플로우 + 문안 | 기획안 + 레퍼런스(JPG/PDF) | 페이지 플로우 + 카피 초안 (HTML) | ✅ 완료 |

### Phase 2 — 기획안 자동생성

✅ **완료** (제안서 작성으로 구현됨)
- 6단계 프로세스: 기전분석→체크리스트→차별성로직→타겟→원료설계→HTML출력
- 3단계 분리 UI: 로직 발굴 / 마케팅 방향성 / 제안서 작성
- 별도 비밀번호 인증 (235900)

### Phase 3 — Notion 연동

[ ] **미개발** — 생성된 문서를 Notion 페이지로 자동 저장

---

## 기술 스택

```
Frontend:  Next.js 16 (App Router) + TypeScript
Styling:   Tailwind CSS v4
AI:        Anthropic Claude API
Auth:      환경변수 기반 단순 비밀번호 (미들웨어로 처리)
xlsx:      xlsx-populate (스타일 보존 xlsx 편집)
배포:      Vercel (무료 플랜)
```

### 모델 구분 (constants.ts)

```
MODEL_STANDARD (claude-sonnet-4-5): 개발의뢰서, 제품사양서 — 출력량 적음
MODEL_LARGE (claude-sonnet-4-6):    제안서, 최종기획안, 상세페이지 — 대용량 HTML 생성
```

모델명은 `web/lib/constants.ts`에서만 관리. 변경 시 이 파일 한 곳만 수정.

### 선택하지 않은 이유가 있는 스택
- **별도 DB:** Phase 1~2는 상태 저장 불필요. 문서 생성 결과는 웹 편집 후 다운로드 또는 Notion 저장.
- **복잡한 인증:** 팀 내부 도구이므로 환경변수 비밀번호로 충분.
- **Tiptap 에디터:** 폼 기반 필드 입력으로 충분하여 미사용.
- **SheetJS:** xlsx-populate 사용 — SheetJS는 xlsx 스타일(서식) 파괴함.

---

## 폴더 구조

```
/
├── 제품 사양서 기본 양식.xlsx     ⚠️ 절대 덮어쓰지 말 것 (원본 양식)
├── CLAUDE.md                      # 작업 규칙·지침 (이 파일)
├── progress.md                    # 작업 이력
├── error.md                       # 오류 관리
├── plan.md                        # 작업 계획
├── education.md                   # AI 활용 가이드
└── web/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                         # 메인 대시보드
    │   ├── login/                           # 비밀번호 인증
    │   ├── api/
    │   │   ├── auth/                        # 로그인/로그아웃
    │   │   ├── dev-request/                 # 개발의뢰서 자동입력 API
    │   │   ├── final-plan/                  # 최종기획안 생성 API
    │   │   ├── page-flow/                   # 상세페이지 생성 API
    │   │   └── product-spec/               # 제품사양서 생성 API
    │   └── (document-automation)/
    │       ├── dev-request/                # 개발의뢰서
    │       ├── final-plan/                 # 최종 기획안
    │       ├── product-spec/              # 제품 사양서
    │       └── page-flow/                  # 상세 페이지 플로우 + 문안
    ├── components/
    │   ├── FileAttachSection.tsx           # 파일 첨부 공통 컴포넌트
    │   ├── FormSection.tsx                 # 공통 폼 컴포넌트
    │   └── ScreeningStatusTable.tsx        # 수출 스크리닝 상태 표
    ├── lib/
    │   ├── constants.ts                    # 모델명·파일크기 상수
    │   ├── rate-limit.ts                   # IP당 분당 요청 제한
    │   ├── notion.ts                       # Notion API 헬퍼
    │   ├── final-plan-template.ts          # 최종기획안 HTML 조립 템플릿
    │   ├── dev-request-fields.ts
    │   ├── final-plan-fields.ts
    │   ├── product-spec-fields.ts
    │   └── prompts/
    │       ├── dev-request.ts
    │       ├── final-plan.ts
    │       ├── page-flow.ts
    │       ├── product-spec.ts
    │       └── proposal*.ts               # 제안서 3단계 프롬프트
    └── .env.local
```

---

## 환경변수 (.env.local)

```env
ANTHROPIC_API_KEY=sk-ant-...
APP_PASSWORD=2359
NOTION_TOKEN=             # Phase 3에서 추가
NOTION_DATABASE_ID=       # Phase 3에서 추가
```

---

## Claude API 활용 방식

### 기본 패턴
- **방식:** 단일 요청 → 응답 파싱 → 폼 자동 완성 또는 HTML 렌더링
- **파일 처리:** PDF → base64 document block / HTML → 태그 제거 후 텍스트 추출 / 이미지 → base64 image block
- **프롬프트 위치:** `lib/prompts/`에서만 관리 (수정 편의성)

### JSON + HTML 분리 원칙 ⚠️ 중요

AI에게 JSON 응답 안에 HTML을 포함시키면 JSON 파싱 오류 발생.
HTML의 `class="..."` 쌍따옴표가 JSON을 깨뜨리기 때문.

**해결 방법 — 구분자 분리:**
```
{JSON 데이터}
---HTML---
HTML 내용
```

코드에서는 `DELIMITER = '---HTML---'`로 분리 파싱.
적용 사례: `final-plan` API (route.ts 참고)

### 토큰 제한 대응
- 48K 토큰 이상 요청 시 스트리밍 필수: `client.messages.stream().finalMessage()`
- 일반 요청은 `client.messages.create()` 사용 가능

---

## 인증

- 방식: 미들웨어(`proxy.ts`)에서 쿠키 확인 — `middleware.ts`와 이름 충돌 주의
- 일반 비밀번호: `APP_PASSWORD` 환경변수 (`2359`)
- 제안서 비밀번호: 별도 `235900` (매 접속마다 재인증)

---

## iframe 편집 기능 (상세페이지 플로우)

### 구조
생성된 HTML을 섹션 배열로 파싱 → 왼쪽 목록에서 순서 조작 + 오른쪽 iframe에서 직접 편집.

### 편집 스크립트 주입 원칙 ⚠️ 중요
- CSS `:hover`로 버튼 보이기/숨기기 → iframe 안에서 신뢰성 없음
- **반드시 JS `mouseenter`/`mouseleave` 이벤트로 처리**

### 섹션 파싱 원칙
- AI가 `<div class="detail-wrap">` 래퍼를 추가 생성하는 경우 대응 (route.ts에서 자동 제거)
- `<style>`, `<script>` 태그는 섹션으로 카운트하지 않음 → head로 이동
- 단일 래퍼 div 안에 섹션이 묶여 있으면 한 단계 더 들어가서 개별 인식

---

## 개발 원칙

1. **단순하게 유지:** 비개발자가 Claude와 함께 유지보수할 수 있는 수준
2. **컴포넌트 재사용:** 파일 첨부, 폼, 로딩 상태는 공통 컴포넌트로 분리
3. **타입 안전:** TypeScript로 API 응답 타입 정의
4. **프롬프트 분리:** AI 프롬프트는 `lib/prompts/`에만 위치
5. **주석 최소화:** 필요한 경우만 한 줄 주석
6. **원본 보호:** `제품 사양서 기본 양식.xlsx` 절대 덮어쓰지 않음

---

## 작업 기록 규칙

작업을 마칠 때마다 아래 파일에 기록:
- `progress.md` — 날짜별 작업 이력
- `error.md` — 새로 발견된 오류 패턴 추가
- `plan.md` — 계획 변경 시 업데이트

```markdown
## YYYY-MM-DD

### 완료한 작업
- ...

### 현재 상태
- ...

### 다음 작업
- ...

### 특이사항 / 결정 사항
- ...
```

---

## GitHub / 배포

- 저장소: https://github.com/dhyoonn/2359product
- 배포: Vercel (자동 배포 — main 브랜치 push 시)
- 작업 완료 후 반드시 `git add → commit → push` 순서로 반영
- 커밋 메시지 형식: `fix: 설명` / `feat: 설명` / `refactor: 설명`

---

## 파일 크기 제한

| 위치 | 제한 |
|------|------|
| 일반 파일 첨부 | 10MB |
| 레퍼런스 이미지 | 20MB (클라이언트 압축 후) |
| 레퍼런스 PDF | 8MB |
| Claude API 이미지 | 가로·세로 각 8000px 이하 |

이미지는 클라이언트에서 자동 압축 (가로 1200px, 세로 7500px 이내).

---

## 관련 문서

- `progress.md` — 전체 작업 이력
- `error.md` — 오류 목록 및 해결책
- `plan.md` — 현재 계획 및 우선순위
- `education.md` — AI와 협업 시 효과적인 소통 방법
- `DEPLOY.md` — 배포 가이드
