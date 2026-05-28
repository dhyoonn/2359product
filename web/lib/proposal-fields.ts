export type Section = {
  id: string
  title: string
  fields: Field[]
}

export type Field = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'multiselect'
  options?: string[]
  placeholder?: string
  sameRowAsNext?: boolean
}

export const SECTIONS: Section[] = [
  {
    id: 'basic',
    title: '기본 정보',
    fields: [
      { key: '브랜드명', label: '브랜드명', type: 'text', placeholder: '출시 브랜드명', sameRowAsNext: true },
      { key: '제품명', label: '제품명 (가칭)', type: 'text', placeholder: '제품 가칭' },
      { key: '카테고리', label: '카테고리', type: 'text', placeholder: '예: 스킨케어, 건강기능식품', sameRowAsNext: true },
      { key: '담당자명', label: '담당자명', type: 'text', placeholder: '' },
    ],
  },
  {
    id: 'overview',
    title: '제품 개요',
    fields: [
      { key: '한줄소개', label: '제품 한줄 소개', type: 'text', placeholder: '제품을 한 문장으로 설명해주세요.' },
      { key: '기획의도', label: '기획 의도', type: 'textarea', placeholder: '이 제품을 기획한 배경과 이유를 설명해주세요.' },
      { key: '제품컨셉', label: '제품 컨셉', type: 'textarea', placeholder: '제품의 핵심 컨셉과 방향성을 설명해주세요.' },
    ],
  },
  {
    id: 'target',
    title: '타겟 전략',
    fields: [
      { key: '주요타겟', label: '주요 타겟', type: 'text', placeholder: '예: 20-30대 여성, 민감성 피부' },
      { key: '타겟니즈', label: '타겟 니즈', type: 'textarea', placeholder: '타겟 고객이 가진 문제와 니즈를 설명해주세요.' },
    ],
  },
  {
    id: 'strategy',
    title: '제품 전략',
    fields: [
      { key: '핵심차별점', label: '핵심 차별점 (USP)', type: 'textarea', placeholder: '경쟁 제품 대비 이 제품만의 차별점을 설명해주세요.' },
      { key: '주요소구점', label: '주요 소구점', type: 'textarea', placeholder: '고객에게 강조할 핵심 메시지를 설명해주세요.' },
      { key: '메인성분', label: '메인 성분 / 원료', type: 'textarea', placeholder: '핵심 성분명과 간단한 역할을 입력해주세요.' },
      { key: '제형', label: '제형 / 텍스처', type: 'text', placeholder: '예: 가벼운 워터 젤, 크리미한 에멀전' },
    ],
  },
  {
    id: 'market',
    title: '시장 분석',
    fields: [
      { key: '시장배경', label: '시장 배경', type: 'textarea', placeholder: '관련 시장 트렌드와 기회를 설명해주세요.' },
      { key: '경쟁제품', label: '경쟁 제품 / 레퍼런스', type: 'textarea', placeholder: '주요 경쟁 제품이나 참고 제품을 입력해주세요.' },
      { key: '예상가격대', label: '예상 가격대', type: 'text', placeholder: '예: 30,000~50,000원', sameRowAsNext: true },
      { key: '출시채널', label: '출시 채널', type: 'text', placeholder: '예: 자사몰, 올리브영, 쿠팡' },
    ],
  },
  {
    id: 'schedule',
    title: '일정 및 기타',
    fields: [
      { key: '출시목표', label: '출시 목표 시기', type: 'text', placeholder: '예: 2025년 3분기', sameRowAsNext: true },
      { key: '비고', label: '비고', type: 'text', placeholder: '' },
    ],
  },
]

export function getAllFieldKeys(): string[] {
  return SECTIONS.flatMap((s) => s.fields.map((f) => f.key))
}

export function getDefaultFields(): Record<string, string> {
  return Object.fromEntries(getAllFieldKeys().map((k) => [k, '']))
}
