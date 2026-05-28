import { NextRequest, NextResponse } from 'next/server'
import * as path from 'path'
import * as fs from 'fs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PizZip = require('pizzip')

// XML 특수문자 이스케이프
function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 한 단락 XML 생성 (흰색 텍스트, 크기 지정)
function para(text: string, sz = 1400, bold = false, align = 'l'): string {
  if (!text.trim()) return `<a:p><a:endParaRPr lang="ko-KR" dirty="0"/></a:p>`
  return `<a:p><a:pPr algn="${align}"/><a:r><a:rPr lang="ko-KR" altLang="en-US" sz="${sz}" b="${bold ? 1 : 0}" dirty="0"><a:solidFill><a:prstClr val="white"/></a:solidFill></a:rPr><a:t>${escXml(text)}</a:t></a:r></a:p>`
}

// shape[0]의 txBody를 교체할 새 txBody 생성
function buildTxBody(paragraphs: string[]): string {
  return `<p:txBody><a:bodyPr rtlCol="0" anchor="t" wrap="square"><a:normAutofit/></a:bodyPr><a:lstStyle/>${paragraphs.join('')}</p:txBody>`
}

// 슬라이드별 콘텐츠 → 단락 배열 변환
type SlideData = Record<string, string>

function slide3Paragraphs(d: SlideData): string[] {
  const lines: string[] = []
  if (d['브랜드명']) lines.push(para(`브랜드명: ${d['브랜드명']}`, 1400, true))
  if (d['제품명']) lines.push(para(`제품명: ${d['제품명']}`, 1400, true))
  if (d['제품컨셉']) lines.push(para(`제품 컨셉: ${d['제품컨셉']}`, 1200))
  lines.push(para(''))
  const 소구점 = [1,2,3,4].map(i => d[`핵심소구점${i}`]).filter(Boolean)
  if (소구점.length) {
    lines.push(para('핵심 소구점', 1200, true))
    소구점.forEach((v, i) => lines.push(para(`${i+1}. ${v}`, 1200)))
    lines.push(para(''))
  }
  const 성분 = [1,2,3,4].map(i => d[`핵심성분${i}`]).filter(Boolean)
  if (성분.length) {
    lines.push(para('핵심 성분', 1200, true))
    성분.forEach((v, i) => lines.push(para(`${i+1}. ${v}`, 1200)))
    lines.push(para(''))
  }
  if (d['런칭일']) lines.push(para(`예상 런칭일: ${d['런칭일']}`, 1200))
  if (d['용량및판매가']) lines.push(para(`용량 및 예상 판매가: ${d['용량및판매가']}`, 1200))
  return lines
}

function slide8Paragraphs(d: SlideData): string[] {
  const lines: string[] = []
  if (d['기획의도']) {
    lines.push(para('기획의도', 1400, true))
    d['기획의도'].split('\n').forEach(l => lines.push(para(l, 1200)))
    lines.push(para(''))
  }
  if (d['출시당위성']) {
    lines.push(para('출시 당위성', 1400, true))
    d['출시당위성'].split('\n').forEach(l => lines.push(para(l, 1200)))
  }
  return lines
}

function slide9Paragraphs(d: SlideData): string[] {
  const lines: string[] = []
  if (d['메인타겟페르소나']) {
    lines.push(para('메인 타겟 고객 (페르소나)', 1400, true))
    lines.push(para(d['메인타겟페르소나'], 1200))
    lines.push(para(''))
  }
  const 대상 = [1,2,3,4].map(i => d[`추천대상${i}`]).filter(Boolean)
  if (대상.length) {
    lines.push(para('이런 분들께 추천합니다', 1400, true))
    대상.forEach((v, i) => lines.push(para(`${i+1}. ${v}`, 1200)))
  }
  return lines
}

function slide1012Paragraphs(d: SlideData, 제목Key: string, 내용Key: string): string[] {
  const lines: string[] = []
  if (d[제목Key]) lines.push(para(d[제목Key], 1600, true))
  lines.push(para(''))
  if (d[내용Key]) d[내용Key].split('\n').forEach(l => lines.push(para(l, 1200)))
  return lines
}

export async function POST(request: NextRequest) {
  const { slides } = await request.json() as { slides: Record<string, SlideData> }

  const templatePath = path.join(process.cwd(), '최종기획안 양식.pptx')
  if (!fs.existsSync(templatePath)) {
    return NextResponse.json({ error: 'PPT 템플릿 파일을 찾을 수 없습니다.' }, { status: 500 })
  }

  const buf = fs.readFileSync(templatePath)
  const zip = new PizZip(buf)

  // 슬라이드별 콘텐츠 주입 (shape[0]의 txBody 교체)
  const slideMap: Record<string, { slideNum: number; getParagraphs: (d: SlideData) => string[] }> = {
    '슬라이드3':  { slideNum: 3,  getParagraphs: slide3Paragraphs },
    '슬라이드8':  { slideNum: 8,  getParagraphs: slide8Paragraphs },
    '슬라이드9':  { slideNum: 9,  getParagraphs: slide9Paragraphs },
    '슬라이드10': { slideNum: 10, getParagraphs: (d) => slide1012Paragraphs(d, '핵심소구점제목', '핵심소구점내용') },
    '슬라이드11': { slideNum: 11, getParagraphs: (d) => slide1012Paragraphs(d, '핵심소구점제목', '핵심소구점내용') },
    '슬라이드12': { slideNum: 12, getParagraphs: (d) => slide1012Paragraphs(d, '핵심소구점제목', '핵심소구점내용') },
    '슬라이드13': { slideNum: 13, getParagraphs: (d) => slide1012Paragraphs(d, '서브소구점제목', '서브소구점내용') },
  }

  console.log('[pptx] received slide keys:', Object.keys(slides))

  for (const [slideKey, { slideNum, getParagraphs }] of Object.entries(slideMap)) {
    const data = slides[slideKey]
    console.log(`[pptx] slide ${slideNum} (${slideKey}):`, data ? Object.entries(data).filter(([,v]) => v).length + ' filled fields' : 'NO DATA')
    if (!data) continue

    const slideFile = zip.file(`ppt/slides/slide${slideNum}.xml`)
    if (!slideFile) continue

    let xml = slideFile.asText()

    const paragraphs = getParagraphs(data)
    console.log(`[pptx] slide ${slideNum} paragraphs:`, paragraphs.length)
    if (paragraphs.length === 0) continue

    const newTxBody = buildTxBody(paragraphs)
    const before = xml
    xml = xml.replace(/<p:txBody>[\s\S]*?<\/p:txBody>/, newTxBody)
    console.log(`[pptx] slide ${slideNum} replaced:`, before !== xml)

    zip.file(`ppt/slides/slide${slideNum}.xml`, xml)
  }

  const output = zip.generate({ type: 'nodebuffer', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })

  const today = new Date()
  const yy = String(today.getFullYear()).slice(2)
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const filename = `${yy}${mm}${dd}_최종기획안.pptx`

  return new NextResponse(output, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
