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
  var style = document.createElement('style');
  style.id = '__edit-style';
  style.textContent = [
    '.__edit-host { position: relative !important; }',
    '.__edit-del {',
    '  position: absolute !important; top: 6px !important; right: 6px !important;',
    '  width: 22px !important; height: 22px !important;',
    '  background: #ef4444 !important; color: #fff !important;',
    '  border: none !important; border-radius: 50% !important;',
    '  font-size: 11px !important; cursor: pointer !important;',
    '  display: none; align-items: center !important;',
    '  justify-content: center !important; z-index: 9999 !important;',
    '  line-height: 1 !important; font-family: sans-serif !important; padding: 0 !important;',
    '}',
    '.__edit-add {',
    '  display: block !important; width: 100% !important;',
    '  padding: 8px 12px !important; margin-top: 8px !important;',
    '  background: transparent !important; color: #0d9488 !important;',
    '  border: 1.5px dashed #0d9488 !important; border-radius: 10px !important;',
    '  font-size: 12px !important; cursor: pointer !important;',
    '  text-align: center !important; font-family: sans-serif !important;',
    '  box-sizing: border-box !important;',
    '}',
    '.__edit-add:hover { background: #f0faf8 !important; }',
    '[contenteditable]:hover { outline: 2px dashed rgba(59,130,246,0.45) !important; border-radius: 3px !important; cursor: text !important; }',
    '[contenteditable]:focus { outline: 2px solid rgba(59,130,246,0.8) !important; border-radius: 3px !important; }',
  ].join('');
  document.head.appendChild(style);

  /* ── 텍스트 편집 가능 선택자 ── */
  var TEXT_SELS = [
    'h1','h2','h3','h4','h5','h6','p','li','dt','dd','figcaption','blockquote',
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
    '.cert-card .name','.layer-box h4','.layer-chain .node',
    '.step h3','.step p','.quote-box p','.cite','.tag',
    '.vs-bad h3','.vs-bad p','.vs-good h3','.vs-good p',
    '.synergy-final p','.synergy-final .lbl',
    '.sticky-cta .price-info .lbl','.sticky-cta .price-info .amount',
    '.compare-row .col',
  ].join(',');

  /* ── contentEditable 적용 ── */
  document.querySelectorAll(TEXT_SELS).forEach(function(el) {
    if (el.closest('.__edit-del') || el.closest('.__edit-add')) return;
    el.contentEditable = 'true'; el.spellcheck = false;
  });

  /* ── 레퍼런스 모드: 텍스트만 담은 leaf div/span도 편집 가능 ── */
  var BLOCK_TAGS = new Set(['div','section','article','header','footer','ul','ol','table','tbody','tr','form']);
  document.querySelectorAll('div, span').forEach(function(el) {
    if (el.contentEditable === 'true') return;
    if (el.closest('.__edit-del') || el.closest('.__edit-add')) return;
    var hasBlock = Array.from(el.children).some(function(c) { return BLOCK_TAGS.has(c.tagName.toLowerCase()); });
    if (!hasBlock && el.children.length === 0 && el.textContent.trim().length > 0) {
      el.contentEditable = 'true'; el.spellcheck = false;
    }
  });

  /* ── 삭제 버튼 (CSS hover 대신 JS mouseenter/leave — iframe에서 안정적) ── */
  function addDeleteBtn(el) {
    if (el.querySelector(':scope > .__edit-del')) return;
    el.classList.add('__edit-host');
    var btn = document.createElement('button');
    btn.className = '__edit-del';
    btn.textContent = '✕';
    btn.title = '이 항목 삭제';
    btn.addEventListener('mousedown', function(e) { e.preventDefault(); e.stopPropagation(); el.remove(); });
    /* JS로 hover 제어 — CSS :hover는 iframe 안에서 신뢰성 낮음 */
    el.addEventListener('mouseenter', function() { btn.style.display = 'flex'; });
    el.addEventListener('mouseleave', function(e) {
      if (!el.contains(e.relatedTarget)) btn.style.display = 'none';
    });
    el.appendChild(btn);
  }

  /* ── 항목 추가 버튼 ── */
  function addPlusBtn(parent, getItems, label) {
    var addBtn = document.createElement('button');
    addBtn.className = '__edit-add';
    addBtn.textContent = '+ ' + label + ' 추가';
    addBtn.addEventListener('mousedown', function(e) {
      e.preventDefault(); e.stopPropagation();
      var items = getItems();
      if (!items.length) return;
      var clone = items[items.length - 1].cloneNode(true);
      clone.querySelectorAll('.__edit-del, .__edit-add').forEach(function(b) { b.remove(); });
      clone.classList.remove('__edit-host');
      clone.querySelectorAll('[contenteditable]').forEach(function(t) { t.textContent = '내용을 입력하세요'; });
      clone.querySelectorAll(TEXT_SELS).forEach(function(t) {
        if (!t.closest('.__edit-del')) { t.contentEditable = 'true'; t.spellcheck = false; }
      });
      addDeleteBtn(clone);
      parent.insertBefore(clone, addBtn);
      var first = clone.querySelector('[contenteditable]');
      if (first) { first.focus(); document.execCommand('selectAll'); }
    });
    parent.appendChild(addBtn);
  }

  /* ── AKKBELL 기본 모드: 클래스 기반 삭제/추가 ── */
  var AKKBELL_MAP = {
    'pain-item':'체크 항목','faq-item':'FAQ','tl-item':'타임라인 항목',
    'authority-card':'연구 카드','ingredient':'성분 카드','review-card':'후기',
    'price-option':'가격 옵션','compare-row':'비교 행','bar-row':'차트 항목',
    'cert-card':'인증 항목','stat-box':'통계 항목','step':'스텝',
  };
  var seenAkkbell = new WeakSet();
  Object.keys(AKKBELL_MAP).forEach(function(cls) {
    document.querySelectorAll('.' + cls + ':not(.head)').forEach(function(el) {
      addDeleteBtn(el);
      var parent = el.parentElement;
      if (!parent || seenAkkbell.has(parent)) return;
      seenAkkbell.add(parent);
      addPlusBtn(parent, function() {
        return Array.from(parent.querySelectorAll(':scope > .' + cls)).filter(function(e) { return !e.classList.contains('head'); });
      }, AKKBELL_MAP[cls]);
    });
  });

  /* ── 레퍼런스 모드: 섹션 내부의 반복 요소만 삭제/추가 (section·div 직접 자식 제외) ── */
  var seenGeneric = new WeakSet();
  document.querySelectorAll('[class]').forEach(function(el) {
    if (el.closest('.__edit-del') || el.closest('.__edit-add')) return;
    if (el.classList.contains('__edit-host') || el.classList.contains('__edit-del') || el.classList.contains('__edit-add')) return;
    var parent = el.parentElement;
    if (!parent || seenGeneric.has(parent)) return;
    /* detail-wrap 직접 자식은 제외 — 섹션 자체에 삭제 버튼 붙으면 레이아웃 파괴 */
    if (parent.classList.contains('detail-wrap')) return;
    var tag = el.tagName;
    var cls = el.getAttribute('class') || '';
    if (!cls.trim()) return;
    var siblings = Array.from(parent.children).filter(function(c) {
      return c.tagName === tag && (c.getAttribute('class') || '') === cls;
    });
    if (siblings.length < 2) return;
    seenGeneric.add(parent);
    siblings.forEach(addDeleteBtn);
    addPlusBtn(parent, function() {
      return Array.from(parent.children).filter(function(c) {
        return c.tagName === tag && (c.getAttribute('class') || '') === cls;
      });
    }, '항목');
  });
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

