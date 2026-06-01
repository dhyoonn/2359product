'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/admin', {
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">관리자 비밀번호 입력</h2>
        <p className="text-sm text-gray-400 mb-6">관리자 전용 페이지입니다.</p>
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

function AdminDashboard() {
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/temp-code')
      .then((r) => r.json())
      .then((data) => {
        if (data.code) setCode(data.code)
        else setError(data.error || '오류가 발생했습니다.')
      })
      .catch(() => setError('코드를 불러오지 못했습니다.'))
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const dateLabel = `${kst.getUTCFullYear()}년 ${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">오늘의 임시 접근 코드</h2>
        <p className="text-sm text-gray-400 mb-6">
          {dateLabel} 자정까지 유효합니다. 필요한 분께만 공유하세요.
        </p>

        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4 border border-gray-200">
              <span className="text-3xl font-mono font-bold tracking-widest text-gray-900">
                {code || '로딩 중...'}
              </span>
              <button
                onClick={handleCopy}
                disabled={!code}
                className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {copied ? '복사됨 ✓' : '복사'}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              이 코드는 제안서 작성 페이지의 비밀번호 입력란에 사용할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false)

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-base font-semibold text-gray-800">관리자</h1>
      </header>

      {!isUnlocked
        ? <PasswordGate onUnlock={() => setIsUnlocked(true)} />
        : <AdminDashboard />
      }
    </div>
  )
}
