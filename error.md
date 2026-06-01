# 오류 관리

자주 발생하는 오류 패턴과 해결책을 기록한다.
새 오류 발생 시 이 파일에 추가하고, 재발 방지를 위해 CLAUDE.md 원칙에도 반영한다.

---

## 오류 목록

---

### ERR-001 | JSON 안에 HTML을 담으면 파싱 오류

**발생 기능:** 최종 기획안 생성

**오류 메시지:**
```
생성 중 오류: Expected ',' or '}' after property value in JSON at position XXXX
```

**원인:**
AI 응답에서 JSON 필드 값으로 HTML을 반환할 때, HTML 안의 `class="..."` 쌍따옴표가 JSON 문법을 깨뜨림.

```json
// ❌ 이렇게 하면 안 됨
{
  "design_html": "<section class="hero">...</section>"
}
```

**해결책:**
JSON과 HTML을 `---HTML---` 구분자로 분리해서 반환받는다.

```
{"changes": "...", "hero_sub": "...", "appeals": [...]}
---HTML---
<section>...</section>
```

코드에서 `DELIMITER = '---HTML---'`로 분리 파싱. `final-plan/route.ts` 참고.

**재발 방지:** AI에게 HTML이 포함된 JSON 응답을 절대 요청하지 않는다. JSON 외 콘텐츠는 항상 구분자로 분리.

---

### ERR-002 | 상세페이지 섹션 목록이 불완전하게 표시됨

**발생 기능:** 상세 페이지 플로우 + 문안

**증상:**
- 왼쪽 섹션 목록에 실제 섹션보다 적게 표시됨
- "섹션"이라는 이름의 항목이 여러 개 생김
- 섹션이 1개로 뭉쳐서 표시됨

**원인 A — AI가 `<div class="detail-wrap">` 래퍼를 추가 생성:**
```html
<!-- AI가 이렇게 생성하면 파서가 1개 섹션으로 인식 -->
<div class="detail-wrap">
  <section>...</section>
  <section>...</section>
</div>
```

**해결책 A:** `page-flow/route.ts`에서 AI 출력 전처리 시 `detail-wrap` 래퍼 감지 후 제거.

**원인 B — `<style>` 태그가 섹션으로 카운트됨:**
레퍼런스 모드에서 AI가 섹션 CSS를 형제 `<style>` 태그로 생성하면, 파서가 이를 섹션으로 카운트.

**해결책 B:** `parseHtmlToSections`에서 `style`/`script` 태그 건너뜀.

**원인 C — 단일 래퍼 div 안에 모든 섹션이 묶임:**

**해결책 C:** 직접 자식이 1개이고 그 자식이 div/main/article이면 한 단계 더 들어감.

---

### ERR-003 | iframe 안에서 삭제/추가 버튼이 동작하지 않음

**발생 기능:** 상세 페이지 플로우 + 문안 편집

**증상:**
- 텍스트 클릭 수정은 되는데, 요소 삭제(✕) 버튼이 나타나지 않거나 클릭이 안 됨
- 항목 추가(+) 버튼도 동작하지 않음

**원인:**
CSS `:hover` 의사 클래스가 iframe 내부에서 신뢰성이 낮음. 특정 브라우저 버전이나 환경에서 작동하지 않음.

```css
/* ❌ iframe 안에서 신뢰성 없음 */
.__edit-host:hover > .__edit-del { display: flex !important; }
```

**해결책:**
CSS `:hover` 대신 JavaScript `mouseenter`/`mouseleave` 이벤트로 직접 제어.

```javascript
// ✅ 이 방식이 안정적
el.addEventListener('mouseenter', function() { btn.style.display = 'flex'; });
el.addEventListener('mouseleave', function(e) {
  if (!el.contains(e.relatedTarget)) btn.style.display = 'none';
});
```

**재발 방지:** iframe 안 인터랙션은 CSS 의사 클래스 대신 항상 JS 이벤트로 처리.

---

### ERR-004 | 이미지 업로드 후 Claude API 오류

**발생 기능:** 상세 페이지 레퍼런스 이미지 업로드

**오류 메시지:**
```
image exceeds maximum dimensions
```

**원인:**
Claude API 이미지 제한: 가로·세로 각 최대 8000px. 상세페이지 풀스크린샷은 세로가 10,000~20,000px 수준.

**해결책:**
클라이언트에서 업로드 전 자동 압축.
- 가로 최대 1200px
- 세로 최대 7500px (API 8000px 제한에 여유)
- `compressImage()` 함수 (`page-flow/page.tsx`) 참고

**재발 방지:** 이미지를 Claude API에 전달하기 전 항상 클라이언트에서 리사이즈.

---

### ERR-005 | 48K 토큰 요청 시 타임아웃 또는 오류

**발생 기능:** 상세 페이지 플로우 생성 (레퍼런스 모드)

**원인:**
`max_tokens: 48000` 이상 요청은 응답 시간이 10분을 넘을 수 있어 일반 요청 방식으로는 타임아웃 발생.

**해결책:**
스트리밍 방식으로 전환하되 최종 결과만 사용:
```typescript
const stream = client.messages.stream({ max_tokens: 48000, ... })
const message = await stream.finalMessage()
```

**재발 방지:** `max_tokens`가 16000을 초과하면 무조건 스트리밍 방식 사용.

---

### ERR-006 | Next.js 미들웨어 파일명 충돌

**발생 기능:** 서버 전체 (인증)

**증상:**
인증이 우회되거나 미들웨어가 작동하지 않음.

**원인:**
인증 미들웨어 파일명이 `proxy.ts` — Next.js가 미들웨어로 인식하는 파일명은 `middleware.ts`.
두 파일이 동시에 존재하면 충돌 발생.

