export type ProductType = 'cosmetics' | 'food' | 'industrial' | 'medical'

export interface ConditionalSubField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'multiselect'
  options?: string[]
  placeholder?: string
}

export interface ConditionalField {
  whenValue: string
  fields: ConditionalSubField[]
}

export interface Field {
  key: string
  label: string
  type: 'text' | 'textarea' | 'multiselect' | 'select' | 'date'
  options?: string[]
  defaultValue?: string
  conditionalField?: ConditionalField
  sameRowAsNext?: boolean
}

export interface Section {
  id: string
  title: string
  fields: Field[]
}

export const DISTRIBUTION_COUNTRY_OPTIONS = [
  '국내',
  '북미',
  '일본',
  '대만·홍콩',
  '동남아(필리핀·말레이시아·베트남·태국·싱가포르·인도네시아)',
  '영국(SCPN)',
  'EU(CPNP)',
]

const PRODUCT_TYPE_FIELD: Partial<Record<ProductType, Field>> = {
  cosmetics: {
    key: '제품_유형',
    label: '제품 유형',
    type: 'multiselect',
    options: ['일반화장품', '여드름기능성', '주름기능성', '미백기능성', '자외선차단기능성', '탈모기능성'],
  },
  food: {
    key: '제품_유형',
    label: '제품 유형',
    type: 'multiselect',
    options: ['일반식품', '건강기능식품'],
  },
}

function getCommonSections(productType: ProductType): Section[] {
  const productTypeField = PRODUCT_TYPE_FIELD[productType]

  const overviewFields: Field[] = [
    { key: '제품명안', label: '제품명(예정)', type: 'text' },
    { key: '의뢰일', label: '의뢰일', type: 'date', sameRowAsNext: true },
    { key: '희망_샘플_수령일', label: '희망 샘플 수령일', type: 'date' },
    { key: '출시예정일', label: '목표 발주일', type: 'date', sameRowAsNext: true },
    { key: '희망_견적가', label: '희망 견적가', type: 'text' },
    { key: '출시_브랜드', label: '출시 브랜드', type: 'text', sameRowAsNext: true },
    { key: '발주_수량', label: '발주 수량', type: 'text' },
    ...(productType === 'cosmetics' || productType === 'food'
      ? [
          {
            key: '유통국가_메인',
            label: '메인 판매 국가',
            type: 'multiselect',
            options: DISTRIBUTION_COUNTRY_OPTIONS,
            defaultValue: '국내',
          } as Field,
          {
            key: '유통국가_서브',
            label: '수출 스크리닝 국가',
            type: 'multiselect',
            options: ['모두', ...DISTRIBUTION_COUNTRY_OPTIONS],
            defaultValue: `모두, ${DISTRIBUTION_COUNTRY_OPTIONS.join(', ')}`,
          } as Field,
        ]
      : [
          {
            key: '유통국가_채널',
            label: '유통국가/채널',
            type: 'multiselect',
            options: DISTRIBUTION_COUNTRY_OPTIONS,
          } as Field,
        ]),
    { key: '타겟_성별_연령', label: '타겟 성별 및 연령', type: 'text' },
    ...(productType !== 'medical' ? [
      { key: '제품_컨셉', label: '제품 컨셉', type: 'textarea' } as Field,
    ] : []),
    ...(productTypeField ? [productTypeField] : []),
    { key: '제품_용량', label: productType === 'cosmetics' ? '제품 용량' : '제품 구성', type: 'text' },
    ...(productType !== 'food' && productType !== 'cosmetics' ? [
      { key: '구성', label: '포장사양', type: 'text' } as Field,
    ] : []),
    ...(productType !== 'industrial' ? [
      { key: '용기_사양', label: '1차 용기 사양', type: 'textarea' } as Field,
      { key: '부자재_사양', label: '2차 용기 사양', type: 'textarea' } as Field,
    ] : []),
    ...(productType === 'cosmetics' ? [
      { key: '구성', label: '포장사양', type: 'text' } as Field,
    ] : []),
    {
      key: '납품_방식',
      label: '부자재 납품 방식',
      type: 'select',
      options: ['턴키', '사급'],
      conditionalField: {
        whenValue: '사급',
        fields: [{ key: '납품_방식_세부사항', label: '사급 세부사항', type: 'textarea', placeholder: '사급 세부사항을 입력해주세요.' }],
      },
    },
  ]

  return [
    { id: 'overview', title: '개발제품 개요', fields: overviewFields },
    ...(productType !== 'medical' ? [{
      id: 'reference',
      title: '참고제품',
      fields: [
        { key: '참고_타겟1', label: '타겟 1', type: 'textarea' },
        { key: '참고_타겟2', label: '타겟 2', type: 'textarea' },
        ...(productType === 'industrial' ? [
          { key: '타겟제품_특징', label: '타겟제품 특징', type: 'textarea' } as Field,
        ] : []),
      ],
    } as Section] : []),
  ]
}

