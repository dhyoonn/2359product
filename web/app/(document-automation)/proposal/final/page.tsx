import ProposalChatUI from '@/components/ProposalChatUI'

export default function FinalPage() {
  return (
    <ProposalChatUI
      title="제안서 — 3단계: 제안서 작성"
      config={{
        apiPath: '/api/proposal/final',
        downloadPrefix: '제안서',
        emptyTitle: '1단계 + 2단계 결과 파일을 첨부하세요',
        emptyDesc: '두 파일을 함께 첨부하면 원료 설계부터\n최종 기획안 HTML까지 한 번에 작성합니다',
        placeholder: '파일 2개를 첨부하고 추가 요청 사항을 입력하세요 (없으면 바로 전송)',
        continuePlaceholder: '원료 변경, 섹션 수정 요청을 입력하세요...',
        multiFile: true,
        fileLabel: '1단계·2단계 HTML 파일 첨부 (최대 2개)',
      }}
    />
  )
}
