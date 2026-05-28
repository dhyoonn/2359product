'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useProposalAuth } from '@/lib/useProposalAuth'

type ChatMessage = { role: 'user' | 'assistant'; content: string }
const DELIMITER = '---HTML---'

// ────────────────────────────────────────────────
// 비밀번호 잠금 화면
// ────────────────────────────────────────────────
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

// ────────────────────────────────────────────────
// 채팅 + HTML 미리보기 패널
// ────────────────────────────────────────────────
export interface ProposalChatConfig {
  apiPath: string
  downloadPrefix: string
  emptyTitle: string
  emptyDesc: string
  placeholder: string
  continuePlaceholder?: string
  multiFile?: boolean       // 파일 여러 개 허용 (3단계)
  fileLabel?: string        // 파일 첨부 버튼 레이블
}

function ChatPanel({ config }: { config: ProposalChatConfig }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentHtml, setCurrentHtml] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false)
  const [input, setInput] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    // 대화 시작 전: 고정 높이 유지 (placeholder 전체가 보이도록)
    // 대화 시작 후: 입력 내용에 맞게 자동 조절
    if (messages.length > 0) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
    }
  }, [input, messages.length])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setAttachedFiles((prev) => config.multiFile ? [...prev, ...selected] : selected)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const sendMessage = useCallback(async () => {
    const userMsg = input.trim()
    if (!userMsg && attachedFiles.length === 0) return
    if (isStreaming) return

    setInput('')
    setIsStreaming(true)

    const prevMessages = messages
    setMessages([...prevMessages, { role: 'user', content: userMsg || `파일 ${attachedFiles.map(f => f.name).join(', ')} 첨부` }, { role: 'assistant', content: '' }])

    const formData = new FormData()
    formData.append('userMessage', userMsg)
    formData.append('history', JSON.stringify(prevMessages.slice(-4)))
    formData.append('currentHtml', currentHtml)
    attachedFiles.forEach((f) => formData.append('files', f))
    setAttachedFiles([])

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch(config.apiPath, { method: 'POST', body: formData, signal: controller.signal })
      if (!res.ok || !res.body) throw new Error('API 오류')

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
          const delimIdx = buffer.indexOf(DELIMITER)
          if (delimIdx !== -1) {
            htmlStarted = true
            setIsGeneratingHtml(true)
            const msgPart = buffer.slice(0, delimIdx).replace(/^MESSAGE:\s*/s, '').trim()
            htmlBuffer = buffer.slice(delimIdx + DELIMITER.length)
            setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: msgPart }; return u })
          } else {
            const display = buffer.replace(/^MESSAGE:\s*/, '')
            setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: display }; return u })
          }
        } else {
          htmlBuffer += chunk
        }
      }

      // <!DOCTYPE 이후 내용이 있으면 불완전한 HTML도 표시
      const htmlStart = htmlBuffer.search(/<!DOCTYPE/i)
      if (htmlStart !== -1) {
        let html = htmlBuffer.slice(htmlStart).trim()
        // 닫힘 태그가 없으면 강제로 닫아서 브라우저가 렌더링할 수 있게 함
        if (!/<\/html>/i.test(html)) {
          html += '\n</body></html>'
        }
        setCurrentHtml(html)
        setShowPreview(true)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages((prev) => {
          const u = [...prev]
          const last = u[u.length - 1]
          if (last?.role === 'assistant') {
            u[u.length - 1] = {
              role: 'assistant',
              content: last.content ? last.content + '\n\n— 생성 중지됨 —' : '생성이 중지되었습니다.',
            }
          }
          return u
        })
      } else {
        const msg = err instanceof Error ? err.message : '오류'
        setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: `오류가 발생했습니다. 다시 시도해주세요.\n(${msg})` }; return u })
      }
    } finally {
      abortControllerRef.current = null
      setIsStreaming(false)
      setIsGeneratingHtml(false)
    }
  }, [input, attachedFiles, messages, currentHtml, isStreaming, config.apiPath])

  const handleDownload = useCallback(() => {
    const blob = new Blob([currentHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const d = new Date()
    const prefix = `${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
    a.download = `${prefix}_${config.downloadPrefix}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [currentHtml, config.downloadPrefix])

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* 채팅 패널 */}
      <div className={`flex flex-col ${showPreview ? 'w-[400px] shrink-0' : 'flex-1'} border-r border-gray-200 bg-white`}>

        {/* 미리보기 토글 바 — HTML이 생성된 이후에만 표시 */}
        {currentHtml && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
            <span className="text-xs text-gray-500">기획안 HTML 생성됨</span>
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {showPreview ? '미리보기 닫기' : '미리보기 열기'}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-3xl mb-3">✦</p>
              <p className="text-sm font-medium text-gray-600">{config.emptyTitle}</p>
              <p className="text-xs mt-1.5 text-gray-400 leading-relaxed whitespace-pre-line">{config.emptyDesc}</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mb-0.5">AI</div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-bl-sm'
              }`}>
                {msg.content ? (
                  <>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {/* 마지막 AI 메시지이고 HTML 생성 중일 때 진행 표시 */}
                    {idx === messages.length - 1 && isGeneratingHtml && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-xs text-blue-500">
                        <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                        기획안 HTML 생성 중... 잠시만 기다려주세요 (1~2분 소요)
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '160ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '320ms' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="border-t border-gray-100 p-4 bg-white">
          <input
            ref={fileInputRef} type="file" accept=".html,.pdf"
            multiple={config.multiFile} className="hidden"
            onChange={handleFileChange}
          />

          {/* 첨부 파일 표시 */}
          {attachedFiles.length > 0 && (
            <div className="mb-2 space-y-1">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                  <span className="flex-1 truncate">📎 {f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-blue-400 hover:text-blue-600">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* 입력 박스 */}
          <div className="rounded-2xl border-2 border-blue-400 bg-blue-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
            <textarea
              ref={textareaRef} value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation() } }}
              placeholder={messages.length === 0 ? config.placeholder : (config.continuePlaceholder ?? '수정 요청을 입력하세요...')}
              className="w-full px-4 pt-4 pb-2 resize-none focus:outline-none bg-transparent placeholder-blue-300 text-gray-800"
              style={{
                minHeight: messages.length === 0 ? '220px' : '72px',
                maxHeight: messages.length === 0 ? '320px' : '160px',
                overflowY: 'auto',
                fontSize: messages.length === 0 ? '12px' : '14px',
                lineHeight: '1.6',
              }}
            />

            {/* 하단 액션 바 */}
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                title={config.fileLabel ?? '파일 첨부 (html, pdf)'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                파일 첨부
              </button>

              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <rect width="10" height="10" rx="1.5"/>
                    </svg>
                    생성 중지
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() && attachedFiles.length === 0}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
                  >
                    전송
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {isStreaming && (
            <p className="text-xs text-blue-400 mt-2 text-center">AI가 기획안을 작성하고 있습니다... 1~2분 소요됩니다</p>
          )}
        </div>
      </div>

      {/* HTML 미리보기 패널 */}
      {showPreview && (
        <div className="flex-1 flex flex-col bg-gray-100">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
            <span className="text-sm font-medium text-gray-700">미리보기</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPreview(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">✕ 닫기</button>
              <button onClick={handleDownload} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                HTML 다운로드
              </button>
            </div>
          </div>
          <iframe srcDoc={currentHtml} className="flex-1 w-full border-0" title="미리보기" />
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────
// 외부 노출 컴포넌트
// ────────────────────────────────────────────────
interface ProposalChatUIProps {
  title: string
  config: ProposalChatConfig
}

export default function ProposalChatUI({ title, config }: ProposalChatUIProps) {
  const { isUnlocked, isChecking, unlock } = useProposalAuth()

  if (isChecking) return null

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-10" style={{ height: '57px' }}>
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
        <span className="text-gray-300">/</span>
        <Link href="/proposal" className="text-gray-400 hover:text-gray-600 text-sm">제안서 작성</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      </header>
      {isUnlocked ? <ChatPanel config={config} /> : <PasswordGate onUnlock={unlock} />}
    </div>
  )
}
