# 기획팀 문서 자동화 웹 프로젝트

## 프로젝트 개요

커머스 기업 상품기획팀의 문서 작업을 자동화하는 웹 서비스.
비개발자가 Claude Code와 함께 직접 개발하는 프로젝트.

---

## 핵심 기능 (개발 우선순위 순)

### Phase 1 — 문서 자동화 (우선 개발)

| 문서 | 입력 | 출력 | 상태 |
|------|------|------|------|
| 개발의뢰서 | 기획안 텍스트 / 파일 첨부 | 제품 유형별 개발의뢰서 (HTML) | ✅ 완료 |
| 제품 사양서 | 최종 SPEC HTML 파일 | 제품 사양서 기본 양식 기입 (xlsx) | ✅ 완료 |
| 최종 기획안 | 초기 기획안 + 최종 SPEC | 최종 기획안 문서 (HTML) | ✅ 완료 |
| 상세 페이지 플로우 + 문안 | 기획안 + 레퍼런스(JPG/PDF) | 페이지 플로우 + 카피 초안 (HTML) | ✅ 완료 |

### Phase 2 — 기획안 자동생성 (추후 개발)

회사의 기획 가이드라인을 학습하여 아이디어만으로 기획안 초안을 생성한다.

- **입력:** 핵심 차별점 / 아이디어 (텍스트)
- **학습 방식:** 회사 기획 가이드라인 문서를 시스템 프롬프트에 반영
- **출력:** 회사 기준에 맞는 상품 기획안 초안

### Phase 3 — Notion 연동 (추후 개발)

생성된 문서를 Notion 페이지로 자동 저장.

---

## 기술 스택

```
Frontend:  Next.js 16 (App Router) + TypeScript
Styling:   Tailwind CSS v4
AI:        Anthropic Claude API (claude-sonnet-4-5)
Auth:      환경변수 기반 단순 비밀번호 (미들웨어로 처리)
xlsx:      xlsx-populate (스타일 보존 xlsx 편집)
배포:      Vercel (무료 플랜)
```

### 선택하지 않은 이유가 있는 스택
- **별도 DB:** Phase 1~2는 상태 저장 불필요. 문서 생성 결과는 웹 편집 후 다운로드 또는 Notion 저장.
- **복잡한 인증:** 팀 내부 도구이므로 환경변수 비밀번호로 충분.
- **Tiptap 에디터:** 폼 기반 필드 입력으로 충분하여 미사용.
- **스트리밍 API:** 현재 JSON 응답 방식으로 충분.

---

## 폴더 구조 (실제)

```
/
├── 제품 사양서 기본 양식.xlsx     # 제품사양서 원본 양식 (절대 덮어쓰지 말 것)
└── web/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                         # 메인 대시보드
    │   ├── login/                           # 비밀번호 인증
    │   ├── api/
    │   │   ├── auth/                        # 로그인/로그아웃
    │   │   ├── dev-request/                 # 개발의뢰서 자동입력 API
    │   │   └── product-spec/               # 제품사양서 생성 API
    │   └── (document-automation)/          # Phase 1: Route Group
    │       ├── dev-request/                # 개발의뢰서
    │       ├── final-plan/                 # 최종 기획안
    │       ├── product-spec/              # 제품 사양서
    │       └── page-flow/                  # 페이지 플로우 + 문안 (예정)
    ├── components/
    │   ├── FormSection.tsx                 # 공통 폼 컴포넌트 (select, multiselect 등)
    │   └── ScreeningStatusTable.tsx        # 수출 스크리닝 상태 표
    ├── lib/
    │   ├── dev-request-fields.ts           # 개발의뢰서 필드 정의
    │   ├── final-plan-fields.ts            # 최종 기획안 필드 정의
    │   ├── product-spec-fields.ts          # 제품 사양서 필드 정의
    │   └── prompts/
    │       ├── dev-request.ts              # 개발의뢰서 프롬프트 + 작성 규칙
    │       └── product-spec.ts             # 제품사양서 프롬프트
    └── .env.local
```

---

## 사용자 흐름 (UX)

