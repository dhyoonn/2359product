export function buildFinalPlanPrompt(
  initialPlanContent: string,
  specContent: string,
  attachmentContent: string,
  currentDate: string
): string {
  return `당신은 커머스 기업 상품기획팀의 문서 작성 전문가입니다.
아래 자료를 바탕으로 최종 기획안의 일부 섹션을 작성합니다.

작성 원칙:
1. 초기 기획안의 기획 의도와 컨셉을 기반으로 작성하세요.
2. 변경사항은 changes 필드에서만 언급하고, 다른 필드에서는 절대 비교 표현을 쓰지 마세요.
3. 유관부서가 이 제품이 무엇인지, 왜 만들어졌는지 한눈에 파악할 수 있도록 서술하세요.
4. 자료에서 파악할 수 없는 항목은 "정보 없음"으로 표기하세요.
5. 모든 내용은 한국어로 작성하세요.

[초기 기획안]
${initialPlanContent || '(첨부 파일 없음)'}

[기타 첨부자료]
${attachmentContent || '(없음)'}

[최종 SPEC]
${specContent || '(입력 없음)'}

## 출력 형식 (반드시 준수)

아래 JSON을 반환하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

{
  "changes": "초기 기획안 대비 변경된 핵심 항목만 줄바꿈으로 나열. 없으면 '초기 기획안과 동일'",
  "hero_sub": "제품의 핵심 컨셉을 한 문장으로",
  "design_html": "아래 2~5번 섹션을 하나의 HTML 문자열로. CSS 클래스 자유롭게 활용.",
  "appeals": [
    {"title": "소구점 제목", "desc": "소구점 설명"},
    {"title": "소구점 제목", "desc": "소구점 설명"},
    {"title": "소구점 제목", "desc": "소구점 설명"}
  ]
}

## design_html 작성 규칙

design_html에는 아래 4개 섹션을 순서대로 포함하세요.
각 섹션은 <section id="..."> 태그로 감싸고, 다음 CSS 클래스를 자유롭게 활용하세요:
section, section-label, section-title, section-desc,
card, card-gold, card-teal, card-coral, card-purple,
grid-2, grid-3, grid-4,
big-quote, big-quote-teal, evidence, evidence-teal, evidence-coral,
callout, callout-teal, callout-coral,
tag, tag-gold, tag-teal, tag-coral, divider

섹션 목록:
- id="overview" / section-label="02 · Overview" / section-title="제품 개요"
  브랜드명·제품명·카테고리·예상 런칭일·제조사를 grid-4 카드로 배치

- id="intent" / section-label="03 · Intent" / section-title="기획 의도"
  시장 배경·문제 인식·출시 당위성. big-quote로 핵심 문장 강조, evidence로 근거 서술.

- id="concept" / section-label="04 · Concept" / section-title="제품 컨셉"
  핵심 포지셔닝·차별점·한줄 컨셉. callout으로 한줄 컨셉 강조, card-teal로 차별점 나열.

- id="target" / section-label="05 · Target" / section-title="타겟 고객"
  주요 타겟·니즈·추천 대상. tag로 타겟 특성 표현, evidence-teal로 니즈 강조.

## 배경색 규칙
section:nth-child(even)은 자동으로 배경이 달라지므로 배경색을 직접 지정하지 마세요.`
}

export function buildFinalPlanRevisionPrompt(
  userRequest: string,
  currentHtml: string
): string {
  return `[수정 요청]
${userRequest}

[현재 최종 기획안 HTML]
${currentHtml}

수정 요청을 반영하여 전체 HTML을 반환해주세요.

MESSAGE: [1문장]
---HTML---
[수정된 전체 HTML]`
}
