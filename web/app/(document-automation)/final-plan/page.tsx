'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { FormSection } from '@/components/FormSection'
import { ScreeningStatusTable, SCREENING_STATUSES } from '@/components/ScreeningStatusTable'
import { FileAttachSection, type NotionItem } from '@/components/FileAttachSection'
import { FINAL_SPEC_SECTIONS } from '@/lib/final-plan-fields'
import { type Field } from '@/lib/dev-request-fields'

const SCREENING_KEY = '수출_스크리닝_상태'
const REVISION_DELIMITER = '---HTML---'

export default function FinalPlanPage() {
  const [initialPlanFiles, setInitialPlanFiles] = useState<File[]>([])
  const [initialPlanNotion, setInitialPlanNotion] = useState<NotionItem[]>([])
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [attachmentNotion, setAttachmentNotion] = useState<NotionItem[]>([])
  const [specFields, setSpecFields] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [currentHtml, setCurrentHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [revisionInput, setRevisionInput] = useState('')
  const [isRevising, setIsRevising] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const savedSelectionRef = useRef<Range | null>(null)

  const handleFieldChange = useCallback((key: string, value: string) => {
    setSpecFields((prev) => ({ ...prev, [key]: value }))
  }, [])

  const addFiles = (setter: React.Dispatch<React.SetStateAction<File[]>>) => (newFiles: FileList) => {
    const arr = Array.from(newFiles)
    setter((prev) => {
      const existingNames = new Set(prev.map((f) => f.name))
      return [...prev, ...arr.filter((f) => !existingNames.has(f.name))]
    })
  }

  const removeFile = (setter: React.Dispatch<React.SetStateAction<File[]>>) => (index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index))
  }

  const addNotion = (setter: React.Dispatch<React.SetStateAction<NotionItem[]>>) => (item: NotionItem) => {
    setter((prev) => [...prev, item])
  }

  const removeNotion = (setter: React.Dispatch<React.SetStateAction<NotionItem[]>>) => (index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index))
  }

  const handleIframeLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    doc.designMode = 'on'
    doc.addEventListener('selectionchange', () => {
      const sel = doc.getSelection()
      if (sel && sel.rangeCount > 0) {
        savedSelectionRef.current = sel.getRangeAt(0).cloneRange()
      }
    })
  }, [])

  // toolbar 버튼 클릭 시 iframe 내 선택 영역 복원 후 명령 실행
  const execCmd = useCallback((cmd: string, value?: string) => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    const sel = doc.getSelection()
    if (sel) {
      if (savedSelectionRef.current) {
        try {
          sel.removeAllRanges()
          sel.addRange(savedSelectionRef.current)
        } catch { /* stale range */ }
      } else if (doc.body) {
        const range = doc.createRange()
        range.selectNodeContents(doc.body)
        range.collapse(false)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
    doc.execCommand(cmd, false, value ?? '')
  }, [])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => execCmd('insertImage', ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [execCmd])

  // 편집된 현재 iframe 내용을 가져옴 (다운로드 / AI 수정 요청에 사용)
  const getEditedHtml = useCallback((): string => {
    const docEl = iframeRef.current?.contentDocument?.documentElement
    return docEl ? '<!DOCTYPE html>\n' + docEl.outerHTML : currentHtml
  }, [currentHtml])

  // 최초 생성: JSON 응답 방식
  const handleGenerateFetch = useCallback(async (formData: FormData) => {
    setGenerateError('')
    try {
      const res = await fetch('/api/final-plan', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setGenerateError(data.error ?? '오류가 발생했습니다.')
        return
      }
      setCurrentHtml(data.html)
      setShowPreview(true)
      savedSelectionRef.current = null
    } catch {
      setGenerateError('네트워크 오류가 발생했습니다.')
    }
  }, [])

  // 수정 요청: 스트리밍 방식 유지
  const handleRevisionStream = useCallback(async (formData: FormData, onDone?: () => void) => {
    const controller = new AbortController()
    abortControllerRef.current = controller
    setStatusMsg('')
    setGenerateError('')

    try {
      const res = await fetch('/api/final-plan', { method: 'POST', body: formData, signal: controller.signal })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setGenerateError(data.error ?? '오류가 발생했습니다.')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let htmlBuffer = ''
      let htmlStarted = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        if (!htmlStarted) {
          const delimIdx = buffer.indexOf(REVISION_DELIMITER)
          if (delimIdx !== -1) {
            htmlStarted = true
            const msg = buffer.slice(0, delimIdx).replace(/^MESSAGE:\s*/s, '').trim()
            setStatusMsg(msg)
            htmlBuffer = buffer.slice(delimIdx + REVISION_DELIMITER.length)
          } else {
            setStatusMsg(buffer.replace(/^MESSAGE:\s*/, ''))
          }
        } else {
          htmlBuffer += chunk
        }
      }

      const htmlStart = htmlBuffer.search(/<!DOCTYPE/i)
      if (htmlStart !== -1) {
        let html = htmlBuffer.slice(htmlStart).trim()
        if (!/<\/html>/i.test(html)) html += '\n</body></html>'
        setCurrentHtml(html)
        setShowPreview(true)
        setStatusMsg('')
        savedSelectionRef.current = null
      }
      onDone?.()
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatusMsg('생성이 중지되었습니다.')
      } else {
        setGenerateError('네트워크 오류가 발생했습니다.')
      }
    } finally {
      abortControllerRef.current = null
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setCurrentHtml('')
    setShowPreview(false)

    const formData = new FormData()
    initialPlanFiles.forEach((f) => formData.append('initialFiles', f))
    attachmentFiles.forEach((f) => formData.append('attachmentFiles', f))
    const notionTexts = [...initialPlanNotion, ...attachmentNotion].map((n) => n.text).join('\n\n')
    if (notionTexts) formData.append('notionContent', notionTexts)
    formData.append('specFields', JSON.stringify(specFields))

    await handleGenerateFetch(formData)
    setIsGenerating(false)
  }, [initialPlanFiles, attachmentFiles, initialPlanNotion, attachmentNotion, specFields, handleGenerateFetch])

  const handleRevise = useCallback(async () => {
    if (!revisionInput.trim() || !currentHtml) return
    setIsRevising(true)
    const req = revisionInput
    setRevisionInput('')

    const formData = new FormData()
    formData.append('currentHtml', getEditedHtml())
    formData.append('revisionRequest', req)

    await handleRevisionStream(formData, () => setIsRevising(false))
    setIsRevising(false)
  }, [revisionInput, currentHtml, getEditedHtml, handleRevisionStream])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const handlePrint = useCallback(() => {
    iframeRef.current?.contentWindow?.print()
  }, [])

  const handleDownload = useCallback(() => {
    const html = getEditedHtml()
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const today = new Date()
    const yy = String(today.getFullYear()).slice(2)
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const brand = specFields['출시_브랜드'] || '브랜드명'
    const product = specFields['제품명'] || '제품명'
    a.download = `${yy}${mm}${dd}_최종기획안_${brand}_${product}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [getEditedHtml, specFields])

  const handleExportSpec = useCallback(() => {
    const today = new Date()
    const yy = String(today.getFullYear()).slice(2)
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const brand = specFields['출시_브랜드'] || '브랜드명'
    const product = specFields['제품명'] || '제품명'

    const renderValue = (field: Field, val: string): string => {
      if ((field.type === 'select' || field.type === 'multiselect') && field.options) {
        const selected = field.type === 'select' ? [val] : val.split(',').map((v) => v.trim()).filter(Boolean)
        if (selected.length === 0) return `<span style="font-size:13px;color:#d1d5db">—</span>`
        return selected.map((opt) =>
          `<span style="display:inline-block;margin:2px 3px;padding:4px 10px;background:#2563eb;color:#fff;border-radius:6px;font-size:11px">${opt}</span>`
        ).join('')
      }
      return `<span style="font-size:13px;color:${val ? '#1f2937' : '#d1d5db'}">${val ? val.replace(/\n/g, '<br>') : '—'}</span>`
    }

    const renderRow = (label: string, content: string): string => `
      <div style="display:flex;gap:16px;align-items:flex-start;padding:10px 20px;border-bottom:1px solid #f3f4f6">
        <span style="flex-shrink:0;width:160px;font-size:11px;color:#6b7280;padding-top:4px">${label}</span>
        <div style="flex:1">${content}</div>
      </div>`

    const specHtml = FINAL_SPEC_SECTIONS.map((section) => {
      const rowsHtml = section.fields.map((field) =>
        renderRow(field.label, renderValue(field, specFields[field.key] ?? ''))
      ).join('')
      return `
        <div style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:20px">
          <div style="background:#f9fafb;border-bottom:1px solid #e5e7eb;padding:10px 20px">
            <span style="font-size:13px;font-weight:600;color:#374151">${section.title}</span>
          </div>${rowsHtml}
        </div>`
    }).join('')

    const screeningRaw = specFields[SCREENING_KEY] ?? ''
    let screeningHtml = ''
    if (screeningRaw) {
      const statusColorMap: Record<string, string> = { pass: '#16a34a', fail: '#ef4444', pending: '#6b7280' }
      try {
        const parsed = JSON.parse(screeningRaw) as Record<string, { status: string; reason?: string }>
        const rows = Object.entries(parsed).map(([country, entry]) => {
          const statusLabel = SCREENING_STATUSES.find((s) => s.value === entry.status)?.label ?? entry.status
          const color = statusColorMap[entry.status] ?? '#6b7280'
          return `
            <div style="display:flex;gap:16px;align-items:flex-start;padding:10px 20px;border-bottom:1px solid #f3f4f6">
              <span style="flex-shrink:0;width:160px;font-size:11px;color:#6b7280;padding-top:4px">${country}</span>
              <div>
                <span style="display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:500;background:${color}20;color:${color};border:1px solid ${color}40">${statusLabel}</span>
                ${entry.reason ? `<div style="margin-top:4px;font-size:11px;color:#6b7280">${entry.reason}</div>` : ''}
              </div>
            </div>`
        }).join('')
        screeningHtml = `
          <div style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:20px">
            <div style="background:#f9fafb;border-bottom:1px solid #e5e7eb;padding:10px 20px">
              <span style="font-size:13px;font-weight:600;color:#374151">수출 스크리닝 상태</span>
            </div>${rows}
          </div>`
      } catch { /* 파싱 실패 시 생략 */ }
    }

    const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><title>${yy}${mm}${dd}_최종SPEC_${brand}_${product}</title></head>
<body style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;background:#f3f4f6;margin:0;padding:40px 24px">
  <div style="max-width:720px;margin:0 auto">
    <div style="margin-bottom:24px">
      <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 4px">최종 SPEC — ${brand} ${product}</h1>
      <span style="font-size:13px;color:#6b7280">${today.getFullYear()}.${mm}.${dd}</span>
    </div>
    ${specHtml}${screeningHtml}
  </div>
</body></html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${yy}${mm}${dd}_최종SPEC_${brand}_${product}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [specFields])

  const isBusy = isGenerating || isRevising

  const toolbarBtnClass =
    'px-2.5 py-1 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors select-none'

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-base font-semibold text-gray-800">최종 기획안 작성</h1>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* 왼쪽: 입력 패널 */}
        <div className={`flex flex-col overflow-y-auto ${currentHtml ? 'w-[420px] shrink-0' : 'flex-1 max-w-3xl mx-auto'} border-r border-gray-200 bg-white`}>
          <div className="px-6 py-8 space-y-8">

            <FileAttachSection
              title="초기 기획안"
              description="파일을 첨부하거나, 노션 페이지에서 불러오세요."
              files={initialPlanFiles}
              notionItems={initialPlanNotion}
              onAddFiles={addFiles(setInitialPlanFiles)}
              onRemoveFile={removeFile(setInitialPlanFiles)}
              onAddNotion={addNotion(setInitialPlanNotion)}
              onRemoveNotion={removeNotion(setInitialPlanNotion)}
            />

            <FileAttachSection
              title="기타 첨부자료"
              description="파일을 첨부하거나, 노션 페이지에서 불러오세요."
              files={attachmentFiles}
              notionItems={attachmentNotion}
              onAddFiles={addFiles(setAttachmentFiles)}
              onRemoveFile={removeFile(setAttachmentFiles)}
              onAddNotion={addNotion(setAttachmentNotion)}
              onRemoveNotion={removeNotion(setAttachmentNotion)}
            />

            <section>
              <h2 className="text-base font-semibold text-gray-800 mb-2">최종 SPEC</h2>
              <p className="text-xs text-gray-400 mb-3">확정된 최종 SPEC을 항목별로 입력하세요.</p>
              <div className="space-y-6">
                {FINAL_SPEC_SECTIONS.map((section) => (
                  <FormSection key={section.id} section={section} fields={specFields} onChange={handleFieldChange} />
                ))}
                <ScreeningStatusTable
                  value={specFields[SCREENING_KEY] ?? ''}
                  onChange={(val) => handleFieldChange(SCREENING_KEY, val)}
                />
              </div>
            </section>

            {generateError && <p className="text-sm text-red-500">{generateError}</p>}

            {statusMsg && (
              <div className="flex items-center gap-2 text-sm text-blue-500">
                <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                {statusMsg}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pb-4">
              <button
                onClick={handleExportSpec}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                최종 SPEC 내보내기
              </button>

              {isBusy ? (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="1.5"/></svg>
                  생성 중지
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {currentHtml ? '다시 생성' : '최종 기획안 생성'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 편집 가능 미리보기 + AI 수정 요청 */}
        {currentHtml && (
          <div className="flex-1 flex flex-col bg-gray-100">
            {/* 상단 바 */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">최종 기획안</span>
                {!isBusy && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full border border-green-200">
                    편집 가능
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  PDF 저장
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  HTML 저장
                </button>
              </div>
            </div>

            {/* 편집 툴바 */}
            {!isBusy && (
              <div className="flex items-center gap-0.5 px-3 py-2 bg-white border-b border-gray-200 shrink-0">
                <button onMouseDown={(e) => { e.preventDefault(); execCmd('bold') }} className={toolbarBtnClass} title="굵게 (Ctrl+B)">
                  <b>B</b>
                </button>
                <button onMouseDown={(e) => { e.preventDefault(); execCmd('italic') }} className={toolbarBtnClass} title="기울임 (Ctrl+I)">
                  <i>I</i>
                </button>
                <button onMouseDown={(e) => { e.preventDefault(); execCmd('underline') }} className={toolbarBtnClass} title="밑줄 (Ctrl+U)">
                  <u>U</u>
                </button>
                <button onMouseDown={(e) => { e.preventDefault(); execCmd('strikeThrough') }} className={toolbarBtnClass} title="취소선">
                  <s>S</s>
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1.5 shrink-0" />

                <button onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h1>') }} className={toolbarBtnClass} title="제목 1">
                  H1
                </button>
                <button onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h2>') }} className={toolbarBtnClass} title="제목 2">
                  H2
                </button>
                <button onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h3>') }} className={toolbarBtnClass} title="제목 3">
                  H3
                </button>
                <button onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<p>') }} className={toolbarBtnClass} title="본문">
                  P
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1.5 shrink-0" />

                <button
                  onMouseDown={(e) => { e.preventDefault(); imageInputRef.current?.click() }}
                  className={`${toolbarBtnClass} flex items-center gap-1.5`}
                  title="이미지 삽입"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  이미지
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />

                <div className="w-px h-5 bg-gray-200 mx-1.5 shrink-0" />

                <button onMouseDown={(e) => { e.preventDefault(); execCmd('undo') }} className={toolbarBtnClass} title="실행 취소 (Ctrl+Z)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                  </svg>
                </button>
                <button onMouseDown={(e) => { e.preventDefault(); execCmd('redo') }} className={toolbarBtnClass} title="다시 실행 (Ctrl+Y)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
                  </svg>
                </button>
              </div>
            )}

            {/* iframe — designMode로 직접 편집 가능 */}
            <iframe
              ref={iframeRef}
              srcDoc={currentHtml}
              onLoad={handleIframeLoad}
              className="flex-1 w-full border-0"
              title="최종 기획안"
            />

            {/* AI 수정 요청 */}
            <div className="border-t border-gray-200 bg-white p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={revisionInput}
                  onChange={(e) => setRevisionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !isRevising) handleRevise() }}
                  placeholder="AI 수정 요청... (예: 타겟 고객 섹션에 연령대 정보 추가해줘)"
                  disabled={isBusy}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={isRevising ? handleStop : handleRevise}
                  disabled={!isRevising && (!revisionInput.trim() || isBusy)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isRevising
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'
                  }`}
                >
                  {isRevising ? '중지' : 'AI 수정'}
                </button>
              </div>
              {isRevising && (
                <p className="text-xs text-blue-400 mt-1.5">수정 중... 잠시 기다려주세요</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