### 공통 흐름
```
1. 메인 화면에서 생성할 문서 유형 선택
2. 기획안 파일 첨부 또는 텍스트 입력
3. "생성" 버튼 클릭
4. 로딩 → 생성된 내용이 폼에 표시
5. 폼에서 항목별 직접 수정
6. 내보내기 (HTML 또는 xlsx)
```

### 각 기능별 입력

**개발의뢰서** — 자세한 규칙은 `dev-request/CLAUDE.md` 참고
- 기획안 텍스트 붙여넣기 또는 파일 첨부 (PDF / HTML)
- 제품 유형 선택 (화장품·식품건기식·공산품·의료기기)
- 자동입력 / 수동입력 선택

**최종 기획안**
- 초기 기획안 파일 첨부 (다중)
- 기타 첨부자료 파일 첨부 (다중)
- 최종 SPEC 항목별 직접 입력

**제품 사양서** — 자세한 규칙은 `product-spec/CLAUDE.md` 참고
- 최종 SPEC 내보내기 HTML 파일 첨부
- AI가 기획팀 섹션 자동 기입 후 xlsx 내보내기

---

## Claude API 활용 방식

- **모델:** `claude-sonnet-4-5`
- **방식:** 단일 요청 → JSON 응답 파싱 → 폼 자동 완성
- **파일 처리:** PDF는 base64 document block, HTML은 태그 제거 후 텍스트 추출
- **프롬프트 위치:** `lib/prompts/`에서 관리

---

## 인증

- 방식: 미들웨어(`proxy.ts`)에서 쿠키 확인
- 비밀번호: `.env.local`의 `APP_PASSWORD` 환경변수 (`2359`)
- 로그인 후 세션 유지 (브라우저 닫기 전까지)

---

## 환경변수 (.env.local)

```env
ANTHROPIC_API_KEY=sk-ant-...
APP_PASSWORD=2359
NOTION_TOKEN=             # Phase 3에서 추가
NOTION_DATABASE_ID=       # Phase 3에서 추가
```

---

## 개발 원칙

1. **단순하게 유지:** 비개발자가 Claude와 함께 유지보수할 수 있는 수준의 코드
2. **컴포넌트 재사용:** 폼, 로딩 상태는 공통 컴포넌트로 분리
3. **타입 안전:** TypeScript로 API 응답 타입 정의
4. **프롬프트 분리:** AI 프롬프트는 `lib/prompts/`에 모아서 관리 (수정 쉽게)
5. **주석 최소화:** 코드 자체가 읽기 쉽게, 필요한 경우만 한 줄 주석

---

## 작업 기록 규칙

작업을 마칠 때마다 `progress.md` 파일에 아래 형식으로 내용을 추가한다. 다음 날 이어서 작업할 수 있도록 현재 상태와 다음 할 일을 명확히 기록한다.

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

## Notion 연동 (Phase 3 참고)

- Notion Integration 토큰 발급 후 `.env.local`에 추가
- 생성된 문서를 지정한 Notion 데이터베이스에 페이지로 저장
- 웹 에디터 → Notion 블록 형식으로 변환 필요

---

## 현재 개발 상태

- Phase 1: 문서 자동화 ✅ **완료**
  - [x] 프로젝트 초기 셋업 (Next.js)
  - [x] 비밀번호 인증
  - [x] 메인 대시보드
  - [x] 개발의뢰서 생성 (자동입력 + 수동입력 + HTML 내보내기)
  - [x] 제품 사양서 생성 (AI 자동 기입 + xlsx 내보내기)
  - [x] 최종 기획안 생성 (HTML 방식, 브라우저 편집, PDF/HTML 저장)
  - [x] 상세 페이지 플로우 + 문안 생성 (레퍼런스 분석 + 섹션/요소 편집 + HTML 저장)
- Phase 2: 기획안 자동생성 ✅ **완료** (제안서 작성으로 구현됨)
  - [x] 회사 기획 가이드라인 → 시스템 프롬프트 반영 (proposal.ts)
  - [x] 6단계 프로세스: 기전분석→체크리스트→차별성로직→타겟→원료설계→HTML출력
  - [x] 3단계 분리 UI: 로직 발굴 / 마케팅 방향성 / 제안서 작성
  - [x] 별도 비밀번호 인증 (product_2359)
- [ ] Phase 3: Notion 연동
