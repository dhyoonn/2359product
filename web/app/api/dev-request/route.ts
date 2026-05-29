import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildDevRequestPrompt } from '@/lib/prompts/dev-request'
import { type ProductType } from '@/lib/dev-request-fields'
import { fetchNotionPageText } from '@/lib/notion'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { MODEL_STANDARD, MAX_FILE_SIZE_DEFAULT } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MAX_FILE_SIZE = MAX_FILE_SIZE_DEFAULT

export async function POST(request: NextRequest) {
  if (!checkRateLimit(getClientIp(request))) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const formData = await request.formData()
  const productType = formData.get('productType') as ProductType
  const planningContent = (formData.get('planningContent') as string) ?? ''
  const file = formData.get('file') as File | null

  // 노션 URL들 읽어서 기획안 내용에 추가
  const notionUrlsJson = (formData.get('notionUrls') as string) ?? '[]'
  let notionContent = ''
  try {
    const notionUrls: string[] = JSON.parse(notionUrlsJson)
    if (notionUrls.length > 0) {
      const results = await Promise.all(
        notionUrls.map((url) =>
          fetchNotionPageText(url)
            .then((r) => ({ text: r.text, error: null }))
            .catch((e: unknown) => ({ text: '', error: e instanceof Error ? e.message : '알 수 없는 오류' }))
        )
      )
      const failed = results.filter((r) => r.error)
      if (failed.length > 0) {
        return NextResponse.json({
          error: `노션 페이지를 읽을 수 없습니다. 해당 페이지가 Integration에 공유되어 있는지 확인해주세요.\n오류: ${failed[0].error}`,
        }, { status: 400 })
      }
      notionContent = results.map((r) => r.text).filter(Boolean).join('\n\n')
    }
  } catch { /* JSON 파싱 실패 시 무시 */ }

  const combinedContent = [planningContent, notionContent].filter(Boolean).join('\n\n')

  if (!productType) {
    return NextResponse.json({ error: '제품 유형을 선택해주세요.' }, { status: 400 })
  }
  if (!file && !combinedContent.trim()) {
    return NextResponse.json({ error: '기획안 내용을 입력하거나 파일을 첨부해주세요.' }, { status: 400 })
  }
  if (file && file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })
  }

  const prompt = buildDevRequestPrompt(productType, combinedContent || '첨부 파일의 내용을 분석하여 작성해주세요.')

  let messageContent: Anthropic.MessageParam['content']

  if (file) {
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')

    if (isPdf) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      messageContent = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        } as Anthropic.DocumentBlockParam,
        { type: 'text', text: prompt },
      ]
    } else {
      // HTML 파일: 태그 제거 후 텍스트 추출
      const html = await file.text()
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      const allContent = combinedContent ? `${combinedContent}\n\n[파일 내용]\n${text}` : text
      messageContent = buildDevRequestPrompt(productType, allContent)
    }
  } else {
    messageContent = prompt
  }

  try {
    const message = await client.messages.create({
      model: MODEL_STANDARD,
      max_tokens: 4096,
      messages: [{ role: 'user', content: messageContent }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.' }, { status: 500 })
    }

    const fields = JSON.parse(jsonMatch[0]) as Record<string, string>
    return NextResponse.json({ fields })
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    return NextResponse.json({ error: `AI 처리 중 오류: ${message}` }, { status: 500 })
  }
}
