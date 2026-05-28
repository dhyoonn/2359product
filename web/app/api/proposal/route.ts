import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildProposalSystemPrompt,
  buildFirstTurnContent,
  buildRevisionContent,
} from '@/lib/prompts/proposal'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { MODEL_LARGE } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MAX_FILE_SIZE = 10 * 1024 * 1024

type HistoryTurn = { role: 'user' | 'assistant'; content: string }

export async function POST(request: NextRequest) {
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
  const file = formData.get('file') as File | null

  const history: HistoryTurn[] = JSON.parse(historyJson)
  const isFirst = !currentHtml

  if (file && file.size > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ error: '파일 크기는 10MB 이하여야 합니다.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 파일 텍스트 추출 (첫 메시지에서만)
  let fileText = ''
  let pdfBlock: Anthropic.DocumentBlockParam | null = null

  if (file) {
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
    if (isPdf) {
      const buffer = await file.arrayBuffer()
      pdfBlock = {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: Buffer.from(buffer).toString('base64') },
      }
    } else {
      const html = await file.text()
      fileText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }
  }

  const fullUserMessage = fileText
    ? `${userMessage}\n\n[첨부 파일 내용]\n${fileText}`
    : userMessage

  // 현재 메시지 콘텐츠 구성
  const currentContent = isFirst
    ? buildFirstTurnContent(fullUserMessage || '첨부 파일을 바탕으로 기획안을 작성해주세요.')
    : buildRevisionContent(fullUserMessage, currentHtml)

  // Claude API 메시지 구성 (히스토리 최근 4개 이내)
  const recentHistory = history.slice(-4)
  const claudeMessages: Anthropic.MessageParam[] = [
    ...recentHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.role === 'assistant'
        ? `MESSAGE: ${msg.content}\n---HTML---\n<!-- 이전 HTML 생략 -->`
        : msg.content,
    })),
    {
      role: 'user' as const,
      content: pdfBlock
        ? [pdfBlock, { type: 'text' as const, text: currentContent }]
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
          system: buildProposalSystemPrompt(),
          messages: claudeMessages,
          // Anthropic 내장 웹 검색 도구
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: [{ type: 'web_search_20250305' } as any],
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

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
