import { NextResponse } from 'next/server'
import { getTodayTempCode } from '@/lib/temp-code'

export async function GET() {
  const code = getTodayTempCode()
  if (!code) {
    return NextResponse.json({ error: 'TEMP_PASSWORD_SECRET 환경변수가 설정되지 않았습니다.' }, { status: 500 })
  }
  return NextResponse.json({ code })
}
