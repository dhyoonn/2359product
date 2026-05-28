'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { FileAttachSection, type NotionItem } from '@/components/FileAttachSection'

type RefImage = { file: File; previewUrl: string }
type Section = { id: string; name: string; html: string }

// ── iframe에 주입할 에디터 스크립트 ──────────────────────────────
const EDITOR_SCRIPT = `(function() {
  if (document.body.dataset.editInit) return;
  document.body.dataset.editInit = '1';

  /* ── 에디터 CSS ── */
  const style = document.createElement('style');
  style.id = '__edit-style';
  style.textContent = \`
    .__edit-host { position: relative !important; }
    .__edit-del {
      position: absolute !important; top: 6px !important; right: 6px !important;
      width: 22px !important; height: 22px !important;
      background: #ef4444 !important; color: #fff !important;
      border: none !important; border-radius: 50% !important;
      font-size: 11px !important; cursor: pointer !important;
      display: none !important; align-items: center !important;
      justify-content: center !important; z-index: 9999 !important;
      line-height: 1 !important; font-family: sans-serif !important;
    }
    .__edit-host:hover > .__edit-del { display: flex !important; }
    .__edit-add {
      display: block !important; width: 100% !important;
      padding: 8px 12px !important; margin-top: 8px !important;
      background: transparent !important; color: #0d9488 !important;
      border: 1.5px dashed #0d9488 !important; border-radius: 10px !important;
      font-size: 12px !important; cursor: pointer !important;
      text-align: center !important; font-family: sans-serif !important;
      box-sizing: border-box !important;
    }
    .__edit-add:hover { background: #f0faf8 !important; }
  \`;
  document.head.appendChild(style);

  /* ── 텍스트 편집 가능하게 ── */
  const TEXT_SELS = [
    'h1','h2','h3','h4','h5','p',
    '.s-eyebrow','.s-desc','.big-quote',
    '.hero-sub','.hero-cat','.brand-name','.hero-eyebrow',
    '.trust-card .lbl','.trust-card .val',
    '.big-stat','.big-stat-lbl','.big-stat-src',
    '.faq-q','.faq-a',
    '.tl-week .num','.tl-week .unit','.tl-content h5','.tl-content p',
    '.bar-label','.pct',
    '.authority-card .src',
    '.ingredient-head .info .role','.ingredient-dose','.badge',
    '.pain-item > div',
    '.review-stars','.review-user','.review-card h5','.review-card p',
    '.price-option .info h5','.price-option .info .pack',
    '.price-option .info .save','.price-option .price .original','.price-option .price .now',
    '.cert-card .name',
    '.layer-box h4','.layer-chain .node',
    '.step h3','.step p',
    '.quote-box p','.cite','.tag',
    '.vs-bad h3','.vs-bad p','.vs-good h3','.vs-good p',
    '.synergy-final p','.synergy-final .lbl',
    '.sticky-cta .price-info .lbl','.sticky-cta .price-info .amount',
    '.compare-row .col',
  ].join(',');

  document.querySelectorAll(TEXT_SELS).forEach(function(el) {
    if (el.closest('.__edit-del') || el.closest('.__edit-add')) return;
    el.contentEditable = 'true';
    el.spellcheck = false;
  });

  /* ── 삭제 버튼 추가 ── */
  const DELETABLE = [
    '.pain-item','.faq-item','.tl-item','.authority-card',
    '.ingredient','.review-card','.price-option',
    '.compare-row:not(.head)','.bar-row','.cert-card','.stat-box','.step',
  ].join(',');

  function addDeleteBtn(el) {
    if (el.querySelector(':scope > .__edit-del')) return;
    el.classList.add('__edit-host');
    const btn = document.createElement('button');
    btn.className = '__edit-del';
    btn.innerHTML = '✕';
    btn.title = '이 항목 삭제';
    btn.addEventListener('mousedown', function(e) {
      e.preventDefault(); e.stopPropagation();
      el.remove();
    });
    el.appendChild(btn);
  }

  document.querySelectorAll(DELETABLE).forEach(addDeleteBtn);

  /* ── 항목 추가 버튼 ── */
  const ITEM_CLASSES = [
    'pain-item','faq-item','tl-item','authority-card',
    'ingredient','review-card','price-option',
    'compare-row','bar-row','cert-card','stat-box','step',
  ];

  ITEM_CLASSES.forEach(function(cls) {
    var seen = new WeakSet();
    document.querySelectorAll('.' + cls).forEach(function(el) {
      var parent = el.parentElement;
      if (!parent || seen.has(parent)) return;
      seen.add(parent);

      // 헤더 행은 제외
      var items = function() {
        return Array.from(parent.querySelectorAll(':scope > .' + cls)).filter(function(e) {
          return !e.classList.contains('head');
        });
      };
      if (items().length === 0) return;

      var addBtn = document.createElement('button');
      addBtn.className = '__edit-add';
      addBtn.textContent = '+ ' + getItemLabel(cls) + ' 추가';
      addBtn.addEventListener('mousedown', function(e) {
        e.preventDefault(); e.stopPropagation();
        var allItems = items();
        if (allItems.length === 0) return;
        var last = allItems[allItems.length - 1];
        var clone = last.cloneNode(true);
        // 기존 에디터 요소 제거 후 새로 붙이기
        clone.querySelectorAll('.__edit-del, .__edit-add').forEach(function(b) { b.remove(); });
        clone.classList.remove('__edit-host');
        // 텍스트 초기화
        clone.querySelectorAll('[contenteditable]').forEach(function(t) {
          if (!t.closest('.__edit-del')) t.textContent = '내용을 입력하세요';
        });
        // contenteditable 재적용
        clone.querySelectorAll(TEXT_SELS).forEach(function(t) {
          if (!t.closest('.__edit-del')) { t.contentEditable = 'true'; t.spellcheck = false; }
        });
        addDeleteBtn(clone);
        parent.insertBefore(clone, addBtn);
        var first = clone.querySelector('[contenteditable]');
        if (first) { first.focus(); document.execCommand('selectAll'); }
      });
      parent.appendChild(addBtn);
    });
  });

  function getItemLabel(cls) {
    var labels = {
      'pain-item': '체크 항목', 'faq-item': 'FAQ', 'tl-item': '타임라인 항목',
      'authority-card': '연구 카드', 'ingredient': '성분 카드', 'review-card': '후기',
      'price-option': '가격 옵션', 'compare-row': '비교 행', 'bar-row': '차트 항목',
      'cert-card': '인증 항목', 'stat-box': '통계 항목', 'step': '스텝',
    };
    return labels[cls] || '항목';
  }
})();`

