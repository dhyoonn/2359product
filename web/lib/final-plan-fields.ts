import { type Section, DISTRIBUTION_COUNTRY_OPTIONS } from './dev-request-fields'

export const FINAL_SPEC_SECTIONS: Section[] = [
  {
    id: 'product-spec',
    title: '제품 SPEC',
    fields: [
      { key: '기획_담당자', label: '기획 담당자', type: 'text' },
      { key: '출시_브랜드', label: '출시 브랜드', type: 'text', sameRowAsNext: true },
      { key: '제품명', label: '제품명', type: 'text' },
      { key: '런칭_예정일', label: '런칭 예정일', type: 'date', sameRowAsNext: true },
      { key: '제조사', label: '제조사', type: 'text' },
      { key: '제품_유형', label: '제품 유형', type: 'text' },
      {
        key: '메인_판매_국가',
        label: '메인 판매 국가',
        type: 'multiselect',
        options: DISTRIBUTION_COUNTRY_OPTIONS,
      },
      { key: '제품_컨셉', label: '제품 컨셉', type: 'textarea' },
      { key: '제품_용량', label: '제품 용량', type: 'text', sameRowAsNext: true },
      { key: '실_사용_횟수', label: '실 사용 횟수', type: 'text' },
      { key: '유통기한', label: '유통기한', type: 'text' },
      { key: '주_성분', label: '주 성분 및 함량, 기능', type: 'textarea' },
      { key: '부_성분', label: '부 성분 및 함량, 기능', type: 'textarea' },
      { key: '전성분', label: '전성분', type: 'textarea' },
      { key: '진행_임상_목록', label: '진행 임상 목록', type: 'textarea' },
    ],
  },
]
