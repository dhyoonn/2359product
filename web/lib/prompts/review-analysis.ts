export type ReviewSource = 'oliveyoung' | 'amazon'

const SOURCE_LABEL: Record<ReviewSource, string> = {
  oliveyoung: '올리브영',
  amazon: '아마존',
}

export function buildReviewAnalysisPrompt(
  productName: string,
  reviews: { rating: number; content: string }[],
  source: ReviewSource = 'oliveyoung'
): string {
  const ratingCounts = [1, 2, 3, 4, 5].map((r) => ({
    score: r,
    count: reviews.filter((rv) => rv.rating === r).length,
  }))
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  const isEnglish = source === 'amazon'

  const reviewText = reviews
    .map((r, i) => `[${i + 1}] 별점 ${r.rating}점\n${r.content}`)
    .join('\n\n')

  return `당신은 커머스 상품기획 전문가입니다. 제품 리뷰 데이터를 분석하여 신제품 기획에 활용할 수 있는 인사이트 리포트를 HTML로 작성합니다.

[분석 데이터]
- 플랫폼: ${SOURCE_LABEL[source]}${productName ? `\n- 제품명: ${productName}` : ''}
- 총 리뷰 수: ${reviews.length}개 / 평균 별점: ${avgRating}점
- 별점 분포: ${ratingCounts.map((r) => `${r.score}점 ${r.count}개`).join(', ')}${isEnglish ? '\n- 리뷰 언어: 영어 (분석 결과는 한국어로 작성)' : ''}

[리뷰 원문]
${reviewText}

---

[분석 지침]
1. 별점 분포: 각 점수(1~5점) 비율(%)과 전체 평균, 한 줄 총평
2. 주요 장점 최대 5개: 반복 언급된 긍정 요소. 키워드 + 설명 + 대표 리뷰 인용 1~2개${isEnglish ? ' (인용은 한국어로 번역)' : ''}
3. 주요 단점 최대 5개: 반복 언급된 부정 요소. 키워드 + 설명 + 대표 리뷰 인용 1~2개${isEnglish ? ' (인용은 한국어로 번역)' : ''}
4. 소비자 미충족 니즈: 직접 언급 또는 불만에서 유추된 해결되지 않은 욕구 3~5개
5. 신제품 기획 인사이트
   - 유지할 요소: 경쟁 제품 강점으로 신제품도 반드시 갖춰야 할 것
   - 개선할 요소: 경쟁 제품 단점을 보완할 구체적 방법
   - 차별화 포인트: 미충족 니즈 기반 신제품만의 기회 영역

[HTML 출력 지침]
- <!DOCTYPE html>부터 </html>까지 완전한 HTML 문서만 출력 (설명·코드블록 없이)
- 모든 텍스트는 한국어로 작성
- 폰트: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif
- 배경: #f3f4f6, 내부 최대 너비 780px, 상하 패딩 40px, 좌우 24px
- 섹션별 흰색 카드 스타일: border-radius 16px, border 1px solid #e5e7eb, padding 24px, margin-bottom 20px
- 장점 항목: 초록 배경(#f0fdf4), 좌측 보더(4px solid #22c55e)
- 단점 항목: 빨간 배경(#fff1f2), 좌측 보더(4px solid #f43f5e)
- 리뷰 인용: 회색 배경(#f9fafb), 이탤릭, 따옴표 처리
- 별점 분포: CSS 막대 차트로 시각화 (JS 라이브러리 사용 금지)
- 신제품 기획 인사이트 섹션 배경: 연한 파란색(#eff6ff), 카드 border-color: #bfdbfe
- 인쇄 시 깔끔하게 나오도록 @media print 스타일 포함`
}