**해결책:**
`proxy.ts` 하나만 유지. `middleware.ts`가 별도로 생기지 않도록 주의.

---

### ERR-007 | xlsx 내보내기 시 셀 서식 사라짐

**발생 기능:** 제품 사양서 xlsx 내보내기

**원인:**
SheetJS(xlsx) 라이브러리는 스타일(서식)을 보존하지 않음.

**해결책:**
`xlsx-populate` 라이브러리 사용. 원본 파일을 열어 값만 수정 후 저장.

**재발 방지:** xlsx 편집 시 반드시 `xlsx-populate` 사용. SheetJS로 교체하지 말 것.

---

### ERR-008 | Notion URL 형식 오류

**발생 기능:** 개발의뢰서 노션 불러오기

**증상:**
`app.notion.com` 형식 URL 입력 시 페이지를 읽지 못함.

**원인:**
초기 코드가 `notion.so` 도메인만 허용.

**해결책:**
`lib/notion.ts`의 `extractPageId` 함수가 도메인 무관하게 페이지 ID를 추출하도록 수정 완료.

---

### ERR-009 | FileAttachSection 미사용 상태·함수로 빌드 오류

**발생 기능:** 빌드 시 전체

**오류 메시지:**
```
'xxx' is defined but never used
```

**원인:**
`FileAttachSection.tsx`에서 선언한 상태나 함수를 외부에서 사용하지 않을 때 TypeScript 엄격 모드에서 빌드 실패.

**해결책:**
사용하지 않는 상태·함수를 제거하거나, 실제로 props로 연결.

**재발 방지:** 컴포넌트 내 상태·함수는 실제로 사용하는 것만 선언.

---

### ERR-010 | 레퍼런스 모드에서 편집 기능 미작동

**발생 기능:** 상세 페이지 플로우 레퍼런스 모드

**증상:**
기본 모드(레퍼런스 없음)에서는 삭제/추가 버튼이 표시되는데, 레퍼런스 모드에서는 버튼이 없음.

**원인:**
EDITOR_SCRIPT의 삭제/추가 버튼 로직이 AKKBELL 컴포넌트 클래스명(`.pain-item`, `.faq-item` 등)에만 의존. 레퍼런스 모드에서 AI는 커스텀 클래스명으로 HTML을 생성하므로 매칭 안 됨.

**해결책:**
AKKBELL 클래스 기반 로직 + 범용 로직 병행:
- 같은 태그+클래스를 가진 형제 요소가 2개 이상이면 자동으로 삭제/추가 버튼 생성

---

### ERR-011 | 상세페이지 생성 후 디자인 전체 사라짐 (CSS 손실)

**발생 기능:** 상세 페이지 플로우 + 문안 — 생성 직후 미리보기

**증상:**
섹션 목록은 정상 표시되는데, 오른쪽 미리보기에서 디자인이 모두 사라지고 텍스트만 나열됨.

**원인:**
`parseHtmlToSections`의 코드 실행 순서 문제.
AI가 모든 섹션을 단일 래퍼 div로 감쌌을 때 언래핑하는 과정에서 래퍼 내부의 `<style>` 태그를 버림.
`head` 구성이 스타일 수집보다 먼저 실행되어 CSS가 통째로 손실됨.

```
❌ 잘못된 순서:
wrapper 직접자식 <style> 수집 → head 구성 → 언래핑(이때 내부 style 버림)

✅ 올바른 순서:
wrapper 직접자식 <style> 수집 + 래퍼 내부 <style> 수집 → 언래핑 → head 구성
```

**해결책:**
`parseHtmlToSections`에서 스타일 수집(wrapper 직접자식 + 단일 래퍼 div 내부 모두)을 먼저 완료한 뒤 `head`를 구성하도록 순서 변경.

**재발 방지:**
`parseHtmlToSections`를 수정할 때 반드시 아래 순서를 지킨다:
1. `<style>` 태그 전체 수집 (wrapper 직접자식 + 잠재적 래퍼 내부)
2. 언래핑 결정 및 sectionEls 확정
3. head 구성 (floatingStyles 포함)
4. sections 배열 생성

---

### ERR-012 | 섹션 레이아웃 내 불필요한 편집 버튼 생성

**발생 기능:** 상세 페이지 플로우 + 문안 — 미리보기 편집 모드

**증상:**
페이지 레이아웃 섹션(`<section class="s">` 등)에 삭제/추가 버튼이 붙어 레이아웃 교란.

**원인:**
EDITOR_SCRIPT의 generic 반복 요소 탐지가 `.detail-wrap`의 직접 자식 섹션에도 적용됨.
`<section class="s">`가 여러 개 있으면 같은 tag+class 반복 요소로 인식해서 각 섹션에 삭제 버튼 추가.

**해결책:**
generic 반복 요소 탐지에서 `.detail-wrap`의 직접 자식은 제외.
```javascript
if (parent.classList.contains('detail-wrap')) return;
```

**재발 방지:**
EDITOR_SCRIPT에서 반복 요소 탐지 시 페이지 최상위 레이아웃 컨테이너의 직접 자식은 항상 제외.

---

## 오류 발생 시 기록 양식

새 오류를 발견하면 아래 형식으로 이 파일에 추가한다.

```markdown
### ERR-XXX | 오류 한 줄 요약

**발생 기능:** 어느 기능에서 발생했는지

**오류 메시지:**
(있으면) 실제 오류 메시지

**원인:**
왜 발생했는지

**해결책:**
어떻게 해결했는지

**재발 방지:**
앞으로 이 오류가 생기지 않으려면 무엇을 지켜야 하는지
```
