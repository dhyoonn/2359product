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
        <div className="relative">
          <button
            disabled
            className="px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium opacity-40 cursor-not-allowed text-center leading-tight"
          >
            <span className="block">노션불러오기</span>
            <span className="block text-[10px] text-gray-400 mt-0.5">notion</span>
          </button>
          <span className="absolute -top-2 -right-2 text-[10px] font-medium bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full leading-none">
            개발예정
          </span>
        </div>
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
