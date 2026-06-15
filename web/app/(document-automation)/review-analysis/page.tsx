'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import type { ReviewSource } from '@/lib/prompts/review-analysis'

const SOURCE_CONFIG: Record<ReviewSource, { label: string; accept: string; hint: string }> = {
  oliveyoung: { label: '올리브영', accept: '.xlsx,.xls', hint: '.xlsx, .xls' },
  amazon:     { label: '아마존',   accept: '.csv',       hint: '.csv' },
  qutenjp:    { label: '큐텐JP',  accept: '.xlsx,.xls', hint: '.xlsx, .xls' },
}

export default function ReviewAnalysisPage() {
  const [productName, setProductName] = useState('')
  const [source, setSource] = useState<ReviewSource>('oliveyoung')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultHtml, setResultHtml] = useState('')
  const [reviewCount, setReviewCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSourceChange = useCallback((s: ReviewSource) => {
    setSource(s)
    setAttachedFile(null)
    setError('')
    setResultHtml('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachedFile(e.target.files?.[0] ?? null)
    setError('')
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!attachedFile) {
      setError('파일을 첨부해주세요.')
      return
    }
    setIsLoading(true)
    setError('')
    setResultHtml('')

    const formData = new FormData()
    formData.append('file', attachedFile)
    formData.append('productName', productName)
    formData.append('source', source)

    try {
      const res = await fetch('/api/review-analysis', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '오류가 발생했습니다. 다시 시도해주세요.')
        return
      }
      setResultHtml(data.html)
      setReviewCount(data.reviewCount)
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }, [attachedFile, productName, source])

  const handleDownload = useCallback(() => {
    if (!resultHtml) return
    const today = new Date()
    const yy = String(today.getFullYear()).slice(2)
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const name = productName || '제품'
    const blob = new Blob([resultHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${yy}${mm}${dd}_리뷰분석_${name}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [resultHtml, productName])

  const cfg = SOURCE_CONFIG[source]

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-base font-semibold text-gray-800">리뷰 분석</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-1.5">경쟁 제품명 <span className="text-gray-400 font-normal">(선택)</span></h2>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="예: OOO 겨드랑이 톤업크림"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-1.5">리뷰 출처</h2>
            <div className="flex gap-2">
              {(Object.keys(SOURCE_CONFIG) as ReviewSource[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSourceChange(s)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    source === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {SOURCE_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-1.5">리뷰 파일 첨부</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept={cfg.accept}
              className="hidden"
              onChange={handleFileChange}
            />
            {attachedFile ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="text-sm text-blue-700 flex-1 truncate">{attachedFile.name}</span>
                <button
                  onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="text-blue-400 hover:text-blue-600 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                클릭하여 파일 선택 ({cfg.hint})
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleAnalyze}
            disabled={isLoading || !attachedFile}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '분석 중...' : '리뷰 분석 시작'}
          </button>
        </section>

        {isLoading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">AI가 리뷰를 분석하고 있습니다...</p>
            <p className="text-xs text-gray-400 mt-1">리뷰 수에 따라 30~60초 소요됩니다</p>
          </div>
        )}

        {resultHtml && !isLoading && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800">분석 결과</h2>
                <p className="text-xs text-gray-400 mt-0.5">리뷰 {reviewCount}개 분석 완료</p>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
              >
                내보내기
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-200">
              <iframe
                srcDoc={resultHtml}
                className="w-full"
                style={{ height: '80vh' }}
                title="리뷰 분석 결과"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                내보내기
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