// ── 섹션에서 텍스트 라인 추출 (텍스트 추출하기 기능용) ──────────
function extractSectionLines(section: Element): string[] {
  const SEL = [
    'h1','h2','h3','h4','h5','h6','p','li',
    '.s-eyebrow','.hero-eyebrow','.s-desc','.big-quote',
    '.big-stat','.big-stat-lbl','.big-stat-src',
    '.faq-q','.faq-a',
    '.tl-content h5','.tl-content p',
    '.step h3','.step p',
    '.authority-card h4','.authority-card p',
    '.layer-box h4','.quote-box p',
    '.vs-bad h3','.vs-bad p','.vs-good h3','.vs-good p',
    '.review-card h5','.review-card p',
  ].join(',')

  const allEls = Array.from(section.querySelectorAll(SEL))
  const processed = new Set<Element>()
  const lines: string[] = []

  for (const el of allEls) {
    // 이미 처리된 조상 요소가 있으면 건너뜀 (중복 방지)
    let skip = false
    let anc = el.parentElement
    while (anc && anc !== section) {
      if (processed.has(anc)) { skip = true; break }
      anc = anc.parentElement
    }
    if (skip) continue
    processed.add(el)

    const text = el.textContent?.trim()
    if (!text) continue

    const tag = el.tagName.toLowerCase()
    const cls = el.className || ''

    if (cls.includes('faq-q'))                                   lines.push(`Q. ${text}`)
    else if (cls.includes('faq-a'))                              lines.push(`A. ${text}`)
    else if (cls.includes('s-eyebrow') || cls.includes('hero-eyebrow')) lines.push(`[${text.toUpperCase()}]`)
    else if (tag === 'li')                                       lines.push(`• ${text}`)
    else                                                         lines.push(text)
  }
  return lines
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
  const wrapper = doc.querySelector('.detail-wrap')

  // ── 스타일 수집과 섹션 추출을 head 구성 전에 먼저 처리 ──
  let floatingStyles = ''
  let sectionEls: Element[] = []

  if (wrapper) {
    const stickyClasses = ['sticky-cta', 'cta-bar']

    // 1. wrapper 직접 자식 <style> 수집
    for (const c of Array.from(wrapper.children)) {
      if (c.tagName.toLowerCase() === 'style') floatingStyles += c.outerHTML + '\n'
    }

    // 2. style/script/sticky 제외한 직접 자식
    const visibleChildren = Array.from(wrapper.children).filter((c) => {
      const tag = c.tagName.toLowerCase()
      if (tag === 'style' || tag === 'script') return false
      return !stickyClasses.some((s) => (c as HTMLElement).className?.includes(s))
    })

    sectionEls = visibleChildren

    // 3. 단일 래퍼 div일 때: 내부 <style>도 수집한 뒤 언래핑
    if (visibleChildren.length === 1) {
      const only = visibleChildren[0]
      if (['div', 'main', 'article'].includes(only.tagName.toLowerCase())) {
        for (const c of Array.from(only.children)) {
          if (c.tagName.toLowerCase() === 'style') floatingStyles += c.outerHTML + '\n'
        }
        const inner = Array.from(only.children).filter((c) => {
          const tag = c.tagName.toLowerCase()
          return tag !== 'style' && tag !== 'script' &&
            !stickyClasses.some((s) => (c as HTMLElement).className?.includes(s))
        })
        if (inner.length > 1) sectionEls = inner
      }
    }
  }

  // head는 모든 스타일 수집이 끝난 뒤 구성
  const head =
    `<!DOCTYPE html>\n<html lang="ko">\n<head>\n` +
    doc.head.innerHTML +
    (floatingStyles ? `\n${floatingStyles}` : '') +
    `\n</head>\n<body>\n<div class="detail-wrap">\n`

  if (!wrapper) return { head, sections: [{ id: 'sec-0', name: '전체', html: fullHtml }], stickyHtml: '' }

  const stickyEl = wrapper.querySelector('.sticky-cta, .cta-bar')
  const stickyHtml = stickyEl?.outerHTML ?? ''

  const sections: Section[] = sectionEls.map((child, i) => ({
    id: `sec-${i}-${Math.random().toString(36).slice(2, 7)}`,
    name: getSectionName(child as HTMLElement),
    html: child.outerHTML,
  }))

  return { head, sections, stickyHtml }
}

