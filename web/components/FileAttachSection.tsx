'use client'

import { useState, useRef } from 'react'

export type NotionItem = { title: string; text: string }

export function FileAttachSection({
  title,
  description,
  files,
  notionItems = [],
  onAddFiles,
  onRemoveFile,
  onAddNotion,
  onRemoveNotion,
  notionDisabled = false,
  accept = '.pdf,.html',
}: {
  title: string
  description: string
  files: File[]
  notionItems?: NotionItem[]
  onAddFiles: (files: FileList) => void
  onRemoveFile: (index: number) => void
  onAddNotion?: (item: NotionItem) => void
  onRemoveNotion?: (index: number) => void
  notionDisabled?: boolean
  accept?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showNotionInput, setShowNotionInput] = useState(false)
  const [notionUrl, setNotionUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [notionError, setNotionError] = useState('')

  const handleNotionLoad = async () => {
    if (!notionUrl.trim()) return
    setIsLoading(true)
    setNotionError('')
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: notionUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        setNotionError(data.error ?? '오류가 발생했습니다.')
        return
      }
      onAddNotion?.(data as NotionItem)
      setNotionUrl('')
      setShowNotionInput(false)
    } catch {
      setNotionError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const hasItems = files.length > 0 || notionItems.length > 0

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-xs text-gray-400 mb-3">{description}</p>

      <div className="space-y-2">
        {files.map((file, idx) => (
          <div key={`file-${idx}`} className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-sm text-blue-700 flex-1 truncate">📎 {file.name}</span>
            <button onClick={() => onRemoveFile(idx)} className="text-xs text-blue-400 hover:text-blue-600 shrink-0">✕ 제거</button>
          </div>
        ))}
        {notionItems.map((item, idx) => (
          <div key={`notion-${idx}`} className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-sm text-gray-700 flex-1 truncate">📄 {item.title}</span>
            <button onClick={() => onRemoveNotion?.(idx)} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">✕ 제거</button>
          </div>
        ))}
        {!hasItems && (
          <div className="px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            <span className="text-sm text-gray-400">아직 첨부된 파일이 없습니다.</span>
          </div>
        )}
      </div>

      {showNotionInput && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={notionUrl}
              onChange={(e) => setNotionUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNotionLoad()}
              placeholder="노션 페이지 URL을 붙여넣으세요"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleNotionLoad}
              disabled={isLoading || !notionUrl.trim()}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              {isLoading ? '불러오는 중...' : '불러오기'}
            </button>
            <button
              onClick={() => { setShowNotionInput(false); setNotionUrl(''); setNotionError('') }}
              className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm"
            >
              취소
            </button>
          </div>
          {notionError && <p className="text-xs text-red-500">{notionError}</p>}
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onAddFiles(e.target.files)
            e.target.value = ''
          }}
        />
        {notionDisabled ? (
          <button
            disabled
            className="relative px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium opacity-40 cursor-not-allowed text-center leading-tight"
          >
            <span className="block">노션불러오기</span>
            <span className="block text-[10px] text-gray-400 mt-0.5">개발 중</span>
          </button>
        ) : (onAddNotion && !showNotionInput && (
          <button
            onClick={() => setShowNotionInput(true)}
            className="px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors text-center leading-tight"
          >
            <span className="block">노션불러오기</span>
            <span className="block text-[10px] text-gray-400 mt-0.5">notion</span>
          </button>
        ))}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-5 py-3 bg-slate-500 text-white rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors text-center leading-tight"
        >
          <span className="block">파일첨부</span>
          <span className="block text-[10px] text-slate-300 mt-0.5">{accept}</span>
        </button>
      </div>
    </section>
  )
}
