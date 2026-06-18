'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  type ProductType,
  type Section,
  type Field,
  getSections,
  getDefaultFields,
  PRODUCT_TYPE_LABELS,
} from '@/lib/dev-request-fields'
import { FormSection, groupFields } from '@/components/FormSection'

const PRODUCT_TYPES: ProductType[] = ['cosmetics', 'food', 'industrial', 'medical']
type InputMode = 'auto' | 'manual'

export default function DevRequestPage() {
  const [productType, setProductType] = useState<ProductType>('cosmetics')
  const [inputMode, setInputMode] = useState<InputMode>('auto')
  const [planningContent, setPlanningContent] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [isGenerated, setIsGenerated] = useState(false)
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [guideContent, setGuideContent] = useState(
    '[수출 스크리닝 시 참고]\n1. 기본 사항 : 수출 스크리닝을 하는 브랜드는 수출 브랜드에 한함 (셀라딕스, 락토메디, 시옷, 엑스퍼트리션)\n2. 기본 스크리닝 국가 : 일본, 대만, 홍콩, 북미, 동남아(필리핀,말레이시아,베트남,태국,싱가포르,인도네시아)\n3. 제품 카테고리에 따른 추가 스크리닝 국가 : 화장품 - 영국(SCPN), EU(CPNP), GCC(중동)\n4. 기타 참고 사항 : 영국,EU의 경우 인허가까지 디폴트로 진행하며, GCC(중동)의 경우 셀라딕스,락토메디 화장품 품목에 한해 진행'
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleProductTypeChange = useCallback((type: ProductType) => {
    setProductType(type)
    setIsGenerated(false)
    setFields(inputMode === 'manual' ? getDefaultFields(type) : {})
  }, [inputMode])

  const handleModeChange = useCallback((mode: InputMode) => {
    setInputMode(mode)
    setIsGenerated(false)
    setError('')
    if (mode === 'manual') {
      setFields(getDefaultFields(productType))
      setIsGenerated(true)
    } else {
      setFields({})
    }
  }, [productType])

  const handleGenerate = useCallback(async () => {
    if (!planningContent.trim() && !attachedFile) {
      setError('기획안 내용을 입력하거나 파일을 첨부해주세요.')
      return
    }
    setIsLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('productType', productType)
    formData.append('planningContent', planningContent)
    if (attachedFile) formData.append('file', attachedFile)

    try {
      const res = await fetch('/api/dev-request', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? '오류가 발생했습니다. 다시 시도해주세요.')
        return
      }

      const defaults = getDefaultFields(productType)
      const merged: Record<string, string> = { ...defaults }
      for (const [key, val] of Object.entries(data.fields as Record<string, string>)) {
        if (val) merged[key] = val
      }
      setFields(merged)
      setIsGenerated(true)
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }, [productType, planningContent, attachedFile])

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleExport = useCallback(() => {
    const allSections = getSections(productType)
    const typeLabel = PRODUCT_TYPE_LABELS[productType]

    const renderValue = (field: Field, f: Record<string, string>): string => {
      const val = f[field.key] ?? ''
      if ((field.type === 'select' || field.type === 'multiselect') && field.options) {
        const selected = field.type === 'select' ? [val] : val.split(',').map((v) => v.trim()).filter(Boolean)
        if (selected.length === 0) return `<span style="font-size:13px;color:#d1d5db">—</span>`
        return selected.map((opt) =>
          `<span style="display:inline-block;margin:2px 3px;padding:4px 10px;background:#2563eb;color:#fff;border-radius:6px;font-size:11px;font-weight:500">${opt}</span>`
        ).join('')
      }
      return `<span style="font-size:13px;color:${val ? '#1f2937' : '#d1d5db'}">${val ? val.replace(/\n/g, '<br>') : '—'}</span>`
    }

    const renderFieldRow = (field: Field, f: Record<string, string>, bg = '#fff'): string => {
      const condMet = field.conditionalField && (
        field.type === 'select'
          ? f[field.key] === field.conditionalField.whenValue
          : f[field.key]?.split(',').map((v) => v.trim()).includes(field.conditionalField.whenValue)
      )
      const subRows = condMet && field.conditionalField
        ? field.conditionalField.fields.map((cf) => renderFieldRow(cf as Field, f, '#f9fafb')).join('')
        : ''

      return `
        <div style="display:flex;gap:16px;align-items:flex-start;padding:10px 20px;border-bottom:1px solid #f3f4f6;background:${bg}">
          <span style="flex-shrink:0;width:160px;font-size:11px;color:#6b7280;padding-top:4px">${field.label}</span>
          <div style="flex:1">${renderValue(field, f)}</div>
        </div>${subRows}`
    }

    const renderPairedRow = (f1: Field, f2: Field, flds: Record<string, string>): string => `
      <div style="display:flex;gap:24px;align-items:center;padding:10px 20px;border-bottom:1px solid #f3f4f6">
        <div style="flex:1;display:flex;gap:12px;align-items:center">
          <span style="flex-shrink:0;font-size:11px;color:#6b7280">${f1.label}</span>
          <span style="font-size:13px;color:${flds[f1.key] ? '#1f2937' : '#d1d5db'}">${flds[f1.key] || '—'}</span>
        </div>
        <div style="flex:1;display:flex;gap:12px;align-items:center">
          <span style="flex-shrink:0;font-size:11px;color:#6b7280">${f2.label}</span>
          <span style="font-size:13px;color:${flds[f2.key] ? '#1f2937' : '#d1d5db'}">${flds[f2.key] || '—'}</span>
        </div>
      </div>`

    const sectionsHtml = allSections.map((section) => {
      const grouped = groupFields(section.fields)
      const rowsHtml = grouped.map((row) =>
        Array.isArray(row)
          ? renderPairedRow(row[0], row[1], fields)
          : renderFieldRow(row, fields)
      ).join('')

      return `
        <div style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:20px">
          <div style="background:#f9fafb;border-bottom:1px solid #e5e7eb;padding:10px 20px">
            <span style="font-size:13px;font-weight:600;color:#374151">${section.title}</span>
          </div>
          ${rowsHtml}
        </div>`
    }).join('')

    const today = new Date()
    const yy = String(today.getFullYear()).slice(2)
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const dateStr = `${yy}${mm}${dd}`
    const brand = fields['출시_브랜드'] || '브랜드명'
    const manager = fields['담당자명'] || '담당자명'

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${dateStr}_개발의뢰서_${brand}_${manager}</title>
</head>
<body style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;background:#f3f4f6;margin:0;padding:40px 24px">
  <div style="max-width:720px;margin:0 auto">
    <div style="margin-bottom:24px">
      <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 4px">(주)이삼오구 개발 의뢰서_${manager}</h1>
      <span style="font-size:13px;color:#6b7280">${typeLabel} · ${today.getFullYear()}.${mm}.${dd}</span>
    </div>
    ${sectionsHtml}
  </div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${dateStr}_개발의뢰서_${brand}_${manager}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [productType, fields])

  const sections = getSections(productType)

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-base font-semibold text-gray-800">개발의뢰서 작성</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* 제품 유형 선택 */}
        <section>
          <h2 className="text-sm font-medium text-gray-600 mb-3">제품 유형 선택</h2>
          <div className="flex gap-2">
            {PRODUCT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleProductTypeChange(type)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  productType === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                }`}
              >
                {PRODUCT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </section>

        {/* 입력 방식 선택 */}
        <section>
          <h2 className="text-sm font-medium text-gray-600 mb-3">입력 방식 선택</h2>
          <div className="inline-flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => handleModeChange('auto')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'auto'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              자동입력
            </button>
            <button
              onClick={() => handleModeChange('manual')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'manual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              수동입력
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {inputMode === 'auto'
              ? 'AI가 기획안을 분석해서 항목을 자동으로 채웁니다.'
              : '빈 양식이 표시됩니다. 각 항목을 직접 입력하세요.'}
          </p>
        </section>

        {/* 자동입력: 기획안 입력 */}
        {inputMode === 'auto' && (
          <section>
            <h2 className="text-sm font-medium text-gray-600 mb-3">기획안 내용 입력</h2>
            <textarea
              value={planningContent}
              onChange={(e) => setPlanningContent(e.target.value)}
              placeholder="기획안 내용을 여기에 붙여넣으세요. 파일을 첨부한 경우 추가 내용만 입력하거나 비워두세요."
              className="w-full h-52 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />

            {/* 첨부 파일 표시 */}
            {attachedFile && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-xs text-blue-700 flex-1 truncate">📎 {attachedFile.name}</span>
                <button
                  onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="text-xs text-blue-400 hover:text-blue-600"
                >
                  ✕
                </button>
              </div>
            )}

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

            <div className="mt-3 flex justify-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.html,.jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={(e) => setAttachedFile(e.target.files?.[0] ?? null)}
              />

              {/* 노션 불러오기 - 개발예정 */}
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

              {/* 파일 첨부 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-3 bg-slate-500 text-white rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors text-center leading-tight"
              >
                <span className="block">파일첨부</span>
                <span className="block text-[10px] text-slate-300 mt-0.5">pdf, html, 이미지</span>
              </button>

              {/* 자동 입력 시작 */}
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-center leading-tight"
              >
                <span className="block">{isLoading ? '작성 중...' : '자동 입력 시작'}</span>
                <span className="block text-[10px] text-blue-200 mt-0.5">AI 자동완성</span>
              </button>
            </div>
          </section>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">AI가 개발의뢰서를 작성하고 있습니다...</p>
            <p className="text-xs text-gray-400 mt-1">보통 15~30초 소요됩니다</p>
          </div>
        )}

        {/* 생성된 폼 */}
        {isGenerated && !isLoading && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">
                {inputMode === 'auto' ? '생성된 의뢰서' : '의뢰서'} — {PRODUCT_TYPE_LABELS[productType]}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                >
                  내보내기
                </button>
                <div className="relative">
                  <button
                    disabled
                    className="px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded-xl opacity-50 cursor-not-allowed"
                  >
                    NOTION
                  </button>
                  <span className="absolute -top-2 -right-2 text-[10px] font-medium bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full leading-none">
                    개발예정
                  </span>
                </div>
              </div>
            </div>
            <div className="-mt-4">
              <button
                type="button"
                onClick={() => setIsGuideOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span>각 항목을 클릭하여 직접 수정할 수 있습니다.</span>
                <span>{isGuideOpen ? '▲' : '▼'} 설명란</span>
              </button>
              {isGuideOpen && (
                <textarea
                  value={guideContent}
                  onChange={(e) => setGuideContent(e.target.value)}
                  placeholder="작성 설명이나 내부 메모를 입력하세요. 이 내용은 내보내기에 포함되지 않습니다."
                  rows={4}
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50 placeholder-gray-400"
                />
              )}
            </div>

            <div className="space-y-6">
              {sections.map((section: Section) => (
                <FormSection
                  key={section.id}
                  section={section}
                  fields={fields}
                  onChange={handleFieldChange}
                />
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                내보내기
              </button>
              <div className="relative">
                <button
                  disabled
                  className="px-6 py-3 text-sm font-medium bg-gray-800 text-white rounded-xl opacity-50 cursor-not-allowed"
                >
                  NOTION
                </button>
                <span className="absolute -top-2 -right-2 text-[10px] font-medium bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full leading-none">
                  개발예정
                </span>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

