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
      </main>
    </div>
  )
}
