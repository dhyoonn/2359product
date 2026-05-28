import { NextRequest, NextResponse } from 'next/server'
import { fetchNotionPageText } from '@/lib/notion'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  if (!checkRateLimit(getClientIp(request), 20)) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const { url } = await request.json() as { url: string }
  if (!url) return NextResponse.json({ error: '노션 페이지 URL을 입력해주세요.' }, { status: 400 })

  try {
    const { title, text } = await fetchNotionPageText(url)
    return NextResponse.json({ title, text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    if (msg.includes('Could not find')) {
      return NextResponse.json({ error: '페이지를 찾을 수 없습니다. Integration이 해당 페이지에 연결되어 있는지 확인해주세요.' }, { status: 404 })
    }
    return NextResponse.json({ error: `노션 오류: ${msg}` }, { status: 500 })
  }
}
