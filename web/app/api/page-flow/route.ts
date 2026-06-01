import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  // 기본 모드 (레퍼런스 없을 때) — AKKBELL 컴포넌트 시스템
  PAGE_FLOW_SYSTEM_PROMPT,
  PAGE_FLOW_USER_PROMPT,
  PAGE_FLOW_COMPONENT_GUIDE,
  PAGE_FLOW_HTML_TEMPLATE_OPEN,
  PAGE_FLOW_HTML_TEMPLATE_CLOSE,
  // 레퍼런스 모드 (레퍼런스 있을 때) — 자유로운 HTML 생성
  PAGE_FLOW_REF_SYSTEM_PROMPT,
  PAGE_FLOW_REF_USER_PROMPT,
  PAGE_FLOW_REF_HTML_TEMPLATE_OPEN,
} from '@/lib/prompts/page-flow'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { MODEL_LARGE } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

// HTML에서 텍스트 추출 (기획안 HTML 파일용)
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}



export async function POST(request: NextRequest) {
  if (!checkRateLimit(getClientIp(request))) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const formData = await request.formData()
  const planFiles = formData.getAll('planFiles') as File[]
  const marketingFiles = formData.getAll('marketingFiles') as File[]
  const refImages = formData.getAll('refImages') as File[]
  const refPdfs = formData.getAll('refPdfs') as File[]
  const notionContent = (formData.get('notionContent') as string) ?? ''
  const marketingNotionContent = (formData.get('marketingNotionContent') as string) ?? ''

  if (planFiles.length === 0 && !notionContent) {
    return NextResponse.json({ error: '기획안 파일을 첨부해주세요.' }, { status: 400 })
  }

  const oversized = [...planFiles, ...marketingFiles, ...refImages, ...refPdfs].find((f) => f.size > MAX_FILE_SIZE)
  if (oversized) {
    return NextResponse.json({ error: `파일 크기는 20MB 이하여야 합니다. (${oversized.name})` }, { status: 400 })
  }

  // Claude에게 보낼 메시지 블록 구성
  const contentBlocks: Anthropic.MessageParam['content'] = []

  // 1-A. 레퍼런스 스크린샷 이미지 (JPG/PNG)
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const validRefImages = refImages.filter((f) => ALLOWED_IMAGE_TYPES.includes(f.type) || f.name.match(/\.(jpg|jpeg|png|webp)$/i))

  if (validRefImages.length > 0) {
    contentBlocks.push({
      type: 'text',
      text: `[레퍼런스 스크린샷 ${validRefImages.length}장]\n아래 이미지들은 참고할 상세 페이지의 실제 화면입니다.\n이미지를 보고 섹션 구성, 순서, 각 섹션의 역할을 파악하세요.\n디자인 스타일 복사는 금지 — 구조와 플로우만 참고합니다.`,
    })
    for (const img of validRefImages) {
      const buffer = await img.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      // 미디어 타입 결정
      const mediaType = img.type.startsWith('image/') ? img.type : 'image/jpeg'
      contentBlocks.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp', data: base64 },
      } as Anthropic.ImageBlockParam)
    }
  }

  // 1-B. 레퍼런스 PDF
  if (refPdfs.length > 0) {
    contentBlocks.push({
      type: 'text',
      text: `[레퍼런스 PDF ${refPdfs.length}개]\n아래 PDF는 참고할 상세 페이지 자료입니다.\n섹션 구성, 순서, 각 섹션의 역할을 파악하세요. 디자인 복사는 금지입니다.`,
    })
    for (const pdf of refPdfs) {
      const buffer = await pdf.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      contentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        title: `레퍼런스: ${pdf.name}`,
      } as Anthropic.DocumentBlockParam)
    }
  }

  // 2. 기획안 파일들
  for (const file of planFiles) {
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
    if (isPdf) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      contentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        title: `기획안: ${file.name}`,
      } as Anthropic.DocumentBlockParam)
    } else {
      const html = await file.text()
      const text = extractTextFromHtml(html)
      contentBlocks.push({ type: 'text', text: `[기획안: ${file.name}]\n${text}` })
    }
  }

  // 노션 내용 (기획안)
  if (notionContent) {
    contentBlocks.push({ type: 'text', text: `[기획안 (노션)]\n${notionContent}` })
  }

  // 3. 마케팅 자료 파일들 + 노션
  for (const file of marketingFiles) {
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
    if (isPdf) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      contentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        title: `마케팅 자료: ${file.name}`,
      } as Anthropic.DocumentBlockParam)
    } else {
      contentBlocks.push({
        type: 'text',
        text: `[마케팅 자료: ${file.name}] (PPT 형식 — 파일명 참고용)`,
      })
    }
  }

  // 마케팅 자료 노션 내용
  if (marketingNotionContent) {
    contentBlocks.push({ type: 'text', text: `[마케팅 자료 (노션)]\n${marketingNotionContent}` })
  }

  // 레퍼런스 유무에 따라 모드 분기
  const hasReference = validRefImages.length > 0 || refPdfs.length > 0

  // 4. 작업 지침 추가
  if (hasReference) {
    // 레퍼런스 모드: 컴포넌트 가이드 없이 자유 생성
    contentBlocks.push({
      type: 'text',
      text: PAGE_FLOW_REF_USER_PROMPT +
        '\n위 레퍼런스와 기획안을 바탕으로 상세 페이지 섹션 HTML을 출력하세요. DOCTYPE·html·head·body 태그 없이 섹션 내용만 출력하세요.',
    })
  } else {
    // 기본 모드: AKKBELL 컴포넌트 시스템 사용
    contentBlocks.push({
      type: 'text',
      text: PAGE_FLOW_COMPONENT_GUIDE + PAGE_FLOW_USER_PROMPT +
        '\n위 자료를 바탕으로 섹션 HTML만 출력하세요. DOCTYPE·html·head·body 태그 없이, <section> 태그들만 출력하세요.',
    })
  }

  // 시스템 프롬프트 선택
  const systemPrompt = hasReference ? PAGE_FLOW_REF_SYSTEM_PROMPT : PAGE_FLOW_SYSTEM_PROMPT

  try {
    // 레퍼런스 모드는 48K 토큰으로 10분 초과 가능 → 스트리밍 필수
    const stream = client.messages.stream({
      model: MODEL_LARGE,
      max_tokens: hasReference ? 48000 : 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: contentBlocks }],
    })
    const message = await stream.finalMessage()

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // 코드블록 마커 및 전체 HTML 껍데기 제거
    let sectionsOnly = raw
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .replace(/<!DOCTYPE[\s\S]*?<body[^>]*>/i, '')
      .replace(/<\/body>[\s\S]*<\/html>/i, '')
      .trim()

    // AI가 <div class="detail-wrap">을 직접 감쌌을 경우 제거
    const dwMatch = sectionsOnly.match(/^<div[^>]+class="[^"]*detail-wrap[^"]*"[^>]*>([\s\S]*)<\/div>\s*$/i)
    if (dwMatch) sectionsOnly = dwMatch[1].trim()

    if (!sectionsOnly) {
      return NextResponse.json({ error: 'AI가 내용을 생성하지 못했습니다. 다시 시도해주세요.' }, { status: 500 })
    }

    // HTML 템플릿 선택: 레퍼런스 모드는 최소 CSS, 기본 모드는 AKKBELL CSS
    const templateOpen = hasReference ? PAGE_FLOW_REF_HTML_TEMPLATE_OPEN : PAGE_FLOW_HTML_TEMPLATE_OPEN
    const html = templateOpen + sectionsOnly + PAGE_FLOW_HTML_TEMPLATE_CLOSE

    return NextResponse.json({ html })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: `생성 중 오류: ${msg}` }, { status: 500 })
  }
}
