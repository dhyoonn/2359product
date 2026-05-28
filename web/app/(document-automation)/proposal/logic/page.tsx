import ProposalChatUI from '@/components/ProposalChatUI'

export default function LogicPage() {
  return (
    <ProposalChatUI
      title="제안서 — 1단계: 로직 발굴"
      config={{
        apiPath: '/api/proposal/logic',
        downloadPrefix: '로직발굴',
        emptyTitle: '원료명이나 제품 아이디어를 입력하세요',
        emptyDesc: 'AI가 기전 분석 → 체크리스트 → 마케팅 로직을\n순서대로 발굴합니다 (최소 2~6개)',
        placeholder: `우리가 잘한 방식을 바탕으로 위 영양제를 기획하고 싶어.

[우리가 잘 한 방식]
간 기능성 영양제를 다이어트 제품으로 판매.
주요 기전 : 간은 원래 알코올 분해 뿐만 아니라 지방 분해의 역할도 하는데, 너가 술 마실 때 술 살이 붙는 이유는 간이 알코올 분해를 하느라 지방 분해 역할을 못하고 있어서야. 그래서 이 제품을 먹으면 간 기능이 회복 또는 대폭적으로 좋아져서 알콜도 분해하고 지방도 분해하기 때문에 술 먹으면서 안주빨을 세워도 살이 찌지 않음.

위와 같은 방식으로 위 건강 영양제를 다이어트 제품으로 판매하기 위한 로직을 만들어줘`,
        continuePlaceholder: '로직 추가, 수정 요청을 입력하세요...',
      }}
    />
  )
}