const COMMON_ETC_SECTION: Section = {
  id: 'etc',
  title: '기타 사항',
  fields: [
    { key: '담당자명', label: '담당자명', type: 'text', sameRowAsNext: true },
    { key: '담당자_연락처', label: '연락처', type: 'text' },
    { key: '샘플_수령_장소', label: '샘플 수령 장소', type: 'text', defaultValue: '서울특별시 강남구 학동로23길 18, M층' },
    { key: '기타_사항', label: '기타 사항', type: 'textarea' },
  ],
}

const COSMETICS_SECTIONS: Section[] = [
  {
    id: 'contents',
    title: '내용물 요청사항',
    fields: [
      {
        key: '카테고리',
        label: '카테고리',
        type: 'select',
        options: ['스킨케어', '바디케어', '헤어케어', '메이크업', '기타'],
        conditionalField: {
          whenValue: '기타',
          fields: [{ key: '카테고리_기타', label: '기타 직접 입력', type: 'textarea', placeholder: '카테고리를 직접 입력해주세요.' }],
        },
      },
      { key: '제형', label: '제형', type: 'text' },
      { key: '타입', label: '타입', type: 'select', options: ['Wash-off', 'Leave-on'] },
      {
        key: '색상',
        label: '색상',
        type: 'select',
        options: ['색상있음', '색상없음'],
        conditionalField: {
          whenValue: '색상있음',
          fields: [
            { key: '색소_유형', label: '색소 유형', type: 'select', options: ['천연색소 사용', '인공색소 사용가능'] },
            { key: '색상_상세', label: '원하는 색상', type: 'text', placeholder: '원하는 색상을 입력해주세요.' },
          ],
        },
      },
      { key: '향_종류_강도', label: '향 (종류, 강도)', type: 'text' },
      { key: '수분감', label: '수분감(1-5점)', type: 'select', options: ['1', '2', '3', '4', '5'] },
      { key: '유분감', label: '유분감(1-5점)', type: 'select', options: ['1', '2', '3', '4', '5'] },
      { key: '자극감', label: '자극감(1-5점)', type: 'select', options: ['1', '2', '3', '4', '5'] },
      { key: '점도', label: '점도(1-5점)', type: 'select', options: ['1', '2', '3', '4', '5'] },
      { key: '개발_요구사항', label: '개발 요구사항', type: 'textarea' },
    ],
  },
  {
    id: 'ingredients',
    title: '성분',
    fields: [
      { key: '필수_성분', label: '필수 성분', type: 'textarea' },
      { key: '요청_성분', label: '요청(컨셉) 성분', type: 'textarea' },
      { key: '배제_성분', label: '배제 성분', type: 'textarea' },
      { key: '희망_인증_임상', label: '진행 예정 인증 및 임상', type: 'textarea' },
      {
        key: 'EWG_등급',
        label: '준수 필요',
        type: 'multiselect',
        options: ['EWG GREEN', '화해', '비건', '수출국가 확인', '기타'],
        conditionalField: {
          whenValue: '기타',
          fields: [{ key: 'EWG_등급_기타', label: '기타 직접 입력', type: 'textarea', placeholder: '기타 준수사항을 입력해주세요.' }],
        },
      },
      { key: '희망_유통_기한', label: '희망 유통 기한', type: 'text', defaultValue: '36개월' },
    ],
  },
]

