import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildFinalPlanPrompt, buildFinalPlanRevisionPrompt } from '@/lib/prompts/final-plan'
import { assembleFinalPlanHtml, type FinalPlanAiContent } from '@/lib/final-plan-template'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { MODEL_LARGE } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MAX_FILE_SIZE = 10 * 1024 * 1024
const DELIMITER = '---HTML---'

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
  const currentHtml = (formData.get('currentHtml') as string) ?? ''
  const revisionRequest = (formData.get('revisionRequest') as string) ?? ''

  // 수정 요청: 기존 스트리밍 방식 유지
  if (currentHtml && revisionRequest) {
    const prompt = buildFinalPlanRevisionPrompt(revisionRequest, currentHtml)
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = client.messages.stream({
            model: MODEL_LARGE,
            max_tokens: 32000,
            messages: [{ role: 'user', content: prompt }],
          })
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : '알 수 없는 오류'
          controller.enqueue(encoder.encode(`\nERROR:${msg}`))
        } finally {
          controller.close()
        }
      },
    })
    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  // 최초 생성: JSON 방식
  const initialFiles = formData.getAll('initialFiles') as File[]
  const attachmentFiles = formData.getAll('attachmentFiles') as File[]
  const notionContent = (formData.get('notionContent') as string) ?? ''

  const oversized = [...initialFiles, ...attachmentFiles].find(f => f.size > MAX_FILE_SIZE)
  if (oversized) {
    return NextResponse.json({ error: `파일 크기는 10MB 이하여야 합니다. (${oversized.name})` }, { status: 400 })
  }

  const extractFile = async (file: File) => {
    const text = await file.text()
    return file.name.endsWith('.html') ? extractTextFromHtml(text) : text
  }

  const initialTexts = await Promise.all(initialFiles.map(extractFile))
  const attachmentTexts = await Promise.all(attachmentFiles.map(extractFile))
  const initialPlanContent = [...initialTexts, notionContent].filter(Boolean).join('\n\n')
  const attachmentContent = attachmentTexts.filter(Boolean).join('\n\n')

  const SCREENING_LABELS: Record<string, string> = { pass: '진행·가능', fail: '진행·불가', pending: '미진행' }
  const specJson = formData.get('specFields') as string
  let specContent = ''
  let specFields: Record<string, string> = {}
  if (specJson) {
    try {
      specFields = JSON.parse(specJson) as Record<string, string>
      specContent = Object.entries(specFields)
        .filter(([, v]) => v)
        .map(([k, v]) => {
          if (k === '수출_스크리닝_상태') {
            try {
              const screening = JSON.parse(v) as Record<string, { status: string; reason?: string }>
              const lines = Object.entries(screening).map(([country, entry]) => {
                const label = SCREENING_LABELS[entry.status] ?? entry.status
                return `  ${country}: ${label}${entry.reason ? ` (${entry.reason})` : ''}`
              })
              return `수출_스크리닝_상태:\n${lines.join('\n')}`
            } catch { return `${k}: ${v}` }
          }
          return `${k}: ${v}`
        })
        .join('\n')
    } catch { /* 파싱 실패 시 빈 값 */ }
  }

  if (!initialPlanContent && !specContent) {
    return NextResponse.json({ error: '초기 기획안 파일 또는 최종 SPEC을 입력해주세요.' }, { status: 400 })
  }

  const today = new Date()
  const currentDate = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일`
  const prompt = buildFinalPlanPrompt(initialPlanContent, specContent, attachmentContent, currentDate)

  const encoder = new TextEncoder()
  // 생성 중에는 원문 델타를 그대로 흘려보내 진행 상황을 표시하고,
  // 완료되면 이 구분자 뒤에 조립된 최종 HTML을 이어붙여 보낸다.
  const RESULT_DELIMITER = '\n---FINALPLAN-RESULT---\n'

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: MODEL_LARGE,
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }

        const message = await stream.finalMessage()
        const raw = message.content[0].type === 'text' ? message.content[0].text : ''

        const delimIdx = raw.indexOf(DELIMITER)
        let aiContent: FinalPlanAiContent

        if (delimIdx !== -1) {
          // 구분자 방식: JSON + ---HTML--- + HTML
          const jsonPart = raw.slice(0, delimIdx).trim()
          const htmlPart = raw.slice(delimIdx + DELIMITER.length).trim()
          const cleanedJson = jsonPart.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
          const partial = JSON.parse(cleanedJson) as Omit<FinalPlanAiContent, 'design_html'>
          aiContent = { ...partial, design_html: htmlPart }
        } else {
          // 폴백: JSON에 design_html이 포함된 구 방식
          const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
          aiContent = JSON.parse(cleaned) as FinalPlanAiContent
        }

        const html = assembleFinalPlanHtml(aiContent, specFields, currentDate)
        controller.enqueue(encoder.encode(RESULT_DELIMITER + html))
      } catch (err) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류'
        controller.enqueue(encoder.encode(`${RESULT_DELIMITER}ERROR:생성 중 오류: ${msg}`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
