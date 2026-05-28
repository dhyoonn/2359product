import ProposalChatUI from '@/components/ProposalChatUI'

export default function MarketingPage() {
  return (
    <ProposalChatUI
      title="제안서 — 2단계: 마케팅 방향성 추출"
      config={{
        apiPath: '/api/proposal/marketing',
        downloadPrefix: '마케팅방향성',
        emptyTitle: '1단계 로직 발굴 결과 파일을 첨부하세요',
        emptyDesc: '1단계에서 다운로드한 HTML 파일을 첨부하면\n타겟군 도출 → 마케팅 방향성 → 언어 가이드를 작성합니다',
        placeholder: '파일을 첨부하고 추가 요청 사항을 입력하세요 (없으면 바로 전송)',
        continuePlaceholder: '타겟 추가, 언어 수정 요청을 입력하세요...',
        fileLabel: '1단계 HTML 파일 첨부',
      }}
    />
  )
}
