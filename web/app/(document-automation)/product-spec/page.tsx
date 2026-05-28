'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

function FileAttachSection({
  files,
  onAdd,
  onRemove,
}: {
  files: File[]
  onAdd: (files: FileList) => void
  onRemove: (index: number) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-800 mb-2">최종 SPEC 파일</h2>
      <p className="text-xs text-gray-400 mb-3">최종 SPEC 내보내기 파일(HTML)을 첨부해주세요. AI가 분석하여 제품 사양서를 작성합니다.</p>

      <div className="space-y-2">
        {files.length > 0 ? (
          files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-sm text-blue-700 flex-1 truncate">📎 {file.name}</span>
              <button
                onClick={() => onRemove(idx)}
                className="text-xs text-blue-400 hover:text-blue-600 shrink-0"
              >
                ✕ 제거
              </button>
            </div>
          ))
        ) : (
          <div className="px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            <span className="text-sm text-gray-400">아직 첨부된 파일이 없습니다.</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <input
          ref={fileInputRef}
          type="file"
          accept=".html"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onAdd(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-5 py-3 bg-slate-500 text-white rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors text-center leading-tight"
        >
          <span className="block">파일첨부</span>
          <span className="block text-[10px] text-slate-300 mt-0.5">html</span>
        </button>
      </div>
    </section>
  )
}

const FIELD_LABELS: Record<string, string> = {
  제품명: '제품명',
  제품유형: '제품 유형',
  유통기한: '유통기한',
  제조사: '제조사',
  제품특징: '제품 특징',
}

const SECTIONS = [
  { title: '기획팀 — 기본 정보', keys: ['제품명', '제품유형', '유통기한', '제조사', '제품특징'] },
]

export default function ProductSpecPage() {
  const [specFiles, setSpecFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [xlsxBase64, setXlsxBase64] = useState('')

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
  }, [])

  const addFiles = (newFiles: FileList) => {
    const arr = Array.from(newFiles)
    setSpecFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name))
      return [...prev, ...arr.filter((f) => !existingNames.has(f.name))]
    })
  }

  const removeFile = (index: number) => {
    setSpecFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    if (specFiles.length === 0) return
    setIsLoading(true)
    setError('')
    setIsGenerated(false)

    const formData = new FormData()
    formData.append('file', specFiles[0])

    try {
      const res = await fetch('/api/product-spec', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '오류가 발생했습니다.')
        return
      }
      setFields(data.fields ?? {})
      setXlsxBase64(data.xlsxBase64 ?? '')
      setIsGenerated(true)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    if (!xlsxBase64) return
    const binary = atob(xlsxBase64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const today = new Date()
    const dateStr = `${String(today.getFullYear()).slice(2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const productName = fields['제품명'] || '제품명'
    a.href = url
    a.download = `${dateStr}_제품사양서_${productName}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-base font-semibold text-gray-800">제품 사양서 작성</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <FileAttachSection files={specFiles} onAdd={addFiles} onRemove={removeFile} />

        {!isGenerated && (
          <div className="flex flex-col items-end gap-2">
            {error && <p className="text-sm text-red-500 self-start">{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center leading-tight"
            >
              <span className="block">제품 사양서 초안 생성</span>
              <span className="block text-[10px] text-blue-200 mt-0.5">AI 자동 작성</span>
            </button>
          </div>
        )}

        {isLoading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">AI가 제품 사양서를 작성하고 있습니다...</p>
            <p className="text-xs text-gray-400 mt-1">보통 15~30초 소요됩니다</p>
          </div>
        )}

        {isGenerated && !isLoading && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800">생성된 제품 사양서</h2>
                <p className="text-xs text-gray-400 mt-0.5">내용을 확인하고 수정한 뒤 내보내기 하세요.</p>
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                xlsx 내보내기
              </button>
            </div>

            {SECTIONS.map((section) => (
              <div key={section.title} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
                  <h3 className="text-sm font-semibold text-gray-700">{section.title}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {section.keys.map((key) => (
                    <div key={key} className="px-5 py-3 flex gap-4 items-start">
                      <span className="shrink-0 w-36 text-xs text-gray-500 pt-2">{FIELD_LABELS[key]}</span>
                      {key === '제품특징' ? (
                        <textarea
                          value={fields[key] ?? ''}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          rows={3}
                          className="flex-1 text-sm text-gray-800 resize-none focus:outline-none focus:bg-blue-50 rounded px-2 py-1.5 border border-transparent hover:border-gray-200 transition-colors"
                        />
                      ) : (
                        <input
                          type="text"
                          value={fields[key] ?? ''}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          className="flex-1 text-sm text-gray-800 focus:outline-none focus:bg-blue-50 rounded px-2 py-1.5 border border-transparent hover:border-gray-200 transition-colors"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                xlsx 내보내기
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
