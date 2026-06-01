'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'

const TEXT_SELS = [
  /* 표준 태그 */
  'h1','h2','h3','h4','h5','h6','p','li','td','th','dt','dd','blockquote','figcaption',
  /* page-flow AKKBELL */
  '.s-eyebrow','.s-desc','.big-quote','.hero-sub','.hero-cat','.brand-name','.hero-eyebrow',
  '.trust-card .lbl','.trust-card .val',
  '.big-stat','.big-stat-lbl','.big-stat-src',
  '.faq-q','.faq-a',
  '.tl-week .num','.tl-week .unit','.tl-content h5','.tl-content p',
  '.bar-label','.pct','.authority-card .src',
  '.ingredient-head .info .role','.ingredient-dose','.badge',
  '.pain-item > div',
  '.review-stars','.review-user','.review-card h5','.review-card p',
  '.price-option .info h5','.price-option .info .pack',
  '.price-option .info .save','.price-option .price .original','.price-option .price .now',
  '.cert-card .name','.layer-box h4','.layer-chain .node',
  '.step h3','.step p','.quote-box p','.cite','.tag',
  '.vs-bad h3','.vs-bad p','.vs-good h3','.vs-good p',
  '.synergy-final p','.synergy-final .lbl',
  '.compare-row .col',
  '.sticky-cta .price-info .lbl','.sticky-cta .price-info .amount',
  /* 최종 기획안 */
  '.section-title','.section-desc','.card h3','.card p','.card-label',
  '.evidence p','.evidence-title','.callout p','.callout-label',
  '.hero-meta-item strong','.stat-val','.stat-label',
  '.formula-name','.formula-role',
].join(',')

const BLOCK_TAGS = new Set([
  'div','section','article','header','footer','ul','ol','table','tbody','tr','form','nav',
])

export default function DocEditPage() {
  const [srcDoc, setSrcDoc] = useState('')
  const [fileName, setFileName] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasDoc = !!srcDoc

  /* ── 스크립트 주입 없이 부모에서 직접 iframe DOM 조작 ── */
  const injectEditor = useCallback(() => {
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!doc?.body) return
    if (doc.body.dataset.editInit) return
    doc.body.dataset.editInit = '1'

    // hover/focus 시각 표시 스타일 추가
    const style = doc.createElement('style')
    style.id = '__edit-style'
    style.textContent = [
      '[contenteditable]:hover{outline:2px dashed rgba(59,130,246,0.5)!important;border-radius:3px!important;cursor:text!important}',
      '[contenteditable]:focus{outline:2px solid rgba(59,130,246,0.85)!important;border-radius:3px!important;outline-offset:1px!important}',
    ].join('')
    doc.head.appendChild(style)

    // 텍스트 요소 contentEditable 적용
    doc.querySelectorAll(TEXT_SELS).forEach((el) => {
      if (el.closest('button,input,select,textarea,a[href]')) return
      ;(el as HTMLElement).contentEditable = 'true'
      ;(el as HTMLElement).spellcheck = false
    })

    // 리프 div/span (레퍼런스 모드·제안서 커스텀 요소)
    doc.querySelectorAll('div, span').forEach((el) => {
      const h = el as HTMLElement
      if (h.contentEditable === 'true') return
      if (el.closest('button,input,select,textarea')) return
      const hasBlock = Array.from(el.children).some((c) => BLOCK_TAGS.has(c.tagName.toLowerCase()))
      if (!hasBlock && el.children.length === 0 && el.textContent?.trim()) {
        h.contentEditable = 'true'
        h.spellcheck = false
      }
    })
  }, [])

  /* ── srcDoc 변경 시 onLoad 타이밍 놓쳤을 경우 보완 ── */
  useEffect(() => {
    if (!srcDoc) return
    const raf = requestAnimationFrame(() => injectEditor())
    return () => cancelAnimationFrame(raf)
  }, [srcDoc, injectEditor])

  const loadFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.html')) {
      alert('HTML 파일만 첨부할 수 있습니다.')
      return
    }
    const text = await file.text()
    setSrcDoc(text)
    setFileName(file.name)
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await loadFile(file)
    e.target.value = ''
  }, [loadFile])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) await loadFile(file)
  }, [loadFile])

  const handleDownload = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.documentElement) return

    const clone = iframe.contentDocument.documentElement.cloneNode(true) as HTMLElement
    clone.querySelectorAll('[contenteditable]').forEach((e) => e.removeAttribute('contenteditable'))
    clone.querySelectorAll('script').forEach((e) => e.remove())
    clone.querySelector('#__edit-style')?.remove()

    const blob = new Blob(['<!DOCTYPE html>\n' + clone.outerHTML], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }, [fileName])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-semibold text-gray-800">문서 수정</h1>
          {hasDoc && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-500 truncate max-w-xs">{fileName}</span>
            </>
          )}
        </div>
        {hasDoc && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full hidden sm:block">
              텍스트 클릭 → 바로 수정
            </span>
            <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 cursor-pointer transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              다른 파일 열기
              <input ref={fileInputRef} type="file" accept=".html" className="hidden" onChange={handleFileChange} />
            </label>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              HTML 저장
            </button>
          </div>
        )}
      </header>

      {!hasDoc ? (
        /* ── 파일 업로드 화면 ── */
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-lg">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <svg className="mx-auto mb-4 text-gray-300" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <p className="text-gray-700 font-medium mb-1">수정할 HTML 파일을 첨부하세요</p>
              <p className="text-sm text-gray-400 mb-6">드래그 앤 드롭 또는 버튼으로 선택</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 cursor-pointer transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                파일 선택
                <input type="file" accept=".html" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            <div className="mt-6 px-2">
              <p className="text-xs font-medium text-gray-500 mb-2">사용 가능한 문서</p>
              <div className="flex flex-wrap gap-2">
                {['제안서', '개발의뢰서', '최종 기획안', '상세 페이지 플로우 + 문안'].map((doc) => (
                  <span key={doc} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{doc}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── 편집 iframe ── */
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          onLoad={injectEditor}
          className="flex-1 w-full border-0"
          title="문서 편집"
        />
      )}
    </div>
  )
}
