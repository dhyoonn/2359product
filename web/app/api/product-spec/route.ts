import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import * as path from 'path'
import * as fs from 'fs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XlsxPopulate = require('xlsx-populate')
import { buildProductSpecPrompt } from '@/lib/prompts/product-spec'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { MODEL_STANDARD, MAX_FILE_SIZE_DEFAULT } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MAX_FILE_SIZE = MAX_FILE_SIZE_DEFAULT

const CELL_MAP: Record<string, string> = {
  제품명: 'C3',
  제품유형: 'C4',
  유통기한: 'C6',
  제조사: 'C7',
  제품특징: 'C8',
}

export async function POST(request: NextRequest) {
  if (!checkRateLimit(getClientIp(request))) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: '파일을 첨부해주세요.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })
  }

  // HTML 파일 텍스트 추출
  const html = await file.text()
  const specContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Claude API 호출
  let fields: Record<string, string> = {}
  try {
    const message = await client.messages.create({
      model: MODEL_STANDARD,
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildProductSpecPrompt(specContent) }],
    })
    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      fields = JSON.parse(jsonMatch[0]) as Record<string, string>
    }
  } catch (err) {
    console.error('[product-spec] Claude API 오류:', err)
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: `AI 처리 중 오류: ${msg}` }, { status: 500 })
  }

  // xlsx 양식 읽기 및 셀 채우기 (스타일 보존)
  try {
    const templatePath = path.join(process.cwd(), '제품 사양서 기본 양식.xlsx')
    const fileBuffer = fs.readFileSync(templatePath)
    const wb = await XlsxPopulate.fromDataAsync(fileBuffer)
    const ws = wb.sheet('시트1')

    // 오늘 날짜 작성
    const today = new Date()
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`
    ws.cell('N2').value(`작성(개정)일자: ${dateStr}`)

    // 각 셀에 값 입력
    for (const [key, cell] of Object.entries(CELL_MAP)) {
      const val = fields[key] ?? ''
      if (val) ws.cell(cell).value(val)
    }

    const buffer = await wb.outputAsync()
    const base64 = Buffer.from(buffer).toString('base64')

    return NextResponse.json({ fields, xlsxBase64: base64 })
  } catch (err) {
    console.error('[product-spec] xlsx 처리 오류:', err)
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: `파일 생성 중 오류: ${msg}` }, { status: 500 })
  }
}
