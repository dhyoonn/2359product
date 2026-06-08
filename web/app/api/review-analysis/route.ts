import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XlsxPopulate = require('xlsx-populate')
import { buildReviewAnalysisPrompt, type ReviewSource } from '@/lib/prompts/review-analysis'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { MODEL_LARGE, logTokenUsage, MAX_FILE_SIZE_DEFAULT } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 플랫폼별 컬럼 인덱스
const COLS: Record<ReviewSource, { rating: number; content: number }> = {
  oliveyoung: { rating: 1, content: 4 },
  amazon:     { rating: 2, content: 7 },
}

// CSV 한 줄 파싱 (따옴표 안의 쉼표 처리)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

export async function POST(request: NextRequest) {
  if (!checkRateLimit(getClientIp(request))) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const productName = (formData.get('productName') as string) ?? ''
  const source = ((formData.get('source') as string) ?? 'oliveyoung') as ReviewSource

  if (!file) {
    return NextResponse.json({ error: '파일을 첨부해주세요.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE_DEFAULT) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })
  }

  const col = COLS[source]
  let reviews: { rating: number; content: string }[]

  const isCsv = file.name.toLowerCase().endsWith('.csv')

  try {
    if (isCsv) {
      // CSV 파싱 (아마존)
      const text = await file.text()
      const lines = text.replace(/^﻿/, '').split('\n').filter((l) => l.trim())
      reviews = lines
        .slice(1) // 헤더 제외
        .map((line) => {
          const cols = parseCSVLine(line)
          return {
            rating: Number(cols[col.rating]) || 0,
            content: (cols[col.content] ?? '').trim(),
          }
        })
        .filter((r) => r.content.length > 0 && r.rating >= 1 && r.rating <= 5)
    } else {
      // xlsx 파싱 (올리브영)
      const buffer = Buffer.from(await file.arrayBuffer())
      const wb = await XlsxPopulate.fromDataAsync(buffer)
      const rows = wb.sheet(0).usedRange()?.value() as (string | number | null)[][] | undefined
      if (!rows || rows.length < 2) {
        return NextResponse.json({ error: '리뷰 데이터가 없습니다. 파일을 확인해주세요.' }, { status: 400 })
      }
      reviews = rows
        .slice(1)
        .map((row) => ({
          rating: Number(row[col.rating]) || 0,
          content: String(row[col.content] ?? '').trim(),
        }))
        .filter((r) => r.content.length > 0 && r.rating >= 1 && r.rating <= 5)
    }
  } catch {
    return NextResponse.json({ error: '파일을 읽을 수 없습니다. 올바른 형식인지 확인해주세요.' }, { status: 400 })
  }

  if (reviews.length === 0) {
    return NextResponse.json({ error: '분석 가능한 리뷰가 없습니다. 파일 형식을 확인해주세요.' }, { status: 400 })
  }

  const prompt = buildReviewAnalysisPrompt(productName, reviews, source)

  try {
    const message = await client.messages.stream({
      model: MODEL_LARGE,
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    }).finalMessage()

    logTokenUsage('review-analysis', message.usage.input_tokens, message.usage.output_tokens)

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const html = raw.replace(/^```html\s*/i, '').replace(/\s*```$/i, '').trim()

    return NextResponse.json({ html, reviewCount: reviews.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    return NextResponse.json({ error: `AI 처리 중 오류: ${msg}` }, { status: 500 })
  }
}
