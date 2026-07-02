# 기획팀 문서 자동화 웹 프로젝트

## 프로젝트 개요

커머스 기업 상품기획팀의 문서 작업을 자동화하는 웹 서비스.
비개발자가 Claude Code와 함께 직접 개발하는 프로젝트.

---

## 핵심 기능

| 기능 | 입력 | 출력 | 상태 |
|------|------|------|------|
| 개발의뢰서 | 기획안 텍스트 / 파일 첨부 | 제품 유형별(화장품·식품건기식·공산품·의료기기) 개발의뢰서 (HTML) | ✅ |
| 제품 사양서 | 최종 SPEC HTML 파일 | 제품 사양서 기본 양식 기입 (xlsx) | ✅ |
| 최종 기획안 | 초기 기획안 + 최종 SPEC | 최종 기획안 (HTML), AI 대화형 수정, PPT 내보내기 | ✅ |
| 상세 페이지 플로우 + 문안 | 기획안 + 레퍼런스(JPG/PDF, 선택) | 페이지 플로우 + 카피 초안 (HTML) | ✅ |
| 제안서 작성 | 기획 아이디어 | 로직발굴 → 마케팅방향성 → 최종제안서 3단계 대화형 HTML, 별도 비밀번호(`PROPOSAL_PASSWORD`) | ✅ |
| 리뷰 분석 | 올리브영·아마존·큐텐JP 리뷰 파일 | 별점분포·장단점·미충족니즈 등 분석 (xlsx) | ✅ |
| 문서 수정 (doc-edit) | 이미 생성된 HTML 문서 | 위 기능들과 무관하게 업로드한 HTML을 직접 편집 | ✅ |
| 관리자 페이지 | - | 제안서 임시 접근 코드(매일 자동 갱신) 확인 | ✅ |
| Notion 불러오기 | 노션 페이지 URL | 텍스트 추출 후 각 기능의 입력으로 사용 | ✅ |
| Notion 저장 | 생성된 문서 | Notion 페이지로 자동 저장 | ⬜ 미개발 |

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
MODEL_LARGE (claude-sonnet-4-6):    제안서, 최종기획안, 상세페이지, 리뷰분석 — 대용량 출력
```

모델명은 `web/lib/constants.ts`에서만 관리. 변경 시 이 파일 한 곳만 수정.

### 선택하지 않은 이유가 있는 스택
- **별도 DB:** 상태 저장 불필요. 문서 생성 결과는 웹 편집 후 다운로드.
- **복잡한 인증:** 팀 내부 도구이므로 환경변수 비밀번호로 충분.
- **Tiptap 에디터:** 폼 기반 필드 입력으로 충분하여 미사용.
- **SheetJS:** xlsx-populate 사용 — SheetJS는 xlsx 스타일(서식) 파괴함.

---

## 폴더 구조

```
/
├── CLAUDE.md / progress.md / error.md / plan.md / education.md
├── reference/                      # 참고자료(레퍼런스 샘플, 원본 리뷰 데이터) — git 미추적, 코드 미참조
└── web/                            # 실제 Next.js 앱 (배포 대상)
    ├── 제품 사양서 기본 양식.xlsx    ⚠️ 절대 덮어쓰지 말 것 (원본 양식)
    ├── 최종기획안 양식.pptx          ⚠️ 절대 덮어쓰지 말 것 (PPT 내보내기 원본 양식)
    ├── app/
    │   ├── page.tsx                          # 메인 대시보드
    │   ├── login/                            # 앱 비밀번호 인증
    │   ├── admin/                            # 제안서 임시 접근 코드 확인
    │   ├── api/
    │   │   ├── auth/                         # login / logout / admin / proposal 인증
    │   │   ├── dev-request/                  # 개발의뢰서 생성
    │   │   ├── final-plan/                   # 최종기획안 생성 (+ pptx/ = PPT 내보내기)
    │   │   ├── page-flow/                    # 상세페이지 생성
    │   │   ├── product-spec/                 # 제품사양서 생성
    │   │   ├── proposal/                     # 제안서 3단계 (route.ts=초기, final/logic/marketing, _shared.ts=공통 스트리밍 로직)
    │   │   ├── review-analysis/              # 리뷰 분석
    │   │   ├── notion/                       # 노션 페이지 불러오기
    │   │   └── admin/temp-code/              # 오늘의 제안서 임시 코드 발급
    │   └── (document-automation)/            # 위 기능들의 화면 (라우트 그룹, URL엔 안 나타남)
    │       ├── dev-request/ · final-plan/ · page-flow/ · product-spec/
    │       ├── proposal/ (+ final/ logic/ marketing/)
    │       ├── review-analysis/
    │       └── doc-edit/                     # 독립 HTML 편집 유틸리티
    ├── components/
    │   ├── FileAttachSection.tsx             # 파일 첨부 + 노션 불러오기 공통 컴포넌트
    │   ├── FormSection.tsx                   # 공통 폼 컴포넌트
    │   ├── ScreeningStatusTable.tsx          # 수출 스크리닝 상태 표
    │   └── ProposalChatUI.tsx                # 제안서 3단계 공통 채팅 UI
    ├── lib/
    │   ├── constants.ts                      # 모델명·파일크기·로깅
    │   ├── rate-limit.ts                     # IP당 분당 요청 제한
    │   ├── notion.ts                         # Notion 페이지 읽기 헬퍼
    │   ├── temp-code.ts                      # 제안서 임시 접근 코드 생성
    │   ├── final-plan-template.ts            # 최종기획안 HTML 조립 템플릿
    │   ├── *-fields.ts                       # 기능별 폼 필드 정의
    │   └── prompts/                          # 기능별 AI 프롬프트 (전부 여기서만 관리)
    └── .env.local