const FOOD_SECTIONS: Section[] = [
  {
    id: 'contents',
    title: '내용물 요청사항',
    fields: [
      { key: '제형', label: '제형', type: 'text' },
      { key: '기능성_메인_원료', label: '기능성/메인 원료', type: 'textarea' },
      { key: '부원료', label: '부원료', type: 'textarea' },
      { key: '개발_요구사항', label: '개발 요구사항', type: 'textarea' },
    ],
  },
]

const INDUSTRIAL_SECTIONS: Section[] = [
  {
    id: 'product',
    title: '제품 요청사항',
    fields: [
      { key: '제품_특징', label: '제품 특징', type: 'textarea' },
      { key: '개발_요구사항', label: '개발 요구사항', type: 'textarea' },
    ],
  },
]

const MEDICAL_SECTIONS: Section[] = [
  {
    id: 'product',
    title: '제품 요청사항',
    fields: [
      { key: '제품_특징', label: '제품 특징', type: 'textarea' },
      { key: '개발_요구사항', label: '개발 요구사항', type: 'textarea' },
    ],
  },
]

const TYPE_SPECIFIC_SECTIONS: Record<ProductType, Section[]> = {
  cosmetics: COSMETICS_SECTIONS,
  food: FOOD_SECTIONS,
  industrial: INDUSTRIAL_SECTIONS,
  medical: MEDICAL_SECTIONS,
}

export function getSections(productType: ProductType): Section[] {
  return [...getCommonSections(productType), ...TYPE_SPECIFIC_SECTIONS[productType], COMMON_ETC_SECTION]
}

export function getAllFieldKeys(productType: ProductType): string[] {
  return getSections(productType).flatMap((s) =>
    s.fields.flatMap((f) => [
      f.key,
      ...(f.conditionalField ? f.conditionalField.fields.map((cf) => cf.key) : []),
    ])
  )
}

export function getDefaultFields(productType: ProductType): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const section of getSections(productType)) {
    for (const field of section.fields) {
      if (field.defaultValue) defaults[field.key] = field.defaultValue
    }
  }
  return defaults
}

export function getFieldConstraintsForPrompt(productType: ProductType): string {
  const lines: string[] = []
  for (const section of getSections(productType)) {
    for (const field of section.fields) {
      if (field.type === 'multiselect' && field.options) {
        lines.push(`- ${field.key}: 다음 옵션 중 해당하는 것을 쉼표로 구분하여 작성. 옵션: ${field.options.join(', ')}`)
      } else if (field.type === 'select' && field.options) {
        lines.push(`- ${field.key}: 다음 중 하나만 작성. 옵션: ${field.options.join(', ')}`)
      }
      if (field.defaultValue) {
        lines.push(`- ${field.key}: 기본값 "${field.defaultValue}"으로 고정`)
      }
      if (field.conditionalField) {
        for (const cf of field.conditionalField.fields) {
          if (cf.type === 'select' && cf.options) {
            lines.push(`- ${cf.key}: ${field.key}가 "${field.conditionalField.whenValue}"일 때만 작성. 다음 중 하나만 작성. 옵션: ${cf.options.join(', ')}. 해당하지 않으면 빈 문자열("")로 남기세요.`)
          } else if (cf.type === 'multiselect' && cf.options) {
            lines.push(`- ${cf.key}: ${field.key}가 "${field.conditionalField.whenValue}"일 때만 작성. 다음 옵션 중 해당하는 것을 쉼표로 구분하여 작성. 옵션: ${cf.options.join(', ')}. 해당하지 않으면 빈 문자열("")로 남기세요.`)
          } else {
            lines.push(`- ${cf.key}: ${field.key}가 "${field.conditionalField.whenValue}"일 때만 작성. 해당하지 않으면 빈 문자열("")로 남기세요.`)
          }
        }
      }
    }
  }
  return lines.join('\n')
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  cosmetics: '화장품',
  food: '식품·건기식',
  industrial: '공산품',
  medical: '의료기기',
}