// ── 레퍼런스 이미지 클라이언트 압축 ──────────────────────────────
// Claude API 제한: 최대 8000px (가로·세로 각각)
// 상세 페이지 풀스크린샷은 세로가 10,000~20,000px까지 되므로 항상 리사이즈
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const MAX_W = 1200  // 가로 최대
      const MAX_H = 7500  // 세로 최대 (Claude API 8000px 제한에 여유)

      // 가로·세로 비율 유지하며 둘 다 제한 이내로 축소
      const scaleW = img.width  > MAX_W ? MAX_W / img.width  : 1
      const scaleH = img.height > MAX_H ? MAX_H / img.height : 1
      const scale  = Math.min(scaleW, scaleH)

      // 이미 제한 이내이고 3MB 이하면 그냥 통과
      if (scale === 1 && file.size <= 3 * 1024 * 1024) {
        URL.revokeObjectURL(objectUrl)
        resolve(file)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const name = file.name.replace(/\.[^.]+$/, '.jpg')
            resolve(new File([blob], name, { type: 'image/jpeg' }))
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        0.82,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

// ── 에디터 컨트롤 제거 (저장·싱크 시 사용) ──────────────────────
function getCleanHtml(el: Element): string {
  const clone = el.cloneNode(true) as Element
  clone.querySelectorAll('.__edit-del, .__edit-add').forEach((e) => e.remove())
  clone.querySelectorAll('[contenteditable]').forEach((e) => e.removeAttribute('contenteditable'))
  clone.querySelectorAll('.__edit-host').forEach((e) => e.classList.remove('__edit-host'))
  return clone.outerHTML
}

// ── HTML → 섹션 배열로 파싱 ──────────────────────────────────────
function parseHtmlToSections(fullHtml: string): {
  head: string
  sections: Section[]
  stickyHtml: string
} {
  const parser = new DOMParser()
  const doc = parser.parseFromString(fullHtml, 'text/html')

  const head =
    `<!DOCTYPE html>\n<html lang="ko">\n<head>\n` +
    doc.head.innerHTML +
    `\n</head>\n<body>\n<div class="detail-wrap">\n`

  const wrapper = doc.querySelector('.detail-wrap')
  if (!wrapper) return { head, sections: [{ id: 'sec-0', name: '전체', html: fullHtml }], stickyHtml: '' }

  const stickyEl = wrapper.querySelector('.sticky-cta, .cta-bar')
  const stickyHtml = stickyEl?.outerHTML ?? ''

  const sections: Section[] = []
  let i = 0
  for (const child of Array.from(wrapper.children)) {
    const cls = (child as HTMLElement).className ?? ''
    if (cls.includes('sticky-cta') || cls.includes('cta-bar')) continue
    sections.push({
      id: `sec-${i++}-${Math.random().toString(36).slice(2, 7)}`,
      name: getSectionName(child as HTMLElement),
      html: child.outerHTML,
    })
  }

  return { head, sections, stickyHtml }
}

function getSectionName(el: HTMLElement): string {
  const eyebrow = el.querySelector('.s-eyebrow, .label, .hero-eyebrow')
  if (eyebrow?.textContent?.trim()) return eyebrow.textContent.trim()
  const h = el.querySelector('h1, h2')
  if (h?.textContent) {
    const t = h.textContent.trim()
    return t.length > 16 ? t.slice(0, 16) + '…' : t
  }
  const cls = el.className ?? ''
  if (cls.includes('hero')) return '메인 배너'
  if (cls.includes('section-divider')) return '── 구분선'
  if (cls.includes('divider-dot')) return '• • •'
  return '섹션'
}

function assembleHtml(head: string, sections: Section[], stickyHtml: string): string {
  return (
    head +
    sections.map((s) => s.html).join('\n') +
    (stickyHtml ? '\n' + stickyHtml : '') +
    '\n</div>\n</body>\n</html>'
  )
}

function makeBlankSection(): Section {
  return {
    id: `sec-new-${Date.now()}`,
    name: '새 섹션',
    html: `<section class="s">
  <div class="s-eyebrow">NEW SECTION</div>
  <h2>섹션 제목을 <em>입력하세요</em></h2>
  <p class="s-desc">내용을 입력하세요. 미리보기에서 직접 클릭해서 수정하세요.</p>
</section>`,
  }
}

// ── 컴포넌트 ─────────────────────────────────────────────────────
export default function PageFlowPage() {
  const [planFiles, setPlanFiles] = useState<File[]>([])
  const [planNotion, setPlanNotion] = useState<NotionItem[]>([])
  const [marketingFiles, setMarketingFiles] = useState<File[]>([])
  const [refImages, setRefImages] = useState<RefImage[]>([])
  const [refPdfs, setRefPdfs] = useState<File[]>([])
  const [marketingNotion, setMarketingNotion] = useState<NotionItem[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [headHtml, setHeadHtml] = useState('')
  const [sections, setSections] = useState<Section[]>([])
  const [stickyHtml, setStickyHtml] = useState('')

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const hasResult = sections.length > 0
  const isReady = planFiles.length > 0 || planNotion.length > 0

  // 조립된 HTML (섹션 상태 기준)
  const getAssembledHtml = useCallback(() => {
    return assembleHtml(headHtml, sections, stickyHtml)
  }, [headHtml, sections, stickyHtml])

  /* ── iframe 로드 후 에디터 주입 ── */
  const injectEditor = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument) return
    const script = iframe.contentDocument.createElement('script')
    script.textContent = EDITOR_SCRIPT
    iframe.contentDocument.body.appendChild(script)
  }, [])

  /* ── 조작 전: iframe DOM에서 섹션 읽기 (편집 내용 보존) ── */
  const syncFromIframe = useCallback((): Section[] => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument) return sections
    const wrapper = iframe.contentDocument.querySelector('.detail-wrap')
    if (!wrapper) return sections

    const updated: Section[] = []
    let i = 0
    for (const child of Array.from(wrapper.children)) {
      const cls = (child as HTMLElement).className ?? ''
      if (cls.includes('sticky-cta') || cls.includes('cta-bar')) continue
      const prev = sections[i]
      updated.push({
        id: prev?.id ?? `sec-sync-${i}`,
        name: getSectionName(child as HTMLElement),
        html: getCleanHtml(child),  // 에디터 컨트롤 제거된 깨끗한 HTML
      })
      i++
    }
    return updated
  }, [sections])

  /* ── 섹션 조작 ── */
  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return
    const cur = syncFromIframe()
    const next = [...cur];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setSections(next)
  }, [syncFromIframe])

  const moveDown = useCallback((idx: number) => {
    const cur = syncFromIframe()
    if (idx >= cur.length - 1) return
    const next = [...cur];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setSections(next)
  }, [syncFromIframe])

  const deleteSection = useCallback((idx: number) => {
    const cur = syncFromIframe()
    setSections(cur.filter((_, i) => i !== idx))
  }, [syncFromIframe])

  const addSectionAfter = useCallback((afterIdx: number) => {
    const cur = syncFromIframe()
    const blank = makeBlankSection()
    const next = [...cur]
    next.splice(afterIdx + 1, 0, blank)
    setSections(next)
  }, [syncFromIframe])

  /* ── 입력 핸들러 ── */
  const addPlanFiles = useCallback((fl: FileList) => {
    const arr = Array.from(fl)
    setPlanFiles((p) => { const s = new Set(p.map((f) => f.name)); return [...p, ...arr.filter((f) => !s.has(f.name))] })
  }, [])
  const removePlanFile = useCallback((i: number) => setPlanFiles((p) => p.filter((_, j) => j !== i)), [])
  const addPlanNotion = useCallback((item: NotionItem) => setPlanNotion((p) => [...p, item]), [])
  const removePlanNotion = useCallback((i: number) => setPlanNotion((p) => p.filter((_, j) => j !== i)), [])
  const addMarketingFiles = useCallback((fl: FileList) => {
    const arr = Array.from(fl)
    setMarketingFiles((p) => { const s = new Set(p.map((f) => f.name)); return [...p, ...arr.filter((f) => !s.has(f.name))] })
  }, [])
  const removeMarketingFile = useCallback((i: number) => setMarketingFiles((p) => p.filter((_, j) => j !== i)), [])
  const addMarketingNotion = useCallback((item: NotionItem) => setMarketingNotion((p) => [...p, item]), [])
  const removeMarketingNotion = useCallback((i: number) => setMarketingNotion((p) => p.filter((_, j) => j !== i)), [])

  const addRefImages = useCallback(async (fl: FileList) => {
    // 3MB 초과 이미지는 자동 압축 (Next.js 10MB 바디 제한 대응)
    const compressed = await Promise.all(Array.from(fl).map(compressImage))
    const newImgs: RefImage[] = compressed.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setRefImages((p) => [...p, ...newImgs])
  }, [])

  const removeRefImage = useCallback((idx: number) => {
    setRefImages((p) => {
      URL.revokeObjectURL(p[idx].previewUrl)
      return p.filter((_, i) => i !== idx)
    })
  }, [])

  const addRefPdfs = useCallback((fl: FileList) => {
    const MAX_PDF = 8 * 1024 * 1024 // 8MB
    const arr = Array.from(fl).filter((f) => f.name.endsWith('.pdf'))
    const oversized = arr.filter((f) => f.size > MAX_PDF)
    if (oversized.length > 0) {
      alert(
        `PDF 파일이 너무 큽니다 (최대 8MB).\n` +
        oversized.map((f) => `• ${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`).join('\n') +
        `\n\nJPG 스크린샷으로 찍어 업로드해주세요.`
      )
    }
    const valid = arr.filter((f) => f.size <= MAX_PDF)
    if (valid.length > 0) {
      setRefPdfs((p) => { const s = new Set(p.map((f) => f.name)); return [...p, ...valid.filter((f) => !s.has(f.name))] })
    }
  }, [])

  const removeRefPdf = useCallback((idx: number) => setRefPdfs((p) => p.filter((_, i) => i !== idx)), [])

  /* ── 생성 ── */
  const handleGenerate = useCallback(async () => {
    setIsLoading(true); setError('')
    setSections([]); setHeadHtml(''); setStickyHtml('')

    const formData = new FormData()
    planFiles.forEach((f) => formData.append('planFiles', f))
    marketingFiles.forEach((f) => formData.append('marketingFiles', f))
    refImages.forEach((r) => formData.append('refImages', r.file))
    refPdfs.forEach((f) => formData.append('refPdfs', f))
    const notionTexts = planNotion.map((n) => n.text).filter(Boolean).join('\n\n')
    if (notionTexts) formData.append('notionContent', notionTexts)
    const marketingNotionTexts = marketingNotion.map((n) => n.text).filter(Boolean).join('\n\n')
    if (marketingNotionTexts) formData.append('marketingNotionContent', marketingNotionTexts)

    try {
      const res = await fetch('/api/page-flow', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다.'); return }
      const { head, sections: parsed, stickyHtml: sticky } = parseHtmlToSections(data.html)
      setHeadHtml(head)
      setSections(parsed)
      setStickyHtml(sticky)
    } catch { setError('네트워크 오류가 발생했습니다.') }
    finally { setIsLoading(false) }
  }, [planFiles, marketingFiles, refImages, refPdfs, planNotion])

  /* ── HTML 저장 (에디터 컨트롤 제거 후 다운로드) ── */
  const handleDownload = useCallback(() => {
    const iframe = iframeRef.current
    let html = getAssembledHtml()

    if (iframe?.contentDocument?.documentElement) {
      const clone = iframe.contentDocument.documentElement.cloneNode(true) as HTMLElement
      // 에디터 관련 요소 모두 제거
      clone.querySelectorAll('.__edit-del, .__edit-add, #__edit-style').forEach((e) => e.remove())
      clone.querySelectorAll('[contenteditable]').forEach((e) => e.removeAttribute('contenteditable'))
      clone.querySelectorAll('.__edit-host').forEach((e) => e.classList.remove('__edit-host'))
      // 주입된 script 제거
      clone.querySelectorAll('script').forEach((e) => e.remove())
      html = '<!DOCTYPE html>\n' + clone.outerHTML
    }

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const d = new Date()
    const yy = String(d.getFullYear()).slice(2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    a.download = `${yy}${mm}${dd}_상세페이지_문안.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [getAssembledHtml])

  /* ── 렌더 ── */
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-base font-semibold text-gray-800">상세 페이지 플로우 + 문안</h1>
      </header>

      <div className="flex h-[calc(100vh-57px)]">

        {/* ── 왼쪽: 입력 + 섹션 관리 ── */}
        <div className={`flex flex-col overflow-y-auto ${hasResult ? 'w-[360px] shrink-0' : 'flex-1 max-w-3xl mx-auto'} border-r border-gray-200 bg-white`}>
          <div className="px-5 py-6 space-y-8">

            {/* 레퍼런스 */}
            <section>
              <h2 className="text-sm font-semibold text-gray-800 mb-1">레퍼런스 <span className="text-gray-400 font-normal">(선택)</span></h2>
              <p className="text-xs text-gray-400 mb-3">참고할 상세 페이지 구조를 업로드하면 해당 플로우로 생성합니다</p>

              {/* 업로드된 이미지 목록 */}
              {refImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {refImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt={img.file.name}
                        className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                      <button onClick={() => removeRefImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        ✕
                      </button>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{img.file.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 업로드된 PDF 목록 */}
              {refPdfs.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {refPdfs.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span className="text-xs text-gray-700 flex-1 truncate">{file.name}</span>
                      <button onClick={() => removeRefPdf(idx)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* 비어있을 때 */}
              {refImages.length === 0 && refPdfs.length === 0 && (
                <div className="px-3 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl mb-3">
                  <p className="text-xs text-gray-400 text-center">스크린샷 또는 PDF를 업로드하세요</p>
                </div>
              )}

              {/* 버튼 2개 */}
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-700 text-white rounded-xl text-xs font-medium hover:bg-slate-800 cursor-pointer transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  JPG 업로드
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="hidden"
                    onChange={(e) => e.target.files && addRefImages(e.target.files)} />
                </label>
                <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-700 text-white rounded-xl text-xs font-medium hover:bg-slate-800 cursor-pointer transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  PDF 업로드
                  <input type="file" accept=".pdf" multiple className="hidden"
                    onChange={(e) => e.target.files && addRefPdfs(e.target.files)} />
                </label>
              </div>
            </section>

            {/* 기획안 */}
            <FileAttachSection
              title="기획안"
              description="최종 기획안 파일을 첨부하거나 노션에서 불러오세요."
              files={planFiles} notionItems={planNotion}
              onAddFiles={addPlanFiles} onRemoveFile={removePlanFile}
              onAddNotion={addPlanNotion} onRemoveNotion={removePlanNotion}
              accept=".pdf,.html"
            />

            {/* 마케팅 자료 */}
            <FileAttachSection
              title="마케팅 자료"
              description="브랜드 가이드, 광고 소재 등 (선택)"
              files={marketingFiles}
              notionItems={marketingNotion}
              onAddFiles={addMarketingFiles} onRemoveFile={removeMarketingFile}
              onAddNotion={addMarketingNotion} onRemoveNotion={removeMarketingNotion}
              accept=".pdf,.ppt,.pptx"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* ── 섹션 구성 ── */}
            {hasResult && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-800">섹션 구성</h2>
                  <span className="text-xs text-gray-400">{sections.length}개</span>
                </div>

                <div className="space-y-1">
                  {sections.map((sec, idx) => (
                    <div key={sec.id}
                      className="group flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-300 hover:bg-white transition-colors">
                      <span className="text-[11px] text-gray-400 w-4 shrink-0 text-center font-mono">{idx + 1}</span>
                      <span className="flex-1 text-xs text-gray-700 truncate">{sec.name}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => moveUp(idx)} disabled={idx === 0} title="위로"
                          className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-25 disabled:cursor-not-allowed">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                        </button>
                        <button onClick={() => moveDown(idx)} disabled={idx === sections.length - 1} title="아래로"
                          className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-25 disabled:cursor-not-allowed">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <button onClick={() => addSectionAfter(idx)} title="아래에 섹션 추가"
                          className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                        <button onClick={() => deleteSection(idx)} title="섹션 삭제"
                          className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => addSectionAfter(sections.length - 1)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2.5 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  섹션 추가
                </button>
              </section>
            )}

            {/* 생성 버튼 */}
            <div className="flex justify-end pb-8">
              <button onClick={handleGenerate} disabled={!isReady || isLoading}
                className="px-7 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {isLoading ? '생성 중...' : hasResult ? '다시 생성' : '상세 페이지 문안 생성'}
              </button>
            </div>

          </div>
        </div>

        {/* ── 오른쪽: 미리보기 ── */}
        {(isLoading || hasResult) && (
          <div className="flex-1 flex flex-col bg-gray-100">

            {/* 툴바 */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">미리보기</span>
                {hasResult && (
                  <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    텍스트 클릭 → 수정 · 항목 위 마우스 → ✕ 삭제 · 목록 하단 → + 추가
                  </span>
                )}
              </div>
              {hasResult && !isLoading && (
                <button onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  HTML 저장
                </button>
              )}
            </div>

            {/* 로딩 */}
            {isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">AI가 상세 페이지 플로우와 문안을 작성하고 있습니다...</p>
                <p className="text-xs text-gray-400">레퍼런스 분석 포함 시 1~2분 소요될 수 있습니다</p>
              </div>
            )}

            {/* iframe */}
            {hasResult && !isLoading && (
              <iframe
                ref={iframeRef}
                srcDoc={getAssembledHtml()}
                onLoad={injectEditor}
                className="flex-1 w-full border-0"
                title="상세 페이지 미리보기"
              />
            )}
          </div>
        )}

      </div>
    </div>
  )
}
