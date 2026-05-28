'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useProposalAuth } from '@/lib/useProposalAuth'

const STEPS = [
  {
    href: '/proposal/logic',
    step: '1단계',
    title: '로직 발굴',
    description: '원료·아이디어를 입력하면 AI가 기전 분석 및 마케팅 로직을 발굴합니다.',
    detail: '기전 분석 → 사전 체크리스트 → 배타적 차별성 로직 설계',
  },
  {
    href: '/proposal/marketing',
    step: '2단계',
    title: '마케팅 방향성 추출',
    description: '1단계 결과를 바탕으로 타겟군별 마케팅 방향과 언어 가이드를 작성합니다.',
    detail: '타겟군 도출 → 후킹 메시지 → 마케팅 언어 전환 가이드',
  },
  {
    href: '/proposal/final',
    step: '3단계',
    title: '제안서 작성',
    description: '1·2단계 결과를 종합하여 원료 설계 및 최종 기획안 HTML을 생성합니다.',
    detail: '원료 설계 → TPO 시나리오 → 최종 기획안 HTML 출력',
  },
]

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) onUnlock()
      else { setError('비밀번호가 틀렸습니다.'); setPassword('') }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="max-w-sm mx-auto px-6 py-24">
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">접근 비밀번호 입력</h2>
        <p className="text-sm text-gray-400 mb-6">제안서 기능은 별도 비밀번호가 필요합니다.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호" autoFocus
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={isLoading || !password}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {isLoading ? '확인 중...' : '확인'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function ProposalIndexPage() {
  const { isUnlocked, isChecking, unlock } = useProposalAuth()

  if (isChecking) return null

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-base font-semibold text-gray-800">제안서 작성</h1>
      </header>

      {!isUnlocked ? (
        <PasswordGate onUnlock={unlock} />
      ) : (
        <main className="max-w-3xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">단계를 선택하세요</h2>
          <p className="text-gray-500 mb-8">3단계 AI 대화로 상품 기획안을 완성합니다. 순서대로 진행하세요.</p>

          <div className="space-y-4">
            {STEPS.map((step, idx) => (
              <Link
                key={step.href}
                href={step.href}
                className="block bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <span className="shrink-0 w-16 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-2 rounded-xl text-center leading-tight">
                    {step.step}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <span className="text-gray-300 text-sm shrink-0">→</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                    <p className="text-xs text-gray-400 mt-2">{step.detail}</p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1">
                    <span>↓</span>
                    <span>이 단계 완료 후 다음 단계로 진행</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </main>
      )}
    </div>
  )
}
