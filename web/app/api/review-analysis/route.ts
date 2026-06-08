import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XlsxPopulate = require('xlsx-populate')
import { buildReviewAnalysisPrompt } from '@/lib/prompts/review-analysis'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { MODEL_LARGE, logTokenUsage, MAX_FILE_SIZE_DEFAULT } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 올리브영 리뷰 엑셀 컬럼 인덱스
const COL = { RATING: 1, CONTENT: 4 }

export async function POST(request: NextRequest) {
  if (!checkRateLimit(getClientIp(request))) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const productName = (formData.get('productName') as string) ?? ''

  if (!file) {
    return NextResponse.json({ error: '엑셀 파일을 첨부해주세요.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE_DEFAULT) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })
  }

  // 엑셀 파싱
  let reviews: { rating: number; content: string }[]
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = await XlsxPopulate.fromDataAsync(buffer)
    const rows = wb.sheet(0).usedRange()?.value() as (string | number | null)[][] | undefined

    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: '리뷰 데이터가 없습니다. 파일을 확인해주세요.' }, { status: 400 })
    }

    reviews = rows
      .slice(1) // 헤더 제외
      .map((row) => ({
        rating: Number(row[COL.RATING]) || 0,
        content: String(row[COL.CONTENT] ?? '').trim(),
      }))
      .filter((r) => r.content.length > 0 && r.rating >= 1 && r.rating <= 5)
  } catch {
    return NextResponse.json({ error: '엑셀 파일을 읽을 수 없습니다. 올바른 형식인지 확인해주세요.' }, { status: 400 })
  }

  if (reviews.length === 0) {
    return NextResponse.json({ error: '분석 가능한 리뷰가 없습니다. 파일 형식을 확인해주세요.' }, { status: 400 })
  }

  const prompt = buildReviewAnalysisPrompt(productName, reviews)

  try {
    const message = await client.messages.stream({
      model: MODEL_LARGE,
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    }).finalMessage()

    logTokenUsage('review-analysis', message.usage.input_tokens, message.usage.output_tokens)

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    // AI가 코드블록으로 감쌀 경우 제거
    const html = raw.replace(/^```html\s*/i, '').replace(/\s*```$/i, '').trim()

    return NextResponse.json({ html, reviewCount: reviews.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    return NextResponse.json({ error: `AI 처리 중 오류: ${msg}` }, { status: 500 })
  }
}