function getSectionName(el: HTMLElement): string {
  const eyebrow = el.querySelector('.s-eyebrow, .label, .hero-eyebrow')
  if (eyebrow?.textContent?.trim()) return eyebrow.textContent.trim()
  const h = el.querySelector('h1, h2, h3')
  if (h?.textContent) {
    const t = h.textContent.trim()
    return t.length > 20 ? t.slice(0, 20) + '…' : t
  }
  const cls = el.className ?? ''
  if (cls.includes('hero')) return '메인 배너'
  if (cls.includes('section-divider')) return '── 구분선'
  if (cls.includes('divider-dot')) return '• • •'
  const text = el.textContent?.trim()
  if (text && text.length > 0) return text.length > 20 ? text.slice(0, 20) + '…' : text
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

  /* ── 섹션 클릭 시 미리보기에서 해당 섹션으로 스크롤 + 하이라이트 ── */
  const scrollToSection = useCallback((idx: number) => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument) return
    const wrapper = iframe.contentDocument.querySelector('.detail-wrap')
    if (!wrapper) return
    const children = Array.from(wrapper.children).filter((c) => {
      const tag = c.tagName.toLowerCase()
      return tag !== 'style' && tag !== 'script'
    })
    const target = children[idx] as HTMLElement | undefined
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const prev = target.style.outline
    target.style.outline = '3px solid rgba(59,130,246,0.7)'
    target.style.borderRadius = '4px'
    setTimeout(() => {
      target.style.outline = prev
      target.style.borderRadius = ''
    }, 1400)
  }, [])

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
      const tagName = child.tagName.toLowerCase()
      if (tagName === 'style' || tagName === 'script') continue  // head로 이동된 스타일 제외
      const cls = (child as HTMLElement).className ?? ''
      if (cls.includes('sticky-cta') || cls.includes('cta-bar')) continue
      const prev = sections[i]
      updated.push({
        id: prev?.id ?? `sec-sync-${i}`,
        name: getSectionName(child as HTMLElement),
        html: getCleanHtml(child),
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

  /* ── 텍스트만 추출 → .doc 다운로드 ── */
  const handleExtractText = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument) return
    const wrapper = iframe.contentDocument.querySelector('.detail-wrap')
    if (!wrapper) return

    const sectionEls = Array.from(wrapper.children).filter((c) => {
      const tag = c.tagName.toLowerCase()
      const cls = (c as HTMLElement).className || ''
      return tag !== 'style' && tag !== 'script' &&
             !cls.includes('sticky-cta') && !cls.includes('cta-bar')
    })

    const allLines: string[][] = []
    sectionEls.forEach((sec) => {
      const clone = sec.cloneNode(true) as Element
      clone.querySelectorAll('.__edit-del, .__edit-add').forEach((e) => e.remove())
      const lines = extractSectionLines(clone)
      if (lines.length > 0) allLines.push(lines)
    })
    if (allLines.length === 0) return

    // 섹션별 Word HTML 조립
    const bodyContent = allLines.map((lines, idx) => {
      const sep = idx > 0 ? '<p style="border-top:1px solid #ddd;margin:12pt 0">&nbsp;</p>' : ''
      const rows = lines.map((line) => {
        if (line.startsWith('Q. '))                       return `<p><strong>${line}</strong></p>`
        if (line.startsWith('A. '))                       return `<p style="margin-left:16pt">${line}</p>`
        if (line.startsWith('[') && line.endsWith(']'))   return `<p style="font-size:8pt;color:#888;letter-spacing:2px">${line}</p>`
        if (line.startsWith('• '))                        return `<p style="margin-left:16pt">${line}</p>`
        return `<p>${line}</p>`
      }).join('\n')
      return sep + rows
    }).join('\n')

    const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8">
<style>
body{font-family:'맑은 고딕',sans-serif;font-size:10pt;line-height:1.75;margin:2cm}
p{margin:3pt 0}strong{font-weight:bold}
</style></head>
<body>${bodyContent}</body></html>`

    const d = new Date()
    const yy = String(d.getFullYear()).slice(2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')

    const blob = new Blob(['﻿' + wordHtml], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${yy}${mm}${dd}_상세페이지_문안.doc`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

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
                      className="group flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => scrollToSection(idx)}>
                      <span className="text-[11px] text-gray-400 w-4 shrink-0 text-center font-mono">{idx + 1}</span>
                      <span className="flex-1 text-xs text-gray-700 truncate" title="클릭하면 미리보기에서 해당 섹션으로 이동">{sec.name}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); moveUp(idx) }} disabled={idx === 0} title="위로"
                          className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-25 disabled:cursor-not-allowed">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveDown(idx) }} disabled={idx === sections.length - 1} title="아래로"
                          className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-25 disabled:cursor-not-allowed">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); addSectionAfter(idx) }} title="아래에 섹션 추가"
                          className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteSection(idx) }} title="섹션 삭제"
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
                    텍스트 클릭 → 문안 직접 수정 · 항목 위 마우스 → ✕ 삭제 · 왼쪽 섹션 클릭 → 해당 위치로 이동
                  </span>
                )}
              </div>
              {hasResult && !isLoading && (
                <div className="flex items-center gap-2">
                  <button onClick={handleExtractText}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="8" y1="13" x2="16" y2="13"/>
                      <line x1="8" y1="17" x2="16" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    텍스트만 추출하기
                  </button>
                  <button onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    HTML 저장
                  </button>
                </div>
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
