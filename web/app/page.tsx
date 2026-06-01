import Link from 'next/link'

const FEATURES = [
  {
    href: '/proposal',
    title: '제안서 작성',
    description: '아이디어·원료를 입력하면 3단계 AI 대화로 상품 기획안을 완성합니다.',
    badge: '사용 가능',
    badgeColor: 'bg-green-100 text-green-700',
    enabled: true,
    locked: true,
  },
  {
    href: '/dev-request',
    title: '개발의뢰서 작성',
    description: '기획안을 붙여넣으면 화장품·식품·공산품 개발의뢰서를 자동으로 작성합니다.',
    badge: '사용 가능',
    badgeColor: 'bg-green-100 text-green-700',
    enabled: true,
  },
  {
    href: '/final-plan',
    title: '최종 기획안 작성',
    description: '초기 기획안과 최종 SPEC을 입력하면 최종 기획안 문서를 생성합니다.',
    badge: '사용 가능',
    badgeColor: 'bg-green-100 text-green-700',
    enabled: true,
  },
  {
    href: '/page-flow',
    title: '상세 페이지 플로우 + 문안',
    description: '기획안과 레퍼런스를 입력하면 상세 페이지 구성과 카피 초안을 작성합니다.',
    badge: '사용 가능',
    badgeColor: 'bg-green-100 text-green-700',
    enabled: true,
  },
  {
    href: '/product-spec',
    title: '제품 사양서 작성',
    description: '확정된 제품 SPEC을 바탕으로 제품 사양서 문서를 자동으로 작성합니다.',
    badge: '사용 가능',
    badgeColor: 'bg-green-100 text-green-700',
    enabled: true,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-800">기획팀 문서 자동화</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">문서를 선택하세요</h2>
        <p className="text-gray-500 mb-8">기획안 내용을 입력하면 AI가 자동으로 문서를 작성합니다.</p>

        <div className="space-y-4">
          {FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className={`block bg-white rounded-2xl border border-gray-200 p-6 transition-shadow ${
                feature.enabled ? 'hover:shadow-md' : 'opacity-60 pointer-events-none'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {'locked' in feature && feature.locked && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${feature.badgeColor}`}>
                    {feature.badge}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── 유틸리티 ── */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">유틸리티</p>
          <div className="space-y-4">
            <Link
              href="/doc-edit"
              className="block bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-gray-100 rounded-xl shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">문서 수정</h3>
                    <p className="text-sm text-gray-500">저장된 HTML 문서를 불러와 텍스트를 직접 수정하고 다시 저장합니다.</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 shrink-0">
                  사용 가능
                </span>
              </div>
            </Link>

            <Link
              href="/admin"
              className="block bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-gray-100 rounded-xl shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">관리자</h3>
                    <p className="text-sm text-gray-500">제안서 임시 접근 코드를 확인하고 공유합니다.</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 shrink-0">
                  관리자 전용
                </span>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
