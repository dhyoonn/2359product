import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { MODEL_LARGE, logTokenUsage } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MAX_FILE_SIZE = 10 * 1024 * 1024

type HistoryTurn = { role: 'user' | 'assistant'; content: string }

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function handleProposalStream(
  request: NextRequest,
  buildSystemPrompt: () => string,
  buildFirstContent: (userMessage: string, fileTexts: string[]) => string,
  buildFollowUpContent: (userMessage: string, currentHtml: string) => string,
): Promise<Response> {
  if (!checkRateLimit(getClientIp(request), 15)) {
    return new Response(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const formData = await request.formData()
  const userMessage = (formData.get('userMessage') as string) ?? ''
  const historyJson = (formData.get('history') as string) ?? '[]'
  const currentHtml = (formData.get('currentHtml') as string) ?? ''
  const files = formData.getAll('files') as File[]

  const history: HistoryTurn[] = JSON.parse(historyJson)
  const isFirst = !currentHtml

  // 파일 처리
  const fileTexts: string[] = []
  const pdfBlocks: Anthropic.DocumentBlockParam[] = []

  for (const file of files) {
    if (!file || file.size === 0 || file.size > MAX_FILE_SIZE) continue
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
    if (isPdf) {
      const buffer = await file.arrayBuffer()
      pdfBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: Buffer.from(buffer).toString('base64') },
      })
    } else {
      const raw = await file.text()
      fileTexts.push(`[${file.name}]\n${extractTextFromHtml(raw)}`)
    }
  }

  const currentContent = isFirst
    ? buildFirstContent(userMessage, fileTexts)
    : buildFollowUpContent(userMessage, currentHtml)

  const claudeMessages: Anthropic.MessageParam[] = [
    ...history.slice(-4).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.role === 'assistant'
        ? `MESSAGE: ${msg.content}\n---HTML---\n<!-- 이전 HTML 생략 -->`
        : msg.content,
    })),
    {
      role: 'user' as const,
      content: pdfBlocks.length > 0
        ? [...pdfBlocks, { type: 'text' as const, text: currentContent }]
        : currentContent,
    },
  ]

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: MODEL_LARGE,
          max_tokens: 32000,
          // 캐싱: 단계별 시스템 프롬프트는 대화 내내 동일 — 반복 요청(수정 등) 시 응답 시작 속도 개선
          system: [{ type: 'text', text: buildSystemPrompt(), cache_control: { type: 'ephemeral' } }],
          messages: claudeMessages,
          // Anthropic 내장 웹 검색 도구 — 논문·연구 자료 실시간 검색
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
        })
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
          // 웹 검색 시작 시 사용자에게 표시
          if (
            event.type === 'content_block_start' &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (event as any).content_block?.type === 'tool_use' &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (event as any).content_block?.name === 'web_search'
          ) {
            controller.enqueue(encoder.encode('\n\n🔍 *관련 논문·연구 자료 검색 중...*\n\n'))
          }
        }
        const finalMsg = await stream.finalMessage()
        logTokenUsage('proposal', finalMsg.usage.input_tokens, finalMsg.usage.output_tokens)
      } catch (err) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류'
        controller.enqueue(encoder.encode(`\nERROR:${msg}`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
