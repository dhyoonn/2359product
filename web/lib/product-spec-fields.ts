import { type Section } from './dev-request-fields'

export const PRODUCT_SPEC_SECTIONS: Section[] = [
  {
    id: 'basic',
    title: '기본 정보',
    fields: [
      { key: '브랜드명', label: '브랜드명', type: 'text', sameRowAsNext: true },
      { key: '제품명', label: '제품명', type: 'text' },
      { key: '카테고리', label: '카테고리', type: 'text', sameRowAsNext: true },
      { key: '제형', label: '제형', type: 'text' },
      { key: '제조사', label: '제조사', type: 'text', sameRowAsNext: true },
      { key: '제조_국가', label: '제조 국가', type: 'text' },
      { key: '내용량', label: '내용량', type: 'text', sameRowAsNext: true },
      { key: '판매가', label: '판매가', type: 'text' },
      { key: '유통기한', label: '유통기한', type: 'text', sameRowAsNext: true },
      { key: '개봉후_사용기간', label: '개봉 후 사용기간', type: 'text' },
      { key: '보관_방법', label: '보관 방법', type: 'text' },
    ],
  },
  {
    id: 'physical',
    title: '물리화학적 특성',
    fields: [
      { key: '외관_색상', label: '외관 / 색상', type: 'text', sameRowAsNext: true },
      { key: '향', label: '향', type: 'text' },
      { key: 'pH', label: 'pH', type: 'text', sameRowAsNext: true },
      { key: '점도', label: '점도', type: 'text' },
    ],
  },
  {
    id: 'ingredients',
    title: '성분',
    fields: [
      { key: '주요_기능_성분', label: '주요 기능 성분', type: 'textarea' },
      { key: '전성분', label: '전성분 (INCI명)', type: 'textarea' },
    ],
  },
  {
    id: 'packaging',
    title: '용기 / 패키지',
    fields: [
      { key: '1차_용기', label: '1차 용기', type: 'textarea' },
      { key: '2차_용기', label: '2차 용기', type: 'textarea' },
    ],
  },
  {
    id: 'certification',
    title: '인증 / 허가',
    fields: [
      {
        key: '기능성_화장품',
        label: '기능성 화장품',
        type: 'select',
        options: ['해당 없음', '여드름기능성', '주름기능성', '미백기능성', '자외선차단기능성', '탈모기능성'],
      },
      {
        key: '인증',
        label: '인증',
        type: 'multiselect',
        options: ['EWG GREEN', '화해', '비건', 'COSMOS', 'HALAL', 'USDA Organic', '기타'],
      },
      { key: '허가_번호', label: '허가 번호', type: 'text' },
    ],
  },
  {
    id: 'usage',
    title: '사용 방법',
    fields: [
      { key: '사용_방법', label: '사용 방법', type: 'textarea' },
      { key: '주의_사항', label: '주의 사항', type: 'textarea' },
    ],
  },
]