```

기능별 세부 규칙(자동입력 규칙, 필드 매핑 등)은 `web/app/(document-automation)/<기능>/CLAUDE.md`에 별도 기록 (현재: `dev-request`, `product-spec`).

---

## 환경변수 (.env.local)

```env
ANTHROPIC_API_KEY=sk-ant-...
APP_PASSWORD=              # 앱 전체 접근 비밀번호
PROPOSAL_PASSWORD=         # 제안서 기능 별도 비밀번호
ADMIN_PASSWORD=            # /admin 페이지 접근 비밀번호
TEMP_PASSWORD_SECRET=      # 제안서 임시 접근 코드 생성용 시크릿 (일 단위 자동 갱신)
NOTION_TOKEN=              # 노션 페이지 불러오기용 Integration 토큰
NOTION_DATABASE_ID=        # Notion 저장(미개발) 구현 시 추가
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

### 응답 속도 — 스트리밍 & 프롬프트 캐싱 ⚠️ 중요

- **출력이 큰 기능(제안서·최종기획안·상세페이지)은 반드시 화면까지 실시간 스트리밍할 것.** 서버에서 `client.messages.stream()`을 열어놓고 `finalMessage()`로 끝까지 기다렸다가 한 번에 응답하면 스트리밍을 쓰는 의미가 없다 — 실시간 델타를 그대로 클라이언트로 흘려보낼 것.
- 후처리(JSON 파싱, 템플릿 조립 등)가 필요해 원문을 그대로 최종 결과로 쓸 수 없는 경우: 원문 델타를 진행 상황 표시용으로 먼저 흘려보내고, 완료 후 구분자(예: `---PAGEFLOW-FINAL---`)를 붙여 최종 결과를 이어서 전송 → 클라이언트가 구분자 기준으로 진행상태/최종결과를 분리해서 처리 (`page-flow`, `final-plan` route.ts 참고)
- 48K 토큰 이상 요청은 스트리밍 없이는 타임아웃 발생 가능 — 항상 스트리밍 사용
- 반복 요청마다 동일하게 재전송되는 정적 프롬프트(제안서 단계별 시스템 프롬프트, page-flow 컴포넌트 가이드 등)에는 `system: [{ type: 'text', text: ..., cache_control: { type: 'ephemeral' } }]` 형태로 캐싱 적용 — 같은 세션 내 대화형 수정 요청에서 응답 시작 속도가 개선됨

---

## 인증

- 방식: 미들웨어(`proxy.ts`)에서 쿠키 확인 — `middleware.ts`와 이름 충돌 주의
- 앱 전체: `APP_PASSWORD`
- 제안서: `PROPOSAL_PASSWORD`(매 접속마다 재인증) 또는 당일 임시 코드(관리자 페이지에서 확인) 둘 다 허용
- 관리자 페이지(`/admin`): `ADMIN_PASSWORD`로 별도 인증 — 오늘의 제안서 임시 코드 확인 용도

---

## iframe 편집 기능 (상세페이지 플로우 · 문서 수정)

### 구조
생성된 HTML을 섹션 배열로 파싱 → 왼쪽 목록에서 순서 조작 + 오른쪽 iframe에서 직접 편집.
동일한 편집 방식을 독립 유틸리티인 `doc-edit`(임의의 업로드 HTML 편집)에서도 재사용.

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
6. **원본 보호:** `제품 사양서 기본 양식.xlsx`, `최종기획안 양식.pptx` (둘 다 `web/` 안에 있음) 절대 덮어쓰지 않음
7. **응답 속도:** 출력이 큰 기능은 스트리밍으로 진행 상황을 보여줄 것 (위 "응답 속도" 참고)

---

## 작업 기록 규칙

작업을 마칠 때마다 아래 파일에 기록:
- `progress.md` — 날짜별 작업 이력 (매 작업마다)
- `error.md` — 새로 발견된 오류 패턴 추가 (오류 발생 시)
- `plan.md` — 계획 변경 시 업데이트 (우선순위·방향 바뀔 때)
- `education.md` — 소통이 어려웠던 사례, 설명이 부족해서 작업이 길어진 경우, 더 잘 쓸 수 있는 방법 발견 시 추가

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
- `reference/` — 레퍼런스 샘플 문서·원본 리뷰 데이터 (git 미추적, 로컬 보관용. 코드는 참조하지 않음)
- `web/app/(document-automation)/<기능>/CLAUDE.md` — 기능별 세부 규칙
- `DEPLOY.md` — 배포 가이드
